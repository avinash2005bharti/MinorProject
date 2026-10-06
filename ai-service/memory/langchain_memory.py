"""
LangChain Memory Architecture for CSE Department AI Microservice
================================================================
Implements production-grade Short-Term Memory (STM) and Long-Term Memory (LTM)
using LangChain Core primitives:
1. Short-Term Memory (STM):
   - MongoChatMessageHistory (implements BaseChatMessageHistory)
   - LangChainShortTermMemory: Active session working memory, context window (10 turns),
     task state, constraints, pending approvals, and TTL awareness.
2. Long-Term Memory (LTM):
   - LangChainLongTermMemory: Semantic vector memory via Qdrant ('erp_long_term_memory')
     and structured user profiles in MongoDB ('users_memory').
   - LangChainLTMRetriever: Runnable BaseRetriever returning LangChain Document objects.
   - Automated semantic fact & preference extraction.
3. LangChainMemoryCoordinator:
   - Unified interface providing single-call prompt injection context for all agents.
"""

import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from loguru import logger
from dotenv import load_dotenv

# LangChain Core Primitives
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.messages import (
    BaseMessage,
    HumanMessage,
    AIMessage,
    SystemMessage,
    ToolMessage
)
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from pydantic import Field

from memory.mongo_memory import mongo_memory
from rag.qdrant_manager import qdrant_manager
from llm.provider import llm_provider

load_dotenv()


# ============================================================================
# 1. Short-Term Memory (STM): LangChain BaseChatMessageHistory Implementation
# ============================================================================

class MongoChatMessageHistory(BaseChatMessageHistory):
    """
    LangChain BaseChatMessageHistory backed by MongoDB:
    - Persists message history into 'conversations' (full thread)
    - Syncs fast sliding window into 'short_term_memory.contextWindow' (10 items)
    - Returns LangChain BaseMessage objects (HumanMessage, AIMessage, SystemMessage)
    """
    def __init__(self, session_id: str, user_id: str = "user_default", role: str = "student"):
        self.session_id = session_id
        self.user_id = str(user_id)
        self.role = role
        self.mongo = mongo_memory

    @property
    def messages(self) -> List[BaseMessage]:
        """
        Retrieves messages from MongoDB and converts them to LangChain BaseMessage objects.
        """
        conv = self.mongo.get_conversation(self.session_id)
        raw_msgs = []
        if conv and "messages" in conv:
            raw_msgs = conv.get("messages", [])
        else:
            # Fallback to STM contextWindow
            stm = self.mongo.get_stm(self.session_id, self.session_id)
            for cw in stm.get("contextWindow", []):
                raw_msgs.append({
                    "sender": cw.get("role", "user"),
                    "content": cw.get("text", ""),
                    "timestamp": cw.get("timestamp")
                })

        lc_messages: List[BaseMessage] = []
        for m in raw_msgs:
            sender = (m.get("sender") or m.get("role") or "").lower()
            content = m.get("content") or m.get("text") or ""
            if not content:
                continue

            if sender in ["user", "human", "student", "faculty", "hod", "admin"]:
                lc_messages.append(HumanMessage(content=content))
            elif sender in ["assistant", "ai", "copilot"]:
                lc_messages.append(AIMessage(content=content))
            elif sender in ["system"]:
                lc_messages.append(SystemMessage(content=content))
            else:
                lc_messages.append(HumanMessage(content=content))

        return lc_messages

    def add_message(self, message: BaseMessage) -> None:
        """
        Appends a LangChain BaseMessage to MongoDB conversations and STM.
        """
        if isinstance(message, HumanMessage):
            sender = "user"
        elif isinstance(message, AIMessage):
            sender = "assistant"
        elif isinstance(message, SystemMessage):
            sender = "system"
        elif isinstance(message, ToolMessage):
            sender = "tool"
        else:
            sender = "user"

        content = message.content if isinstance(message.content, str) else str(message.content)
        self.mongo.save_message(
            conversation_id=self.session_id,
            user_id=self.user_id,
            role=self.role,
            sender=sender,
            content=content
        )

    def add_user_message(self, message: str) -> None:
        self.add_message(HumanMessage(content=message))

    def add_ai_message(self, message: str) -> None:
        self.add_message(AIMessage(content=message))

    def clear(self) -> None:
        """
        Clears working STM for this session.
        """
        if self.mongo.db is not None:
            try:
                self.mongo.db.short_term_memory.delete_one({"sessionId": self.session_id})
            except Exception as e:
                logger.warning(f"[MongoChatMessageHistory] Clear error: {e}")


class LangChainShortTermMemory:
    """
    Manages active session Short-Term Memory (STM):
    - Chat message history via MongoChatMessageHistory
    - Working task context (current semester, section, academic year)
    - Active scheduling constraints
    - Human-in-the-loop pending approval actions
    - Rolling session summary
    """
    def __init__(self, session_id: str, user_id: str = "user_default", role: str = "student"):
        self.session_id = session_id
        self.user_id = str(user_id)
        self.role = role
        self.history = MongoChatMessageHistory(session_id=session_id, user_id=user_id, role=role)
        self.mongo = mongo_memory

    def get_messages(self, limit: int = 10) -> List[BaseMessage]:
        msgs = self.history.messages
        return msgs[-limit:] if limit and len(msgs) > limit else msgs

    def get_history_as_string(self, limit: int = 6) -> str:
        msgs = self.get_messages(limit=limit)
        if not msgs:
            return ""
        lines = []
        for m in msgs:
            prefix = "User" if isinstance(m, HumanMessage) else ("Assistant" if isinstance(m, AIMessage) else "System")
            lines.append(f"{prefix}: {m.content}")
        return "\n".join(lines)

    def get_task_context(self) -> Dict[str, Any]:
        stm = self.mongo.get_stm(session_id=self.session_id)
        return stm.get("taskContext", {})

    def update_task_context(self, task_data: Dict[str, Any]):
        current = self.get_task_context()
        current.update(task_data)
        self.mongo.update_stm(
            session_id=self.session_id,
            user_id=self.user_id,
            updates={"taskContext": current},
            conversation_id=self.session_id
        )

    def get_recent_constraints(self) -> List[str]:
        stm = self.mongo.get_stm(session_id=self.session_id)
        return stm.get("recentConstraints", [])

    def add_constraint(self, constraint: str):
        if not constraint:
            return
        constraints = self.get_recent_constraints()
        if constraint not in constraints:
            constraints.append(constraint)
            self.mongo.update_stm(
                session_id=self.session_id,
                user_id=self.user_id,
                updates={"recentConstraints": constraints[-10:]},
                conversation_id=self.session_id
            )

    def store_pending_approval(self, action_type: str, action_data: Dict[str, Any]):
        self.mongo.store_pending_approval(
            session_id=self.session_id,
            user_id=self.user_id,
            action_type=action_type,
            action_data=action_data,
            conversation_id=self.session_id
        )

    def get_pending_approval(self) -> Optional[Dict[str, Any]]:
        return self.mongo.get_pending_approval(session_id=self.session_id)

    def clear_pending_approval(self):
        self.mongo.clear_pending_approval(session_id=self.session_id, user_id=self.user_id)

    def get_session_summary(self) -> str:
        conv = self.mongo.get_conversation(self.session_id)
        return conv.get("sessionSummary", "") if conv else ""


# ============================================================================
# 2. Long-Term Memory (LTM): LangChain Vector & Profile Memory Implementation
# ============================================================================

class LangChainLTMRetriever(BaseRetriever):
    """
    LangChain BaseRetriever implementation for Qdrant Long-Term Memory.
    Allows seamless integration into LangChain pipelines and agents.
    """
    user_id: str
    department: Optional[str] = None
    top_k: int = Field(default=4)

    def _get_relevant_documents(self, query: str, *, run_manager=None) -> List[Document]:
        records = qdrant_manager.retrieve_ltm(
            user_id=self.user_id,
            query=query,
            department=self.department,
            top_k=self.top_k
        )
        docs = []
        for r in records:
            docs.append(Document(
                page_content=r.get("fact", ""),
                metadata={
                    "user_id": r.get("user_id"),
                    "category": r.get("category", "preference"),
                    "score": r.get("score", 0.0),
                    "department": self.department,
                    "source": "qdrant_ltm"
                }
            ))
        return docs


class LangChainLongTermMemory:
    """
    LangChain Long-Term Memory (LTM) Manager:
    - Semantic memory retrieval from Qdrant ('erp_long_term_memory')
    - Structured user profiles and facts from MongoDB ('users_memory')
    - Produces LangChain Document objects
    - Automated preference and fact extraction
    """
    def __init__(self):
        self.qdrant = qdrant_manager
        self.mongo = mongo_memory
        self.llm = llm_provider

    def as_retriever(self, user_id: str, department: Optional[str] = None, top_k: int = 4) -> LangChainLTMRetriever:
        """
        Returns a LangChain-compatible retriever for semantic LTM search.
        """
        return LangChainLTMRetriever(user_id=str(user_id), department=department, top_k=top_k)

    def retrieve_relevant_facts(
        self,
        query: str,
        user_id: str,
        department: Optional[str] = None,
        top_k: int = 4
    ) -> List[Document]:
        """
        Retrieves semantic long-term memory facts matching the query as LangChain Documents.
        """
        retriever = self.as_retriever(user_id=user_id, department=department, top_k=top_k)
        return retriever.invoke(query)

    def get_user_facts(self, user_id: str) -> List[str]:
        """
        Returns all known long-term facts stored in MongoDB users_memory.
        """
        return self.mongo.get_user_long_term_memory(str(user_id))

    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """
        Retrieves complete user memory profile (academic interests, strengths, summary).
        """
        return self.mongo.get_user_profile(str(user_id))

    def store_fact(
        self,
        user_id: str,
        role: str,
        fact: str,
        category: str = "preference",
        department: Optional[str] = None
    ) -> bool:
        """
        Stores a long-term fact into both Qdrant vector space and MongoDB users_memory.
        """
        if not fact or not fact.strip():
            return False

        # 1. Vector Store in Qdrant
        qdrant_ok = self.qdrant.store_ltm(
            user_id=str(user_id),
            role=role,
            fact=fact.strip(),
            category=category,
            department=department
        )

        # 2. Document Store in MongoDB
        self.mongo.update_user_long_term_memory(user_id=str(user_id), new_facts=[fact.strip()])
        return qdrant_ok

    def extract_and_store(
        self,
        user_id: str,
        role: str,
        user_prompt: str,
        assistant_response: str = "",
        department: Optional[str] = None
    ) -> List[str]:
        """
        Extracts semantic preferences, scheduling rules, or student traits from conversation
        and persists them into LTM.
        """
        p_lower = user_prompt.lower()
        extracted: List[str] = []

        # Heuristic Pattern Extraction
        if any(w in p_lower for w in ["prefer", "i prefer", "preference"]):
            extracted.append(f"Preference noted: {user_prompt.strip()[:120]}")
        if any(w in p_lower for w in ["my section is", "i am in section", "batch"]):
            extracted.append(f"Student Section Context: {user_prompt.strip()[:100]}")
        if any(w in p_lower for w in ["no class before", "after 10", "free on friday", "keep friday light"]):
            extracted.append(f"Timetable Scheduling Constraint: {user_prompt.strip()[:120]}")
        if any(w in p_lower for w in ["interested in", "my interest is", "specializing in"]):
            extracted.append(f"Academic Interest: {user_prompt.strip()[:100]}")

        for fact in extracted:
            self.store_fact(
                user_id=user_id,
                role=role,
                fact=fact,
                category="preference",
                department=department
            )

        return extracted


# ============================================================================
# 3. LangChain Memory Coordinator: Unified Agent & Orchestrator Interface
# ============================================================================

class LangChainMemoryCoordinator:
    """
    Unified Coordinator for LangChain Short-Term Memory (STM) & Long-Term Memory (LTM).
    Provides single-call context assembly for all specialized AI agents.
    """
    def __init__(self):
        self.ltm = LangChainLongTermMemory()
        self.llm = llm_provider
        self.mongo = mongo_memory

    def get_stm(self, session_id: str, user_id: str, role: str = "student") -> LangChainShortTermMemory:
        return LangChainShortTermMemory(session_id=session_id, user_id=user_id, role=role)

    def get_full_context(
        self,
        user_id: str,
        conversation_id: str,
        query: str = "",
        department: Optional[str] = None,
        role: str = "student"
    ) -> Dict[str, Any]:
        """
        Assembles a comprehensive memory payload:
        - LangChain STM messages & formatted dialogue history
        - Active task context & constraints
        - Qdrant LangChain Document LTM facts & MongoDB profile facts
        - Formatted system prompt snippet ready for LLM injection
        """
        stm = self.get_stm(session_id=conversation_id, user_id=user_id, role=role)
        recent_messages = stm.get_messages(limit=8)
        history_text = stm.get_history_as_string(limit=6)
        task_context = stm.get_task_context()
        recent_constraints = stm.get_recent_constraints()
        pending_approval = stm.get_pending_approval()
        session_summary = stm.get_session_summary()

        # Retrieve LTM semantic documents
        search_query = query if query else "department preferences, academic profile, and constraints"
        ltm_docs = self.ltm.retrieve_relevant_facts(
            query=search_query,
            user_id=user_id,
            department=department,
            top_k=4
        )
        ltm_facts = [d.page_content for d in ltm_docs if d.page_content]

        # Merge with Mongo long-term facts
        mongo_facts = self.ltm.get_user_facts(user_id=user_id)
        for f in mongo_facts:
            if f not in ltm_facts:
                ltm_facts.append(f)

        profile = self.ltm.get_user_profile(user_id=user_id)

        # Build clean system prompt memory block
        system_snippets = []
        if ltm_facts:
            system_snippets.append("Persistent User Long-Term Memory (LTM):\n" + "\n".join(f"• {f}" for f in ltm_facts[:5]))
        if profile.get("summaryProfile"):
            system_snippets.append(f"User Academic Profile: {profile['summaryProfile']}")
        if task_context:
            tc_str = ", ".join(f"{k}: {v}" for k, v in task_context.items() if v)
            if tc_str:
                system_snippets.append(f"Active Working Task Parameters (STM): {tc_str}")
        if recent_constraints:
            system_snippets.append("Active Working Constraints:\n" + "\n".join(f"• {c}" for c in recent_constraints[:4]))
        if session_summary:
            system_snippets.append(f"Conversation Context Summary: {session_summary}")

        system_prompt_snippet = "\n\n".join(system_snippets)

        return {
            "stm": stm,
            "stm_messages": recent_messages,
            "stm_history_text": history_text,
            "task_context": task_context,
            "recent_constraints": recent_constraints,
            "pending_approval": pending_approval,
            "session_summary": session_summary,
            "ltm_documents": ltm_docs,
            "ltm_facts": ltm_facts,
            "user_profile": profile,
            "system_prompt_snippet": system_prompt_snippet
        }

    def record_turn(
        self,
        user_id: str,
        role: str,
        conversation_id: str,
        user_prompt: str,
        assistant_response: str,
        citations: List[Dict[str, Any]] = None,
        tool_calls: List[Dict[str, Any]] = None,
        department: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Records the completed conversational turn:
        1. Appends messages to LangChain STM (MongoDB conversations + STM contextWindow)
        2. Performs automated semantic LTM extraction (Qdrant + MongoDB)
        3. Periodic session summarization
        """
        stm = self.get_stm(session_id=conversation_id, user_id=user_id, role=role)

        # 1. Append LangChain messages
        stm.history.add_ai_message(assistant_response)

        # 2. Extract and store semantic LTM
        extracted_facts = self.ltm.extract_and_store(
            user_id=user_id,
            role=role,
            user_prompt=user_prompt,
            assistant_response=assistant_response,
            department=department
        )

        # 3. Summarization trigger if message count > 6 and no summary
        conv = self.mongo.get_conversation(conversation_id)
        if conv and conv.get("messageCount", 0) >= 6 and not conv.get("sessionSummary"):
            self.summarize_session(conversation_id)

        return {
            "extracted_facts": extracted_facts,
            "conversation_id": conversation_id
        }

    def summarize_session(self, conversation_id: str) -> str:
        """
        Uses LLM to summarize conversation thread and updates MongoDB conversation summary.
        """
        conv = self.mongo.get_conversation(conversation_id)
        if not conv or not conv.get("messages"):
            return ""

        msgs = conv.get("messages", [])[-8:]
        dialogue = "\n".join([f"{m.get('sender', 'user')}: {m.get('content', '')[:150]}" for m in msgs])

        prompt = [
            {"role": "system", "content": "You are the CSE Department Memory Agent. Summarize the user's academic intents, questions, and decisions from this conversation in 2 concise sentences."},
            {"role": "user", "content": dialogue}
        ]

        try:
            res = self.llm.generate(prompt, max_tokens=100)
            summary = res.get("content", "").strip()
            if summary and self.mongo.db is not None:
                self.mongo.db.conversations.update_one(
                    {"conversationId": conversation_id},
                    {"$set": {"sessionSummary": summary}}
                )
            logger.info(f"[LangChain Memory] Summarized session {conversation_id}")
            return summary
        except Exception as e:
            logger.warning(f"[LangChain Memory] Summarization failed: {e}")
            return ""


# Singleton instance for system-wide access
langchain_memory = LangChainMemoryCoordinator()

from typing import List, Dict, Any, Optional
from loguru import logger
from memory.mongo_memory import mongo_memory
from memory.langchain_memory import langchain_memory, MongoChatMessageHistory, LangChainShortTermMemory, LangChainLongTermMemory
from rag.qdrant_manager import qdrant_manager
from llm.provider import llm_provider

class MemoryAgent:
    """
    Three-Tier LangChain-Powered Memory Agent:
    1. Short-Term Memory (STM): LangChain MongoChatMessageHistory + MongoDB active session context & task state.
    2. Long-Term Memory (LTM): Qdrant erp_long_term_memory semantic facts & MongoDB user profile memories.
    3. Document RAG: Qdrant erp_documents institutional policies & guidelines.
    """
    def __init__(self):
        self.mongo = mongo_memory
        self.memory = mongo_memory  # Alias for backward compatibility with agents expecting .memory
        self.qdrant = qdrant_manager
        self.llm = llm_provider
        self.lc = langchain_memory

    def load_context(self, user_id: str, conversation_id: str, department: str) -> Dict[str, Any]:
        """
        Loads short-term working session memory from MongoDB and semantic long-term memory from Qdrant
        using LangChain primitives.
        """
        # Load comprehensive context from LangChain Memory Coordinator
        lc_ctx = self.lc.get_full_context(
            user_id=user_id,
            conversation_id=conversation_id,
            department=department
        )

        stm = self.mongo.get_stm(session_id=conversation_id, conversation_id=conversation_id)
        conv = self.mongo.get_conversation(conversation_id)

        messages = []
        summary = lc_ctx.get("session_summary", "")
        if conv:
            messages = conv.get("messages", [])[-6:]
            if not summary:
                summary = conv.get("sessionSummary", "")

        return {
            "stm": stm,
            "long_term_facts": lc_ctx.get("ltm_facts", []),
            "recent_messages": messages,
            "session_summary": summary,
            "recent_constraints": lc_ctx.get("recent_constraints", []),
            "task_context": lc_ctx.get("task_context", {}),
            # LangChain-native context
            "langchain_stm": lc_ctx.get("stm"),
            "langchain_messages": lc_ctx.get("stm_messages", []),
            "langchain_history_text": lc_ctx.get("stm_history_text", ""),
            "langchain_ltm_documents": lc_ctx.get("ltm_documents", []),
            "user_profile": lc_ctx.get("user_profile", {}),
            "system_prompt_snippet": lc_ctx.get("system_prompt_snippet", "")
        }

    def summarize_conversation(self, conversation_id: str, messages: List[Dict[str, Any]]) -> str:
        """
        Summarizes conversation thread to compact context.
        """
        return self.lc.summarize_session(conversation_id)

    def extract_new_facts(self, prompt: str, answer: str = "") -> List[str]:
        """
        Rule and heuristic fact extractor for student/faculty assistant agents.
        """
        p_lower = prompt.lower()
        extracted = []
        if any(w in p_lower for w in ["prefer", "preference", "i prefer"]):
            extracted.append(f"Preference: {prompt.strip()[:100]}")
        if any(w in p_lower for w in ["interested in", "my interest", "curious about"]):
            extracted.append(f"Academic Interest: {prompt.strip()[:100]}")
        if any(w in p_lower for w in ["section a", "section b", "3rd year", "4th year", "sem 5", "sem 6"]):
            extracted.append(f"Academic Placement: {prompt.strip()[:80]}")
        return extracted

    def extract_and_store_memory(
        self,
        user_id: str,
        role: str,
        user_prompt: str,
        assistant_response: str,
        department: str
    ) -> List[str]:
        """
        Evaluates whether user prompt contains high-value semantic preferences
        worthy of persistent long-term storage in Qdrant LTM and MongoDB.
        """
        return self.lc.ltm.extract_and_store(
            user_id=user_id,
            role=role,
            user_prompt=user_prompt,
            assistant_response=assistant_response,
            department=department
        )

    def get_langchain_retriever(self, user_id: str, department: str, top_k: int = 4):
        """
        Returns a LangChain-compatible retriever for semantic LTM search.
        """
        return self.lc.ltm.as_retriever(user_id=user_id, department=department, top_k=top_k)

memory_agent = MemoryAgent()

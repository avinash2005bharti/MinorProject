from typing import List, Dict, Any, Optional
from loguru import logger
from memory.mongo_memory import mongo_memory
from rag.qdrant_manager import qdrant_manager
from llm.groq_client import groq_client

class MemoryAgent:
    """
    Three-Tier Memory Agent:
    1. Short-Term Memory (STM): MongoDB active session context, task parameters, constraints, pending approvals.
    2. Long-Term Memory (LTM): Qdrant erp_long_term_memory semantic facts & preferences.
    3. Document RAG: Qdrant erp_documents institutional policies & guidelines.
    """
    def __init__(self):
        self.mongo = mongo_memory
        self.qdrant = qdrant_manager
        self.llm = groq_client

    def load_context(self, user_id: str, conversation_id: str, department: str = "CSE") -> Dict[str, Any]:
        """
        Loads short-term working session memory from MongoDB and semantic long-term memory from Qdrant.
        """
        # 1. STM from MongoDB
        stm = self.mongo.get_stm(session_id=conversation_id, conversation_id=conversation_id)
        conv = self.mongo.get_conversation(conversation_id)

        messages = []
        summary = ""
        if conv:
            messages = conv.get("messages", [])[-6:]
            summary = conv.get("sessionSummary", "")

        # 2. LTM from Qdrant
        ltm_records = self.qdrant.retrieve_ltm(
            user_id=user_id,
            query="department timetable preferences and scheduling constraints",
            department=department,
            top_k=4
        )
        mongo_facts = self.mongo.get_user_long_term_memory(user_id)

        all_facts = [r.get("fact") for r in ltm_records if r.get("fact")]
        for f in mongo_facts:
            if f not in all_facts:
                all_facts.append(f)

        return {
            "stm": stm,
            "long_term_facts": all_facts,
            "recent_messages": messages,
            "session_summary": summary,
            "recent_constraints": stm.get("recentConstraints", []),
            "task_context": stm.get("taskContext", {})
        }

    def summarize_conversation(self, conversation_id: str, messages: List[Dict[str, Any]]) -> str:
        """
        Summarizes conversation thread to compact context.
        """
        if not messages:
            return ""

        dialogue = "\n".join([f"{m.get('sender', 'user')}: {m.get('content', '')}" for m in messages])
        prompt = [
            {"role": "system", "content": "You are the CSE Department Memory Agent. Summarize the key academic intents, questions, and decisions from the conversation in 2-3 concise bullet points."},
            {"role": "user", "content": dialogue}
        ]

        try:
            res = self.llm.generate(prompt, max_tokens=150)
            summary = res.get("content", "Conversation about CSE schedule and assignments.")
            logger.info(f"[Memory Agent] Summarized conversation {conversation_id}")
            return summary
        except Exception as e:
            logger.warning(f"[Memory Agent] Summarization failed: {e}")
            return "Academic conversation regarding class timetable and assignments."

    def extract_and_store_memory(
        self,
        user_id: str,
        role: str,
        user_prompt: str,
        assistant_response: str,
        department: str = "CSE"
    ) -> List[str]:
        """
        Evaluates whether user prompt contains high-value semantic preferences
        worthy of persistent long-term storage in Qdrant LTM and MongoDB.
        """
        prompt_lower = user_prompt.lower()
        extracted = []

        # Check for scheduling preferences
        if "prefer" in prompt_lower or "keep friday" in prompt_lower or "light" in prompt_lower:
            extracted.append(f"Scheduling preference noted: {user_prompt.strip()[:100]}")
        elif "no class before" in prompt_lower or "morning" in prompt_lower or "afternoon" in prompt_lower:
            extracted.append(f"Time slot constraint preference: {user_prompt.strip()[:100]}")
        elif "consecutive" in prompt_lower or "lab" in prompt_lower:
            extracted.append(f"Laboratory slot structuring rule: {user_prompt.strip()[:100]}")

        # Persist worthy memories
        for fact in extracted:
            self.qdrant.store_ltm(
                user_id=user_id,
                role=role,
                fact=fact,
                category="scheduling_preference",
                department=department
            )
            self.mongo.update_user_long_term_memory(user_id=user_id, new_facts=[fact])

        return extracted

memory_agent = MemoryAgent()

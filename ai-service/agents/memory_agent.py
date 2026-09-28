from typing import List, Dict, Any, Optional
from loguru import logger
from memory.mongo_memory import mongo_memory
from llm.groq_client import groq_client

class MemoryAgent:
    """
    Memory Agent maintaining:
    - Short-term session memory
    - Long-term academic student/faculty facts
    - Rolling conversation summaries
    """
    def __init__(self):
        self.memory = mongo_memory
        self.llm = groq_client

    def load_context(self, user_id: str, conversation_id: str) -> Dict[str, Any]:
        """
        Loads long-term user facts and short-term conversation context.
        """
        facts = self.memory.get_user_long_term_memory(user_id)
        conv = self.memory.get_conversation(conversation_id)

        messages = []
        summary = ""
        if conv:
            messages = conv.get("messages", [])[-6:] # last 6 messages
            summary = conv.get("sessionSummary", "")

        return {
            "long_term_facts": facts,
            "recent_messages": messages,
            "session_summary": summary
        }

    def summarize_conversation(self, conversation_id: str, messages: List[Dict[str, Any]]) -> str:
        """
        Uses Groq LLM to generate a concise summary of the conversation thread.
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

    def extract_new_facts(self, user_prompt: str, assistant_response: str) -> List[str]:
        """
        Extract meaningful long-term student/faculty facts to update memory.
        """
        prompt_lower = user_prompt.lower()
        facts = []
        if "weak in" in prompt_lower or "struggling" in prompt_lower:
            facts.append(f"Student noted academic difficulty: {user_prompt[:80]}")
        if "interested in" in prompt_lower or "project" in prompt_lower:
            facts.append(f"Academic interest recorded: {user_prompt[:80]}")
        if "section" in prompt_lower:
            facts.append(f"User referenced section details: {user_prompt[:60]}")
        return facts

memory_agent = MemoryAgent()

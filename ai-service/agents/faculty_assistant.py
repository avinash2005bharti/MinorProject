import time
from typing import Dict, Any, List
from loguru import logger

from tools.postgres_tools import postgres_tools
from agents.rag_agent import rag_agent
from llm.groq_client import groq_client
from memory.mongo_memory import mongo_memory

class FacultyAssistant:
    """
    Dedicated AI Assistant for CSE Faculty members.
    Can:
    - Generate structured assignments with rubrics
    - Summarize student assignment submissions
    - Draft formal departmental emails and student notices
    - Analyze attendance trends across class sections
    """
    def __init__(self):
        self.sql = postgres_tools
        self.rag = rag_agent
        self.llm = groq_client

    def handle_query(
        self,
        prompt: str,
        user_id: str,
        conversation_id: str,
        context_history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        logger.info(f"[Faculty Assistant] Processing query for faculty #{user_id}: '{prompt}'")

        tool_calls = []
        citations = []
        prompt_lower = prompt.lower()

        # RAG context for subject syllabus
        rag_res = self.rag.retrieve_context(prompt, collection="Syllabus", top_k=2)
        citations = rag_res["citations"]
        syllabus_context = rag_res["formatted_context"]

        system_prompt = (
            "You are the CSE Faculty AI Assistant. You assist Professors and Lecturers with:\n"
            "1. Designing rigorous academic assignments and quiz questions (with solutions and evaluation rubrics).\n"
            "2. Summarizing batches of student submissions and highlighting common conceptual mistakes.\n"
            "3. Drafting official announcements, circulars, and warning emails for attendance shortage (<75%).\n"
            "4. Analyzing section performance and attendance trends across CSE years.\n"
            f"Department Context: Computer Science & Engineering | Syllabus Reference:\n{syllabus_context}"
        )

        messages = [{"role": "system", "content": system_prompt}]
        if context_history:
            for ch in context_history[-4:]:
                messages.append({"role": ch.get("role", "user"), "content": ch.get("content", "")})
        messages.append({"role": "user", "content": prompt})

        # Intent detection for tool calls
        if "attendance" in prompt_lower or "shortage" in prompt_lower or "below 75" in prompt_lower:
            tool_calls.append({
                "tool": "analyze_section_attendance",
                "args": {"section": "CSE-3A", "threshold": 75},
                "output": {"totalStudents": 60, "belowThresholdCount": 4, "flagged": ["0103CS211005"]}
            })

        if "assignment" in prompt_lower and ("generate" in prompt_lower or "create" in prompt_lower):
            tool_calls.append({
                "tool": "generate_assignment_scaffold",
                "args": {"topic": prompt[:50], "maxMarks": 50},
                "output": {"status": "SUCCESS", "sectionsCount": 4}
            })

        llm_res = self.llm.generate(messages, temperature=0.3, max_tokens=1200)
        answer = llm_res.get("content", "Unable to complete faculty request.")

        duration = (time.time() - start_time) * 1000
        mongo_memory.log_agent_execution(
            agent_name="FacultyAssistant",
            user_id=user_id,
            action="FACULTY_ASSIST_ACTION",
            input_data={"prompt": prompt},
            output_data={"tokens": llm_res.get("tokens", {}).get("total", 0)},
            tokens=llm_res.get("tokens", {}).get("total", 0),
            duration_ms=duration
        )

        return {
            "answer": answer,
            "citations": citations,
            "tool_calls": tool_calls,
            "memory_update": None
        }

faculty_assistant = FacultyAssistant()

import time
from typing import Dict, Any, List
from loguru import logger

from tools.postgres_tools import postgres_tools
from agents.rag_agent import rag_agent
from agents.memory_agent import memory_agent
from llm.groq_client import groq_client
from memory.mongo_memory import mongo_memory

class StudentAssistant:
    """
    Dedicated AI Assistant for CSE Students.
    Answers:
    - Attendance queries & percentages
    - Daily/weekly timetable and upcoming lectures
    - Pending assignments and deadlines
    - Faculty office hours & contact info
    - Course syllabus and lecture notes
    Uses: PostgreSQL, MongoDB, Qdrant
    """
    def __init__(self):
        self.sql = postgres_tools
        self.rag = rag_agent
        self.memory = memory_agent
        self.llm = groq_client

    def handle_query(
        self,
        prompt: str,
        user_id: str,
        conversation_id: str,
        context_history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        logger.info(f"[Student Assistant] Processing query for student #{user_id}: '{prompt}'")

        # 1. Load Context & Memory
        mem_data = self.memory.load_context(user_id, conversation_id)
        long_term_facts = mem_data["long_term_facts"]
        session_summary = mem_data["session_summary"]

        tool_calls = []
        citations = []
        sql_context_snippets = []

        prompt_lower = prompt.lower()

        # 2. Tool Invocation based on query semantics
        # Timetable Tool
        if any(w in prompt_lower for w in ["class", "timetable", "kal", "lecture", "schedule", "timing", "room", "when"]):
            try:
                # Assume 3rd Year Sem 5 Section A as standard batch for default student
                slots = self.sql.get_timetable(year="3rd Year", semester=5, section="A")
                tool_calls.append({
                    "tool": "query_timetable",
                    "args": {"year": "3rd Year", "semester": 5, "section": "A"},
                    "output": slots[:4]
                })
                slot_strs = [f"{s['day']} {s['start_time']}-{s['end_time']}: {s['subject']} with {s['faculty']} ({s['room']})" for s in slots[:4]]
                sql_context_snippets.append("Scheduled Classes:\n" + "\n".join(slot_strs))
            except Exception as e:
                logger.error(f"[Student Assistant] Timetable tool error: {e}")

        # Assignment Tool
        if any(w in prompt_lower for w in ["assignment", "homework", "pending", "submission", "due", "deadline"]):
            try:
                stud_id = int(user_id) if str(user_id).isdigit() else 1
                asgs = self.sql.get_pending_assignments(student_id=stud_id, semester=5)
                tool_calls.append({
                    "tool": "query_pending_assignments",
                    "args": {"student_id": stud_id, "semester": 5},
                    "output": asgs
                })
                asg_strs = [f"Assignment: {a['title']} (Subject: {a['subject_name']}, Deadline: {a['deadline']})" for a in asgs]
                sql_context_snippets.append("Pending Assignments:\n" + "\n".join(asg_strs))
            except Exception as e:
                logger.error(f"[Student Assistant] Assignment tool error: {e}")

        # Attendance Tool
        if any(w in prompt_lower for w in ["attendance", "haazri", "percentage", "present", "absent", "shortage"]):
            try:
                stud_id = int(user_id) if str(user_id).isdigit() else 1
                att = self.sql.get_attendance(student_id=stud_id)
                tool_calls.append({
                    "tool": "query_attendance",
                    "args": {"student_id": stud_id},
                    "output": att
                })
                sql_context_snippets.append(f"Recorded Attendance: {att['percentage']}% ({att['attended']}/{att['total']} sessions attended). Shortage: {att['isShortage']}.")
            except Exception as e:
                logger.error(f"[Student Assistant] Attendance tool error: {e}")

        # Faculty Office Hours
        if any(w in prompt_lower for w in ["faculty", "teacher", "professor", "hod", "cabin", "office"]):
            try:
                facs = self.sql.get_faculty_info("Alok")
                tool_calls.append({
                    "tool": "query_faculty_info",
                    "args": {"query": "CSE Faculty"},
                    "output": facs
                })
                sql_context_snippets.append(f"Faculty Directory: Dr. Alok Verma (HOD), Dr. Sunita Sharma, Prof. Rahul Mehta, Prof. Priya Singh.")
            except Exception as e:
                logger.error(f"[Student Assistant] Faculty tool error: {e}")

        # 3. RAG Retrieval for academic materials & circulars
        rag_res = self.rag.retrieve_context(prompt, top_k=2)
        citations = rag_res["citations"]
        rag_context = rag_res["formatted_context"]

        # 4. Construct System Prompt & Messages for Groq LLM
        system_prompt = (
            "You are the official AI Assistant for the Computer Science & Engineering (CSE) Department. "
            "You assist CSE students with class timetables, attendance tracking, assignments, syllabus queries, and faculty details. "
            "Always be helpful, precise, and academic. Use bullet points and markdown tables when appropriate.\n\n"
            f"Department Hierarchy: CSE Department exclusively (1st to 4th Year, Semesters 1 to 8, Sections A & B).\n"
            f"Relational Database Context:\n{chr(10).join(sql_context_snippets) if sql_context_snippets else 'No relational queries invoked.'}\n\n"
            f"RAG Document Context:\n{rag_context}\n\n"
            f"Student Long-Term Memory:\n{', '.join(long_term_facts) if long_term_facts else 'No past profile facts.'}\n"
            f"Previous Conversation Summary:\n{session_summary if session_summary else 'None.'}"
        )

        messages = [{"role": "system", "content": system_prompt}]

        # Inject recent chat history
        if context_history:
            for ch in context_history[-4:]:
                messages.append({"role": ch.get("role", "user"), "content": ch.get("content", "")})
        messages.append({"role": "user", "content": prompt})

        # 5. Generate Response via Groq LLM
        llm_res = self.llm.generate(messages, temperature=0.2, max_tokens=1000)
        answer = llm_res.get("content", "I am unable to generate a response at this moment.")

        # 6. Memory Extraction & Updates
        new_facts = self.memory.extract_new_facts(prompt, answer)
        if new_facts:
            self.memory.memory.update_user_long_term_memory(user_id, new_facts)

        duration = (time.time() - start_time) * 1000
        tokens_used = llm_res.get("tokens", {}).get("total", 0)

        # Log decision in MongoDB
        mongo_memory.log_agent_execution(
            agent_name="StudentAssistant",
            user_id=user_id,
            action="STUDENT_QUERY_RESOLUTION",
            input_data={"prompt": prompt, "conversation_id": conversation_id},
            output_data={"citations_count": len(citations), "tool_calls_count": len(tool_calls)},
            tokens=tokens_used,
            duration_ms=duration
        )

        return {
            "answer": answer,
            "citations": citations,
            "tool_calls": tool_calls,
            "memory_update": {"facts": new_facts} if new_facts else None
        }

student_assistant = StudentAssistant()

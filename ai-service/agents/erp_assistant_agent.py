from typing import Dict, Any, List, Optional
from loguru import logger
from tools.agent_tools import agent_tools
from llm.provider import llm_provider

class ERPAssistantAgent:
    """
    Agent 1: General ERP Assistant Agent.
    Specializes in:
    - Answering general departmental ERP and college queries
    - Answering computer science, engineering, and technical questions
    - Navigating student, faculty, and administrative portals
    - Institutional policies, guidelines, and procedures
    """
    def __init__(self):
        self.tools = agent_tools
        self.llm = llm_provider

    def handle_request(
        self,
        prompt: str,
        user_id: str,
        conversation_id: str,
        role: str = "student",
        context_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        logger.info(f"[ERPAssistantAgent] Handling query: '{prompt}' for User #{user_id} (Role: {role})")

        system_prompt = (
            f"You are the CampusFlow AI Copilot for the Department of Computer Science & Engineering (CSE) at "
            f"Oriental Institute of Science & Technology (OIST), Bhopal.\n"
            f"The user interacting with you has the role: '{role.upper()}'.\n\n"
            f"Departmental Knowledge Base:\n"
            f"• Head of Department (HOD): Dr. Alok Verma (Professor & HOD)\n"
            f"• Tutor Guardian (TG) Coordinator: Prof. Rahul Mehta\n"
            f"• Core Faculty: Dr. Sunita Sharma (DBMS), Prof. Priya Singh (Data Structures & Networks)\n"
            f"• Academic Year: 2026-27 | Programs: B.Tech Computer Science & Engineering (Affiliated with RGPV Bhopal, NAAC 'A+' accredited)\n"
            f"• Key Rules: 75% minimum statutory attendance is required for semester examinations.\n"
            f"• Leave Workflow: Student Submission ➔ TG Review ➔ HOD Digital Clearance.\n\n"
            f"Instructions:\n"
            f"1. If the user asks general technical, computer science, programming, or conceptual questions (e.g. cloud computing, algorithms, DBMS, operating systems, AI, study tips), provide an articulate, well-structured, educational explanation with markdown formatting.\n"
            f"2. If the user asks about the college, ERP features, HOD, TG, timetable, attendance, or leaves, provide accurate, helpful answers referencing the CSE department guidelines.\n"
            f"3. Always maintain a professional, encouraging, and respectful tone.\n"
            f"4. Format your output with clear markdown headings (###), bullet points, and code blocks where applicable."
        )

        messages = [{"role": "system", "content": system_prompt}]

        # Append recent context turns
        if context_history and isinstance(context_history, list):
            for turn in context_history[-4:]:
                r = turn.get("role") or turn.get("sender") or "user"
                c = turn.get("content") or turn.get("text") or ""
                if c:
                    messages.append({"role": "assistant" if r == "assistant" else "user", "content": c})

        messages.append({"role": "user", "content": prompt})

        answer = ""
        try:
            llm_result = self.llm.generate(messages, temperature=0.4, max_tokens=1500)
            if llm_result and isinstance(llm_result, dict):
                answer = llm_result.get("content", "").strip()
        except Exception as err:
            logger.warning(f"[ERPAssistantAgent] LLM generation error: {err}")

        # Fallback if LLM output is empty or unavailable
        if not answer:
            p_lower = prompt.lower()
            if any(w in p_lower for w in ["hi", "hello", "hey", "who are you", "what can you do"]):
                answer = (
                    "### 👋 Welcome to CampusFlow AI Copilot!\n\n"
                    f"Hello! I am your **CSE Department AI Copilot** at **Oriental Institute of Science & Technology (OIST)**.\n\n"
                    "I can assist you with:\n"
                    "• **Academic Concepts & Technical Queries:** Ask me about algorithms, cloud computing, database systems, networking, and programming.\n"
                    "• **📅 Timetable & Schedules:** Class slot lookups, room allocations (Room 204/205, Labs), and faculty details.\n"
                    "• **📊 Real-time Attendance:** Check your attendance standing against the mandatory 75% RGPV threshold.\n"
                    "• **📝 Leave Applications & TG Clearance:** Multi-tier routing (Student ➔ TG ➔ HOD clearance).\n"
                    "• **👨‍🏫 Teacher Management & HOD Services:** Workload distribution, absence substitution, and TG appointment.\n\n"
                    "How can I help you today?"
                )
            elif any(w in p_lower for w in ["hod", "head", "dr alok", "verma"]):
                answer = (
                    "### 🏛️ Head of Department (HOD) — CSE\n\n"
                    "• **Name:** Dr. Alok Verma\n"
                    "• **Designation:** Professor & Head of Department (CSE)\n"
                    "• **Department:** Computer Science & Engineering\n"
                    "• **Office:** HOD Office, Main Academic Block (Floor 2)\n"
                    "• **Official Email:** `hod.cse@college.edu`\n"
                    "• **Specialization:** Artificial Intelligence, Distributed Systems & Machine Learning\n\n"
                    "The HOD is responsible for academic governance, faculty allocation, timetable authorization, and final leave clearance."
                )
            elif any(w in p_lower for w in ["tg", "tutor guardian", "mentor", "rahul mehta"]):
                answer = (
                    "### 🛡️ Tutor Guardian (TG) System — CSE\n\n"
                    "• **Designated TG:** Prof. Rahul Mehta (`rahul.mehta@college.edu`)\n"
                    "• **Role of TG:** The Tutor Guardian serves as the primary mentor for students, monitoring attendance, reviewing leave applications, and guiding academic progress.\n"
                    "• **TG Clearance Pipeline:** Student Leave / Attendance queries are first reviewed by the designated TG before forwarding to the HOD.\n"
                    "• **HOD Authority:** The HOD has the authority to appoint and reassign any faculty member as a TG for specific sections (CSE-3A, 3B, etc.)."
                )
            else:
                answer = (
                    f"### 💡 CampusFlow AI Assistant\n\n"
                    f"Regarding your query: *\"{prompt}\"*\n\n"
                    "Here is the departmental information:\n"
                    "• **Department:** Computer Science & Engineering (OIST Bhopal)\n"
                    "• **Academic Session:** 2026-27\n"
                    "• **Support Available:** Timetable navigation, attendance analysis (75% threshold), leave clearances, curriculum queries, and syllabus guides.\n\n"
                    "Feel free to ask specific questions about your coursework, schedule, or departmental procedures!"
                )

        return {
            "answer": answer,
            "detected_intent": "GENERAL_ERP_QUERY",
            "agent_used": "ERPAssistantAgent",
            "actions_taken": ["llm_grounded_response"],
            "proposed_actions": [],
            "approval_requirement": {"requires_approval": False}
        }

erp_assistant_agent = ERPAssistantAgent()


from typing import Dict, Any, List, Optional
from loguru import logger
from tools.agent_tools import agent_tools
from llm.provider import llm_provider

class AcademicInformationAgent:
    """
    Agent 7: Academic Information Agent.
    Specializes in:
    - Curriculum and course details
    - Subject credits and lecture/lab requirements
    - Academic structure (Years, Semesters, Sections)
    - Classroom and laboratory specifications
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
        logger.info(f"[AcademicInformationAgent] Processing academic query: '{prompt}'")

        subjects_res = self.tools.sql.get_all_subjects(semester=5, department="CSE")
        rooms_res = self.tools.sql.get_all_rooms(department="CSE")

        sub_list = "\n".join([f"- **{s.get('code')}:** {s.get('name')} ({s.get('credits')} Credits - {'Lab' if s.get('is_lab') else 'Theory'})" for s in subjects_res[:6]])

        answer = (
            "### 🎓 Computer Science & Engineering Academic Curriculum\n\n"
            "**Structure:** 4-Year B.Tech Program | Semester 5 (3rd Year)\n\n"
            "#### Prescribed Courses:\n"
            f"{sub_list}\n\n"
            "#### Department Infrastructure:\n"
            f"- **Smart Classrooms:** {len([r for r in rooms_res if r.get('room_type') == 'Classroom'])} Lecture Rooms (Rooms 204, 205, 302)\n"
            f"- **Computing Laboratories:** {len([r for r in rooms_res if r.get('room_type') == 'Lab'])} High-Performance Labs (Software Lab 2, Hardware Lab 1)\n"
            "- **Recess Schedule:** Daily mandatory break observed from 12:45 PM to 01:30 PM."
        )

        return {
            "answer": answer,
            "detected_intent": "ACADEMIC_INFORMATION",
            "agent_used": "AcademicInformationAgent",
            "actions_taken": ["get_curriculum_subjects", "get_department_rooms"],
            "proposed_actions": [],
            "approval_requirement": {"requires_approval": False},
            "subjects": subjects_res
        }

academic_information_agent = AcademicInformationAgent()

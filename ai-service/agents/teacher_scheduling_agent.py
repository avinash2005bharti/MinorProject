from typing import Any, Dict, List, Optional

from agents.runtime_adapter import run_operational_agent


class TeacherSchedulingAgent:
    """Scheduling queries use the shared runtime and authorized timetable tools."""

    def handle_request(
        self,
        prompt: str,
        user_id: str,
        conversation_id: str,
        role: str = "hod",
        context_history: Optional[List[Dict[str, str]]] = None,
        user_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        return run_operational_agent(
            prompt=prompt,
            user_id=user_id,
            conversation_id=conversation_id,
            role=role,
            context_history=context_history,
            user_context=user_context,
            target_agent="teacher_scheduling",
        )


teacher_scheduling_agent = TeacherSchedulingAgent()

from typing import Any, Dict, List, Optional

from agents.runtime_adapter import run_operational_agent


class LeaveManagementAgent:
    """Leave requests use the common runtime and backend authorization policies."""

    def handle_request(
        self,
        prompt: str,
        user_id: str,
        conversation_id: str,
        role: str = "student",
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
            target_agent="leave",
        )


leave_management_agent = LeaveManagementAgent()

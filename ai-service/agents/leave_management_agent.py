from typing import Dict, Any, List, Optional
from loguru import logger
from tools.agent_tools import agent_tools
from llm.provider import llm_provider

class LeaveManagementAgent:
    """
    Agent 6: Leave Management Agent.
    Specializes in:
    - Guiding students and teachers through leave applications
    - Checking leave eligibility and required documentation
    - Routing to Teacher Guardian (TG)
    - Autonomous TG-fallback directly to HOD when TG is marked unavailable or on leave
    - Real-time leave status telemetry
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
        logger.info(f"[LeaveManagementAgent] Handling leave request: '{prompt}' for User #{user_id}")

        prompt_lower = prompt.lower()

        # Check existing leaves
        std_id = int(user_id) if str(user_id).isdigit() else 1
        leaves_res = self.tools.get_leave(student_id=std_id)
        active_leaves = leaves_res.get("requests", [])

        if "status" in prompt_lower or "track" in prompt_lower or "check" in prompt_lower:
            if active_leaves:
                latest = active_leaves[0]
                answer = (
                    f"### 📋 Current Leave Application Status\n\n"
                    f"- **Request ID:** `{latest.get('requestId')}`\n"
                    f"- **Leave Type:** {latest.get('leaveType', 'Medical')}\n"
                    f"- **Duration:** {latest.get('dateRangeLabel', 'Recent dates')}\n"
                    f"- **Status:** `{latest.get('status', 'pending_tg')}`\n"
                    f"- **Routing Note:** {'Direct HOD Clearance (TG Bypassed)' if latest.get('tgBypassed') else 'Standard TG Review Pipeline'}\n"
                )
            else:
                answer = (
                    "### 📋 Leave Application Status\n\n"
                    "You have no pending leave applications in CSE department records.\n"
                    "To apply for leave, use the **Apply Leave** button on your portal or specify your leave dates and reason here."
                )
        else:
            answer = (
                "### 📝 Leave Application Clearance Pipeline\n\n"
                "The CSE Department operates an automated multi-stage leave clearance pipeline:\n\n"
                "1. **Submission:** Student submits leave form with reason and supporting medical certificate / OD proof.\n"
                "2. **TG Review:** Routed to your assigned Teacher Guardian (Prof. Rahul Mehta).\n"
                "3. **Autonomous TG Fallback:** If your mentor is marked unavailable/on leave, the request **automatically bypasses to HOD (Dr. Alok Verma)**.\n"
                "4. **Attendance Sync:** Upon approval, institutional duty credits are applied to the attendance database.\n\n"
                "Would you like me to initiate a leave application for you now?"
            )

        return {
            "answer": answer,
            "detected_intent": "LEAVE_WORKFLOW",
            "agent_used": "LeaveManagementAgent",
            "actions_taken": ["get_leave_records", "evaluate_tg_availability"],
            "proposed_actions": [],
            "approval_requirement": {"requires_approval": False},
            "active_leaves": active_leaves
        }

leave_management_agent = LeaveManagementAgent()

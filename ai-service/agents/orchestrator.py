import re
import time
from typing import Dict, Any, List, Optional
from loguru import logger

from agents.erp_assistant_agent import erp_assistant_agent
from agents.timetable_agent import timetable_agent
from agents.teacher_scheduling_agent import teacher_scheduling_agent
from agents.teacher_absence_agent import teacher_absence_agent
from agents.attendance_agent import attendance_agent
from agents.leave_management_agent import leave_management_agent
from agents.academic_information_agent import academic_information_agent
from agents.rag_agent import rag_agent
from agents.reporting_agent import reporting_agent
from agents.file_generation_agent import file_generation_agent
from agents.memory_agent import memory_agent

from memory.mongo_memory import mongo_memory
from rag.qdrant_manager import qdrant_manager
from tools.agent_tools import agent_tools

class CentralAgentOrchestrator:
    """
    Central AI Multi-Agent Orchestrator (Section 16).
    Architecture:
    User -> API -> Authentication -> Intent Detection -> Agent Selection -> Planner -> Tool Execution -> Observation -> Validation -> Grounded Response.
    Never passes every query through every agent; routes selectively to the exact specialized agent.
    """
    def __init__(self):
        self.tools = agent_tools
        self.memory = memory_agent
        self.qdrant = qdrant_manager
        self.mongo = mongo_memory

        # Registry of all 10 specialized agents
        self.agents = {
            "erp_assistant": erp_assistant_agent,
            "timetable": timetable_agent,
            "teacher_scheduling": teacher_scheduling_agent,
            "teacher_absence": teacher_absence_agent,
            "attendance": attendance_agent,
            "leave_management": leave_management_agent,
            "academic_info": academic_information_agent,
            "rag": rag_agent,
            "reporting": reporting_agent,
            "file_generation": file_generation_agent
        }

    def detect_intent_and_select_agent(self, prompt: str, role: str, requested_agent: Optional[str] = None) -> str:
        """
        Fast Heuristic Intent Classifier for Autonomous Agent Selection.
        """
        if requested_agent and requested_agent.lower() in self.agents:
            return requested_agent.lower()

        p_lower = prompt.lower().strip()
        role_lower = (role or "student").lower()

        # 1. Timetable Generation or Modification
        if any(w in p_lower for w in ["generate timetable", "create timetable", "make friday", "lighter", "regenerate timetable", "schedule cs", "timetable conflict", "clash"]):
            return "timetable"

        # 2. Teacher Absence & Rescheduling
        if any(w in p_lower for w in ["absent", "leave today", "adjust his classes", "adjust her classes", "adjust all his classes", "substitute", "chutti"]):
            return "teacher_absence"

        # 3. Teacher Scheduling & Workload
        if any(w in p_lower for w in ["workload", "max periods", "consecutive hours", "teaching load", "assigned courses", "faculty schedule"]):
            return "teacher_scheduling"

        # 4. Attendance
        if any(w in p_lower for w in ["attendance", "haazri", "present count", "absent count", "percentage", "75%", "attendance shortage"]):
            return "attendance"

        # 5. Leave Management
        if any(w in p_lower for w in ["apply leave", "leave application", "medical leave", "on-duty", "duty leave", "tg review", "leave status"]):
            return "leave_management"

        # 6. File Export
        if any(w in p_lower for w in ["export", "pdf", "excel", "xlsx", "download timetable", "sheet"]):
            return "file_generation"

        # 7. Reporting & Analytics
        if any(w in p_lower for w in ["report", "audit", "summary of department", "operational report"]):
            return "reporting"

        # 8. Document RAG / Syllabus Search
        if any(w in p_lower for w in ["syllabus", "circular", "policy", "regulations", "notes for", "explain dijkstra", "unit 1", "unit 2"]):
            return "rag"

        # 9. Academic Information
        if any(w in p_lower for w in ["curriculum", "courses", "credits", "classrooms", "labs", "subjects in"]):
            return "academic_info"

        # Role-based defaults
        if role_lower in ["hod", "admin"]:
            if "timetable" in p_lower or "schedule" in p_lower:
                return "timetable"
            return "erp_assistant"

        return "erp_assistant"

    def orchestrate(
        self,
        prompt: str,
        user_id: str,
        role: str,
        conversation_id: str,
        target_agent: Optional[str] = None,
        context_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Executes Central Orchestration Pipeline.
        """
        start_time = time.time()
        logger.info(f"[Orchestrator] Processing request from User #{user_id} ({role}): '{prompt[:60]}...'")

        # 1. Step 1: Context Loading (STM from Mongo + LTM from Qdrant)
        context = self.memory.load_context(user_id=user_id, conversation_id=conversation_id, department="CSE")
        stm = context.get("stm", {})
        task_ctx = context.get("task_context", {})

        # 2. Step 2: Intent Detection & Agent Selection
        selected_agent_key = self.detect_intent_and_select_agent(prompt, role, target_agent)
        agent = self.agents.get(selected_agent_key, erp_assistant_agent)
        logger.info(f"[Orchestrator] Selected Agent: '{selected_agent_key}' ({agent.__class__.__name__})")

        # 3. Step 3: Authorization & Security Check
        # High-privilege agent restrictions
        if selected_agent_key in ["timetable", "teacher_absence", "teacher_scheduling"] and any(w in prompt.lower() for w in ["generate", "adjust", "apply", "commit"]):
            if role.lower() not in ["hod", "admin"]:
                return {
                    "success": False,
                    "answer": "🔒 Authorization Notice: Modifying departmental timetables and committing teacher substitutions requires HOD or Administrator credentials. Students and faculty may view schedules but cannot alter production academic allocations.",
                    "detected_intent": "UNAUTHORIZED_ACTION",
                    "agent_used": "CentralAgentOrchestrator",
                    "actions_taken": ["enforce_rbac_policy"],
                    "proposed_actions": [],
                    "approval_requirement": {"requires_approval": False}
                }

        # 4. Step 4: Agent Execution with Planner & Tools
        try:
            agent_result = agent.handle_request(
                prompt=prompt,
                user_id=user_id,
                conversation_id=conversation_id,
                role=role,
                context_history=context_history
            )
        except Exception as e:
            logger.error(f"[Orchestrator] Agent execution error: {e}")
            agent_result = {
                "answer": f"⚠️ The {agent.__class__.__name__} encountered an execution issue: {str(e)}. Fallback reasoning active.",
                "detected_intent": "EXECUTION_ERROR",
                "agent_used": agent.__class__.__name__,
                "actions_taken": [],
                "proposed_actions": []
            }

        # 5. Step 5: Save STM to MongoDB
        try:
            self.mongo.save_message(
                conversation_id=conversation_id,
                user_id=user_id,
                role=role,
                sender="assistant",
                content=agent_result.get("answer", ""),
                citations=agent_result.get("citations", []),
                tool_calls=agent_result.get("tool_calls", [])
            )
        except Exception as mErr:
            logger.debug(f"[Orchestrator] MongoDB save message warning: {mErr}")

        # 6. Step 6: LTM Semantic Extraction (for high-value user preferences or repeated queries)
        p_lower = prompt.lower()
        if any(w in p_lower for w in ["prefer", "my subject is", "i am in section", "reminder", "i like"]):
            try:
                self.qdrant.store_ltm(
                    user_id=user_id,
                    role=role,
                    fact=prompt.strip(),
                    category="preference",
                    department="CSE"
                )
            except Exception as qErr:
                logger.debug(f"[Orchestrator] Qdrant LTM store warning: {qErr}")

        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(f"[Orchestrator] Completed in {duration_ms}ms with {agent.__class__.__name__}")

        return {
            "success": True,
            "conversation_id": conversation_id,
            "answer": agent_result.get("answer", ""),
            "detected_intent": agent_result.get("detected_intent", selected_agent_key.upper()),
            "agent_used": agent.__class__.__name__,
            "actions_taken": agent_result.get("actions_taken", []),
            "proposed_actions": agent_result.get("proposed_actions", []),
            "approval_requirement": agent_result.get("approval_requirement", {"requires_approval": False}),
            "generated_files": agent_result.get("generated_files", []),
            "affected_classes": agent_result.get("affected_classes", []),
            "conflicts": agent_result.get("conflicts", []),
            "citations": agent_result.get("citations", []),
            "timetable_data": agent_result.get("timetable_data", []),
            "execution_duration_ms": duration_ms
        }

central_orchestrator = CentralAgentOrchestrator()

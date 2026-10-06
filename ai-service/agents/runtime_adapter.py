"""Compatibility adapter for legacy agent entry points."""

from typing import Any, Dict, List, Optional


def run_operational_agent(
    prompt: str,
    user_id: str,
    conversation_id: str,
    role: str,
    context_history: Optional[List[Dict[str, str]]] = None,
    user_context: Optional[Dict[str, Any]] = None,
    target_agent: Optional[str] = None,
    file_id: Optional[str] = None,
) -> Dict[str, Any]:
    identity = user_context or {}
    authenticated_id = str(identity.get("id") or identity.get("userId") or "")
    authenticated_role = str(identity.get("role") or "").upper()
    if authenticated_role in {"FACULTY", "PROFESSOR"}:
        authenticated_role = "TEACHER"
    if (
        not authenticated_id
        or authenticated_id != str(user_id)
        or not authenticated_role
        or not isinstance(identity.get("permissions"), list)
    ):
        return {
            "success": False,
            "answer": "I could not verify your authenticated CampusFlow identity and permissions. Please sign in again.",
            "detected_intent": "AUTHENTICATION_REQUIRED",
            "actions_taken": [],
            "tool_calls": [],
            "steps": [],
        }

    from agents.orchestrator import central_orchestrator

    return central_orchestrator.orchestrate(
        prompt=prompt,
        user_id=authenticated_id,
        role=authenticated_role,
        conversation_id=conversation_id,
        target_agent=target_agent,
        context_history=context_history,
        user_context=identity,
        file_id=file_id,
    )

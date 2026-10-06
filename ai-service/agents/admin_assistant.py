from typing import Any, Dict, List, Optional

from agents.runtime_adapter import run_operational_agent


class AdminAssistant:
    """Compatibility entry point routed through the shared authenticated runtime."""

    def handle_query(
        self,
        prompt: str,
        user_id: str,
        conversation_id: str,
        context_history: Optional[List[Dict[str, str]]] = None,
        user_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        return run_operational_agent(
            prompt=prompt,
            user_id=user_id,
            conversation_id=conversation_id,
            role=None,
            context_history=context_history,
            user_context=user_context,
            target_agent="admin",
        )


admin_assistant = AdminAssistant()

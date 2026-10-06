from typing import Any, Dict, List, Optional

from agents.runtime_adapter import run_operational_agent


class ERPAssistantAgent:
    """General compatibility entry point backed by the shared agent runtime."""

    def handle_request(
        self,
        prompt: str,
        user_id: str,
        conversation_id: str,
        role: str = "student",
        context_history: Optional[List[Dict[str, str]]] = None,
        user_context: Optional[Dict[str, Any]] = None,
        file_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return run_operational_agent(
            prompt=prompt,
            user_id=user_id,
            conversation_id=conversation_id,
            role=role,
            context_history=context_history,
            user_context=user_context,
            target_agent="general",
            file_id=file_id,
        )


erp_assistant_agent = ERPAssistantAgent()

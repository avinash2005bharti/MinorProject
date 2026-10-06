"""
Mock LLM Provider for deterministic testing of agents and tool loops.
Allows configuring canned responses, tool call sequences, and error simulations,
while recording all invocation history.
"""

from typing import List, Dict, Any, Generator, Optional, Callable
from loguru import logger


class MockLLMProvider:
    """
    Test double for LLMProvider.
    Records call history and returns configured canned responses or simulated tool calls.
    """
    def __init__(self):
        self.call_history: List[Dict[str, Any]] = []
        self._canned_responses: List[Dict[str, Any]] = []
        self._response_callbacks: List[Callable[[List[Dict[str, Any]]], Optional[Dict[str, Any]]]] = []
        self._default_content: str = "Mock response from CampusFlow test provider."
        self.simulated_exception: Optional[Exception] = None
        self.total_tokens_used: int = 0

    def is_configured(self) -> bool:
        return True

    def reset(self):
        """Clears call history and configured canned responses."""
        self.call_history.clear()
        self._canned_responses.clear()
        self._response_callbacks.clear()
        self.simulated_exception = None
        self.total_tokens_used = 0

    def set_canned_responses(self, responses: List[Dict[str, Any]]):
        """
        Enqueues responses to be returned sequentially.
        Each response can have keys: 'content', 'tool_calls', 'reasoning', 'role'.
        """
        self._canned_responses = list(responses)

    def add_canned_response(
        self,
        content: str = "",
        tool_calls: Optional[List[Dict[str, Any]]] = None,
        reasoning: Optional[str] = None
    ):
        """Convenience method to enqueue a single canned response."""
        self._canned_responses.append({
            "content": content,
            "tool_calls": tool_calls,
            "reasoning": reasoning,
            "role": "assistant"
        })

    def add_response_callback(self, callback: Callable[[List[Dict[str, Any]]], Optional[Dict[str, Any]]]):
        """Adds a function that inspects messages and optionally returns a response dict."""
        self._response_callbacks.append(callback)

    def simulate_error_once(self, exception: Exception):
        """Causes the next invocation to raise the given exception."""
        self.simulated_exception = exception

    def chat(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[Any] = None,
        reasoning_effort: Optional[str] = None,
        response_format: Optional[Dict[str, Any]] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048,
        role: str = "reasoning",
        model: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Simulates chat completion with tool calling support."""
        if self.simulated_exception:
            exc = self.simulated_exception
            self.simulated_exception = None
            raise exc

        call_record = {
            "messages": messages,
            "tools": tools,
            "tool_choice": tool_choice,
            "reasoning_effort": reasoning_effort,
            "response_format": response_format,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "role": role,
            "model": model or f"mock-{role}",
            "kwargs": kwargs
        }
        self.call_history.append(call_record)

        # Check callbacks first
        for cb in self._response_callbacks:
            custom_resp = cb(messages)
            if custom_resp is not None:
                return self._format_response(custom_resp, model or f"mock-{role}")

        # Check canned responses queue
        if self._canned_responses:
            next_resp = self._canned_responses.pop(0)
            return self._format_response(next_resp, model or f"mock-{role}")

        # Default fallback response
        return self._format_response({
            "content": self._default_content,
            "tool_calls": None,
            "reasoning": "Mock reasoning step completed.",
            "role": "assistant"
        }, model or f"mock-{role}")

    def generate(
        self,
        messages: List[Dict[str, Any]],
        temperature: float = 0.3,
        max_tokens: int = 1500,
        model: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Backwards-compatible generate signature."""
        return self.chat(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            model=model,
            **kwargs
        )

    def generate_stream(
        self,
        messages: List[Dict[str, Any]],
        temperature: float = 0.3,
        max_tokens: int = 1500,
        **kwargs
    ) -> Generator[str, None, None]:
        """Simulates streaming token by token."""
        res = self.generate(messages=messages, temperature=temperature, max_tokens=max_tokens, **kwargs)
        content = res.get("content") or ""
        for word in content.split(" "):
            yield word + " "

    def chat_stream(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        **kwargs
    ) -> Generator[Dict[str, Any], None, None]:
        """Simulates streaming chunks including tool calls."""
        res = self.chat(messages=messages, tools=tools, **kwargs)
        yield {
            "delta": {"content": res.get("content", ""), "role": "assistant"},
            "tool_calls": res.get("tool_calls"),
            "finish_reason": "stop" if not res.get("tool_calls") else "tool_calls"
        }

    def _format_response(self, resp: Dict[str, Any], model: str) -> Dict[str, Any]:
        content = resp.get("content", "")
        tool_calls = resp.get("tool_calls")
        reasoning = resp.get("reasoning")
        prompt_tokens = 25
        completion_tokens = max(10, len(content.split()) if content else 10)
        total = prompt_tokens + completion_tokens
        self.total_tokens_used += total

        return {
            "content": content,
            "tool_calls": tool_calls,
            "reasoning": reasoning,
            "role": resp.get("role", "assistant"),
            "tokens": {
                "prompt": prompt_tokens,
                "completion": completion_tokens,
                "total": total
            },
            "model": model,
            # Provide an object-like wrapper for response.choices[0].message compatibility if needed
            "message": {
                "role": "assistant",
                "content": content,
                "tool_calls": tool_calls,
                "reasoning": reasoning
            }
        }

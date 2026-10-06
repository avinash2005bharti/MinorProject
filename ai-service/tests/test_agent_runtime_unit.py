import os
import sys
import unittest
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agents.agent_definition import AgentDefinition
from agents.react_agent_loop import AgentRuntime
from tools.tool_registry import AgentToolRegistry, ToolAuthorizationError, agent_tool_registry


class FakeMemory:
    class LTM:
        @staticmethod
        def retrieve_relevant_facts(**_kwargs):
            return []

    class STM:
        @staticmethod
        def get_messages(limit=0):
            return []

    ltm = LTM()

    @staticmethod
    def get_stm(**_kwargs):
        return FakeMemory.STM()

    @staticmethod
    def record_turn(**_kwargs):
        return None


class FakeRegistry:
    def __init__(self, result):
        self.tool = SimpleNamespace(name="inspect_record", operation="read")
        self.result = result

    def get_tools_for_user(self, *_args):
        return [self.tool]

    @staticmethod
    def to_openai_tools(_tools):
        return [{"type": "function", "function": {"name": "inspect_record"}}]

    def execute_tool(self, **_kwargs):
        return self.result

    def get_tool(self, name):
        return self.tool if name == self.tool.name else None


class FakeLLM:
    def __init__(self, responses):
        self.responses = iter(responses)
        self.calls = []

    def chat(self, **kwargs):
        self.calls.append(kwargs)
        return next(self.responses)


def tool_call(name="inspect_record", arguments=None):
    return {
        "content": "",
        "tool_calls": [{
            "id": "call-1",
            "function": {
                "name": name,
                "arguments": arguments or {}
            }
        }]
    }


def final_response(content):
    return {"content": content, "tool_calls": None}


class AgentRuntimeUnitTests(unittest.TestCase):
    def make_agent_definition(self):
        return AgentDefinition(
            name="UnitAgent",
            role="STUDENT",
            description="Test runtime agent",
            goal="Test runtime execution",
            system_instructions="Use backend tools for live records.",
            allowed_tools=["inspect_record"],
        )

    def make_runtime(self, registry, responses):
        runtime = object.__new__(AgentRuntime)
        runtime.tool_registry = registry
        runtime.llm = FakeLLM(responses)
        runtime.memory = FakeMemory()
        return runtime

    def test_tool_observation_is_returned_to_planner_before_final(self):
        registry = FakeRegistry({"success": True, "data": {"recordId": "R-1"}})
        runtime = self.make_runtime(
            registry,
            [tool_call(), final_response("Record R-1 was retrieved.")],
        )
        result = runtime.run(
            prompt="Show my record.",
            user_context={"id": "user-1", "role": "STUDENT", "permissions": ["AI_CHAT"]},
            conversation_id="conversation-1",
            agent_def=self.make_agent_definition(),
        )

        self.assertEqual(result["actions_taken"], ["inspect_record"])
        self.assertTrue(result["success"])
        second_messages = runtime.llm.calls[1]["messages"]
        observation = next(message for message in second_messages if message["role"] == "tool")
        self.assertIn("R-1", observation["content"])

    def test_failed_tool_cannot_be_overridden_by_successful_sounding_llm_text(self):
        registry = FakeRegistry({"success": False, "error": "NOT_FOUND", "message": "Record not found."})
        runtime = self.make_runtime(
            registry,
            [tool_call(), final_response("The record was created successfully.")],
        )
        result = runtime.run(
            prompt="Create a record.",
            user_context={"id": "user-1", "role": "STUDENT", "permissions": ["AI_CHAT"]},
            conversation_id="conversation-2",
            agent_def=self.make_agent_definition(),
        )

        self.assertFalse(result["success"])
        self.assertIn("Record not found", result["answer"])
        self.assertNotIn("created successfully", result["answer"])

    def test_missing_authenticated_context_stops_before_model_execution(self):
        runtime = self.make_runtime(FakeRegistry({"success": True}), [])
        result = runtime.run(
            prompt="Do something.",
            user_context={"id": "user-1", "role": "STUDENT"},
            conversation_id="conversation-3",
            agent_def=self.make_agent_definition(),
        )

        self.assertFalse(result["success"])
        self.assertEqual(runtime.llm.calls, [])

    def test_student_is_denied_admin_tool_before_gateway_dispatch(self):
        registry = AgentToolRegistry()
        with patch("tools.tool_registry.requests.post") as backend_post:
            with self.assertRaises(ToolAuthorizationError):
                registry.execute_tool(
                    "create_teacher",
                    {"name": "Unauthorized"},
                    {"id": "student-1", "role": "STUDENT", "permissions": ["AI_CHAT"]},
                )
        backend_post.assert_not_called()

    def test_schema_failure_does_not_dispatch_to_backend(self):
        registry = AgentToolRegistry()
        with patch("tools.tool_registry.requests.post") as backend_post:
            result = registry.execute_tool(
                "create_teacher",
                {},
                {"id": "hod-1", "role": "HOD", "permissions": ["FACULTY_MANAGE"]},
            )
        self.assertFalse(result["success"])
        self.assertEqual(result["error"], "INVALID_TOOL_ARGUMENTS")
        backend_post.assert_not_called()

    def test_role_tool_discovery_excludes_teacher_creation_for_students(self):
        tools = agent_tool_registry.get_tools_for_user("STUDENT", ["AI_CHAT", "ATTENDANCE_READ_SELF"])
        self.assertNotIn("create_teacher", {tool.name for tool in tools})


if __name__ == "__main__":
    unittest.main()

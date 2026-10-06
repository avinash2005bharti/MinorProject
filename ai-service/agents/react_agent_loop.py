"""
CampusFlow ReAct Autonomous Execution Loop (Section 13, 14, 20, 21, 27).
Implements:
Understand -> Plan -> Select Tool -> Execute Core Operation -> Observe Result -> Iterate/Correct -> Verify -> Grounded Response.
Guarantees:
- Real backend execution (zero duplicated business logic)
- Server-side RBAC & resource-level scoping
- Multi-step operation chaining
- Error recovery & self-correction
- Destructive action confirmation state machine
- Strict grounding (No fake success)
"""

import os
import json
import time
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from loguru import logger

from tools.tool_registry import agent_tool_registry, ToolAuthorizationError
from agents.agent_definition import AgentDefinition
from llm.provider import llm_provider
from memory.langchain_memory import langchain_memory
from memory.mongo_memory import mongo_memory


@dataclass
class AgentState:
    user_id: str
    role: str
    agent_id: str
    conversation_id: str
    original_request: str
    messages: List[Dict[str, Any]] = field(default_factory=list)
    current_goal: str = ""
    plan: List[str] = field(default_factory=list)
    available_tools: List[str] = field(default_factory=list)
    tool_calls: List[Dict[str, Any]] = field(default_factory=list)
    tool_results: List[Dict[str, Any]] = field(default_factory=list)
    observations: List[Dict[str, Any]] = field(default_factory=list)
    errors: List[Dict[str, Any]] = field(default_factory=list)
    pending_confirmation: Optional[Dict[str, Any]] = None
    verification_status: str = "not_required"
    final_response: str = ""


class AgentRuntime:
    """
    Autonomous ReAct (Reasoning + Action) Multi-Step Agent Execution Engine.
    """

    def __init__(self):
        self.tool_registry = agent_tool_registry
        self.llm = llm_provider
        self.memory = langchain_memory

    def run(
        self,
        prompt: str,
        user_context: Dict[str, Any],
        conversation_id: str,
        agent_def: AgentDefinition,
        context_history: Optional[List[Dict[str, str]]] = None,
        file_id: Optional[str] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        raw_user_id = user_context.get("id") or user_context.get("userId") or user_context.get("user_id")
        user_id = str(raw_user_id) if raw_user_id else ""
        user_role = str(user_context.get("role") or "").upper()
        user_name = user_context.get("name") or "User"
        user_perms = user_context.get("permissions")
        if not user_id or not user_role or not isinstance(user_perms, list):
            return {
                "success": False,
                "answer": "I could not verify your authenticated CampusFlow identity and permissions. Please sign in again.",
                "detected_intent": "AUTHENTICATION_REQUIRED",
                "agent_used": agent_def.name,
                "actions_taken": [],
                "tool_calls": [],
                "steps": []
            }
        if user_role in {"FACULTY", "PROFESSOR"}:
            user_role = "TEACHER"

        state = AgentState(
            user_id=user_id,
            role=user_role,
            agent_id=agent_def.name,
            conversation_id=conversation_id,
            original_request=prompt,
            current_goal=agent_def.description,
        )

        logger.info(f"[ReActExecutionLoop] Starting agent loop for {agent_def.name} | User: {user_name} ({user_role}) | Conv: {conversation_id}")

        # ---------------------------------------------------------------------
        # 1. MEMORY & LTM CONTEXT GATHERING
        # ---------------------------------------------------------------------
        stm = self.memory.get_stm(session_id=conversation_id, user_id=user_id)
        recent_messages = stm.get_messages(limit=6)

        # Retrieve relevant user facts & preferences from Qdrant LTM
        ltm_facts_docs = []
        try:
            ltm_facts_docs = self.memory.ltm.retrieve_relevant_facts(
                query=prompt,
                user_id=user_id,
                department=user_context.get("departmentCode"),
                top_k=4
            )
        except Exception as ltm_err:
            logger.debug(f"[ReActExecutionLoop] LTM retrieval warning: {ltm_err}")

        ltm_facts_text = "\n".join([f"• {doc.page_content}" for doc in ltm_facts_docs])

        # ---------------------------------------------------------------------
        # 2. DYNAMIC TOOL RESOLUTION (RBAC FILTERING)
        # ---------------------------------------------------------------------
        permitted_tools = self.tool_registry.get_tools_for_user(user_role, user_perms)
        agent_accessible_tools = [
            t for t in permitted_tools
            if t.name in agent_def.allowed_tools or user_role == "ADMIN"
        ]

        openai_tools = self.tool_registry.to_openai_tools(agent_accessible_tools)
        state.available_tools = [tool.name for tool in agent_accessible_tools]
        logger.info(f"[ReActExecutionLoop] Loaded {len(agent_accessible_tools)} authorized tools for {agent_def.name}")

        # ---------------------------------------------------------------------
        # 3. BUILD SYSTEM PROMPT & GROUNDING INSTRUCTIONS
        # ---------------------------------------------------------------------
        system_content = (
            f"{agent_def.system_instructions}\n\n"
            f"AUTHENTICATED USER IDENTITY:\n"
            f"• Name: {user_name}\n"
            f"• User ID: {user_id}\n"
            f"• Role: {user_role}\n"
            f"• Department: {user_context.get('departmentCode') or 'not provided'} ({user_context.get('departmentName') or 'not provided'})\n"
        )

        if user_context.get("studentId"):
            system_content += f"• Student Profile ID: {user_context.get('studentId')}\n"
        if user_context.get("teacherId"):
            system_content += f"• Faculty Teacher ID: {user_context.get('teacherId')}\n"

        if ltm_facts_text and agent_def.memory_policy.ltm_enabled:
            system_content += (
                "\nRELEVANT LONG-TERM MEMORY (QDRANT; preferences/context only, never a source of current ERP facts):\n"
                f"{ltm_facts_text}\n"
            )

        system_content += (
            "\nOPERATIONAL EXECUTION RULES:\n"
            "1. Use an authorized tool for every live CampusFlow lookup or operation; answer general educational questions directly without tools.\n"
            "2. Never claim an operation or lookup succeeded unless its tool returned success=true. State operational facts only from tool observations.\n"
            "3. For multi-step requests, call one tool, inspect its result, then decide the next action. Never assume a prior step succeeded.\n"
            "4. If a tool returns an error, explain the observed failure or choose a safe recovery action. Never invent a successful result.\n"
            "5. Ask for missing required information rather than guessing identity, department, dates, records, or resource IDs.\n"
            "5. ARGUMENT FORMAT: Omit optional parameters rather than passing null values.\n"
            "6. OUTPUT FORMAT: Respond in clean, professional GitHub-flavored Markdown with clear headings and bullet points."
        )

        # ---------------------------------------------------------------------
        # 4. PREPARE CONVERSATION MESSAGES
        # ---------------------------------------------------------------------
        messages: List[Dict[str, Any]] = [{"role": "system", "content": system_content}]

        # Append recent history
        effective_history = context_history or [
            {"role": "assistant" if m.type == "ai" else "user", "content": m.content}
            for m in recent_messages
        ]
        for turn in effective_history[-4:]:
            r = "assistant" if turn.get("role") in ["assistant", "ai"] else "user"
            c = turn.get("content") or ""
            if c:
                messages.append({"role": r, "content": c})

        # Append current user prompt
        messages.append({"role": "user", "content": prompt})
        state.messages = messages

        # ---------------------------------------------------------------------
        # 5. ITERATIVE ReAct EXECUTION LOOP
        # ---------------------------------------------------------------------
        max_steps = agent_def.planning_policy.max_steps
        current_step = 0
        actions_taken: List[str] = []
        tool_calls_trace: List[Dict[str, Any]] = []
        generated_files: List[Dict[str, Any]] = []
        final_answer = ""
        requires_confirmation = False
        confirmation_prompt = None
        action_to_confirm = None

        while current_step < max_steps:
            current_step += 1
            logger.info(f"[ReActExecutionLoop] Step {current_step}/{max_steps} executing...")

            try:
                llm_response = self.llm.chat(
                    messages=messages,
                    tools=openai_tools if openai_tools else None,
                    temperature=agent_def.planning_policy.temperature,
                    max_tokens=1500
                )
            except Exception as llm_err:
                logger.error(f"[ReActExecutionLoop] LLM invocation error: {llm_err}")
                final_answer = "I couldn't complete the request because the AI planning service is temporarily unavailable. No further tool operation was attempted."
                break

            response_content = llm_response.get("content") or ""
            tool_calls = llm_response.get("tool_calls")

            # -----------------------------------------------------------------
            # CASE A: LLM Decided to Call One or More Tools
            # -----------------------------------------------------------------
            if tool_calls and len(tool_calls) > 0:
                # Format tool calls with JSON-string arguments for strict OpenAI/Groq API compliance
                formatted_tool_calls = []
                call_ids = []
                for index, tc in enumerate(tool_calls):
                    tc_func = tc.get("function", {})
                    raw_args = tc_func.get("arguments", {})
                    str_args = json.dumps(raw_args) if isinstance(raw_args, (dict, list)) else str(raw_args)
                    tc_id = tc.get("id") or f"call_{current_step}_{index}"
                    call_ids.append(tc_id)
                    formatted_tool_calls.append({
                        "id": tc_id,
                        "type": "function",
                        "function": {
                            "name": tc_func.get("name"),
                            "arguments": str_args
                        }
                    })

                # Append assistant tool call message to dialogue state
                messages.append({
                    "role": "assistant",
                    "content": response_content or None,
                    "tool_calls": formatted_tool_calls
                })

                for index, tc in enumerate(tool_calls):
                    tc_id = call_ids[index]
                    func_data = tc.get("function", {})
                    tool_name = func_data.get("name")
                    arguments = func_data.get("arguments") or {}

                    if isinstance(arguments, str):
                        try:
                            arguments = json.loads(arguments)
                        except json.JSONDecodeError as parse_error:
                            arguments = None

                    if index > 0:
                        tool_result = {
                            "success": False,
                            "error": "REPLAN_AFTER_OBSERVATION",
                            "message": "Only one tool may be executed per planning step. Inspect the preceding observation and choose whether this action is still required."
                        }
                    elif arguments is None or not isinstance(arguments, dict):
                        tool_result = {
                            "success": False,
                            "error": "INVALID_TOOL_ARGUMENTS",
                            "message": "Tool arguments were not valid JSON object data."
                        }
                    else:
                        logger.info(f"[AgentRuntime] Executing tool '{tool_name}' for user {user_id}.")
                        execution_context = {
                            **user_context,
                            "id": user_id,
                            "role": user_role,
                            "agentId": agent_def.name,
                            "conversationId": conversation_id
                        }
                        try:
                            tool_result = self.tool_registry.execute_tool(
                                tool_name=tool_name,
                                arguments=arguments,
                                user_context=execution_context
                            )
                        except ToolAuthorizationError as auth_error:
                            tool_result = {
                                "success": False,
                                "error": "TOOL_AUTHORIZATION_DENIED",
                                "message": str(auth_error)
                            }
                        except Exception as tool_error:
                            logger.exception(f"[AgentRuntime] Tool dispatch failed for {tool_name}: {tool_error}")
                            tool_result = {
                                "success": False,
                                "error": "TOOL_EXECUTION_FAILED",
                                "message": "The tool could not be executed. No successful operation is being reported."
                            }

                    plan_step = f"Call {tool_name}"
                    state.plan.append(plan_step)
                    if tool_result.get("requires_confirmation"):
                            state.plan[-1] = f"Awaiting confirmation: {tool_name}"
                    elif tool_result.get("success"):
                            state.plan[-1] = f"Completed: {tool_name}"
                    else:
                            state.plan[-1] = f"Failed: {tool_name}"

                    actions_taken.append(tool_name)
                    trace_entry = {
                        "tool": tool_name,
                        "arguments": arguments,
                        "success": tool_result.get("success", False),
                        "steps": tool_result.get("steps", []),
                        "error": tool_result.get("error"),
                        "result": tool_result
                    }
                    tool_calls_trace.append(trace_entry)
                    state.tool_calls.append({"tool": tool_name, "arguments": arguments})
                    state.tool_results.append(tool_result)
                    state.observations.append(tool_result)
                    if not tool_result.get("success") and not tool_result.get("requires_confirmation"):
                        state.errors.append({"tool": tool_name, "error": tool_result.get("error"), "message": tool_result.get("message")})
                    elif tool_result.get("success"):
                        state.errors = [error for error in state.errors if error.get("tool") != tool_name]

                    # Handle Destructive Confirmation Requirement
                    if tool_result.get("requires_confirmation"):
                        requires_confirmation = True
                        confirmation_prompt = tool_result.get("confirmation_prompt")
                        action_to_confirm = tool_result.get("action_to_confirm")
                        state.pending_confirmation = action_to_confirm
                        final_answer = confirmation_prompt or "⚠️ Confirmation required for this operation."

                    # Collect any generated files (Excel/PDF reports)
                    if tool_result.get("data") and isinstance(tool_result["data"], dict):
                        file_info = tool_result["data"]
                        if file_info.get("downloadUrl") or file_info.get("filename"):
                            generated_files.append({
                                "name": file_info.get("filename", "report"),
                                "url": file_info.get("downloadUrl", ""),
                                "type": "xlsx" if "xlsx" in file_info.get("filename", "") else "pdf"
                            })

                    # Append observation as tool response
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc_id,
                        "content": json.dumps(tool_result, default=str)
                    })
                    state.messages = messages

                # If confirmation was requested, halt execution loop immediately
                if requires_confirmation:
                    break

                # Continue loop to allow LLM to observe results and either call next tool or synthesize final response
                continue

            # -----------------------------------------------------------------
            # CASE B: LLM Emitted Final Grounded Response (No Further Tool Calls)
            # -----------------------------------------------------------------
            else:
                final_answer = response_content.strip()
                break

        # ---------------------------------------------------------------------
        # 6. VERIFICATION & GROUNDING CHECK (Section 27)
        # ---------------------------------------------------------------------
        if state.errors and not requires_confirmation:
            failed_trace = next(
                (trace for trace in reversed(tool_calls_trace) if not trace.get("success")),
                None
            )
            if failed_trace:
                observed_error = failed_trace.get("result", {})
                final_answer = (
                    f"I couldn't complete `{failed_trace.get('tool')}`. "
                    f"Observed error: {observed_error.get('message') or observed_error.get('error') or 'The backend operation failed.'}"
                )

        if not final_answer:
            if requires_confirmation:
                final_answer = confirmation_prompt or "This operation requires your confirmation before it can run."
            elif tool_calls_trace:
                last_trace = tool_calls_trace[-1]
                if last_trace.get("success"):
                    final_answer = (
                        f"The tool `{last_trace['tool']}` returned success, but I could not generate a verified summary. "
                        "Please inspect the operation result before relying on it."
                    )
                else:
                    final_answer = (
                        f"I couldn't complete `{last_trace['tool']}`. "
                        f"Observed error: {last_trace.get('error') or 'The tool returned an unsuccessful result.'}"
                    )
            else:
                final_answer = "I couldn't produce a response. No tool execution was performed."

        if any(self.tool_registry.get_tool(call["tool"]).operation == "write" for call in state.tool_calls if self.tool_registry.get_tool(call["tool"])):
            state.verification_status = "backend_write_result_observed"
        state.final_response = final_answer

        duration_ms = int((time.time() - start_time) * 1000)

        # ---------------------------------------------------------------------
        # 7. RECORD TURN IN LANGCHAIN STM & EXTRACT LTM FACTS
        # ---------------------------------------------------------------------
        try:
            self.memory.record_turn(
                user_id=user_id,
                role=user_role.lower(),
                conversation_id=conversation_id,
                user_prompt=prompt,
                assistant_response=final_answer,
                tool_calls=tool_calls_trace,
                department=user_context.get("departmentCode")
            )
        except Exception as rec_err:
            logger.warning(f"[AgentRuntime] Could not persist the conversation turn: {rec_err}")

        logger.info(f"[ReActExecutionLoop] Completed in {duration_ms}ms | Actions: {actions_taken}")

        return {
            "success": not state.errors and not requires_confirmation,
            "conversation_id": conversation_id,
            "answer": final_answer,
            "response": final_answer,
            "detected_intent": agent_def.role.upper() + "_OPERATOR_EXECUTION",
            "agent_used": agent_def.name,
            "actions_taken": actions_taken,
            "tool_calls": tool_calls_trace,
            "steps": [s for tc in tool_calls_trace for s in tc.get("steps", [])],
            "requires_confirmation": requires_confirmation,
            "confirmation_prompt": confirmation_prompt,
            "action_to_confirm": action_to_confirm,
            "generated_files": generated_files,
            "execution_duration_ms": duration_ms,
            "agent_state": {
                "current_goal": state.current_goal,
                "plan": state.plan,
                "available_tools": state.available_tools,
                "tool_calls": state.tool_calls,
                "tool_results": state.tool_results,
                "errors": state.errors,
                "verification_status": state.verification_status
            }
        }


ReActExecutionLoop = AgentRuntime
react_agent_runner = AgentRuntime()

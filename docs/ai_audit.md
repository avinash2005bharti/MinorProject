# CampusFlow AI Agent Architecture Audit

**Updated:** 2026-10-05  
**Scope:** `ai-service/` (FastAPI/Python), `backend/src/` (Express/Node.js), agent memory, ERP tool services, and the AI chat UI.

## Architecture status

The conversational agent path now uses one operational execution loop. Role-specific agent classes are compatibility entry points, not independent LLM chat implementations:

```text
Authenticated Express request
  -> identity and permission context
  -> FastAPI authenticated request boundary
  -> CentralAgentOrchestrator / AgentFactory
  -> AgentRuntime (memory, model decision, tool filtering, execution, observation)
  -> Python ToolRegistry
  -> authenticated Node ERP-tool gateway
  -> per-tool authorization and resource-scoped ERP service
  -> PostgreSQL / MongoDB / Qdrant
  -> tool result returned to the runtime
  -> another model decision or a grounded final answer
```

All tool dispatch is bounded by the configured maximum step count. The runtime permits one tool execution per model decision, feeds the structured result back as a tool observation, records a safe operational plan trace, and rejects an unsuccessful tool result if the model tries to report success. General educational questions may be answered without ERP tools.

## Agent and execution inventory

| Agent or entry point | Purpose | Tool execution | Memory and data sources | LLM | Role restrictions and current boundary |
|---|---|---|---|---|---|
| `CentralAgentOrchestrator` | Validates authenticated context, selects a role definition, and starts the shared runtime | Delegates to `AgentRuntime` | Passes user/conversation context | Shared provider | Rejects missing or inconsistent user ID, role, or permission list |
| `StudentAssistant`, `FacultyAssistant`, `AdminAssistant`, `ERPAssistantAgent` | Backward-compatible chat APIs | Thin adapters to the shared runtime | MongoDB STM and user-scoped Qdrant LTM through the runtime | Shared provider | Context must come from authenticated gateway data |
| `AttendanceAgent`, `LeaveManagementAgent`, `AcademicInformationAgent`, `ReportingAgent` | Legacy domain-specific chat APIs | Thin adapters; operations execute through registered tools | Runtime memory; PostgreSQL operations remain in backend services | Shared provider | Tool policy and service scope apply; these modules do not own business logic |
| `TeacherSchedulingAgent`, `TeacherAbsenceAgent`, `TimetableAgent` | Legacy scheduling/timetable chat APIs | Thin adapters; timetable generation invokes the existing constraint optimizer | Runtime memory; PostgreSQL is the schedule source of truth | Shared provider for decisions; deterministic optimizer for schedule generation | HOD department scope and admin selection are checked server-side |
| `FileGenerationAgent` | Legacy document/export chat API | Thin adapter; registered export tools invoke existing backend services | Runtime conversation context and backend document services | Shared provider | No independent write implementation |
| `RAGAgent` | Retrieval utility, not a separate conversational agent | Called by the locally authorized `search_knowledge` tool | Qdrant documents filtered by verified department | No conversational LLM call | Requires authenticated department scope |
| `MemoryAgent` / LangChain memory coordinator | STM/LTM compatibility utilities | Not an ERP-action executor | MongoDB conversation memory; Qdrant LTM filters by user ID and, when present, department | Shared provider for optional fact extraction | Live ERP facts must still come from ERP tools |
| `EmailAgent` and file-type pipelines | Delivery/processing utilities, not user-facing conversational agents | Called by their existing application flows | Existing application records and document metadata | No agent decision loop | Access remains with the calling authenticated backend workflow |
| `/ai/chat` and `/ai/chat/stream` | FastAPI chat entry points | Both delegate to the same orchestrator/runtime | Runtime memory | Shared provider | Require internal gateway secret plus verified identity; SSE currently emits buffered completion/tool-result events, not live reasoning |

## Tool inventory and policy

The Python registry contains **40 tools**: 39 backend operations and one local knowledge-search operation. All 39 backend action names were checked against a concrete `erpAgentTools` handler and a `TOOL_ACCESS` policy in the Node AI controller. `searchKnowledge` is handled locally only after Python role/permission checks and verified department scoping.

| Capability group | Registered operations |
|---|---|
| Teacher/faculty | List/get/search, create/update/deactivate, workload/availability, teachers on leave, teacher leave |
| Student | List/get/create/deactivate, attendance and personal schedule |
| Attendance | Read attendance, mark/bulk-mark attendance, submit/review attendance queries |
| Leave | Apply, approve, reject |
| Timetable | Read timetable/student/teacher schedules, generate, export Excel/PDF |
| Academic resources | Read/create/delete subjects; list/create classrooms; check room availability |
| Mentoring and reports | List mentees, appoint TG, department analytics, workload and attendance reports |
| Administration | List users |
| Knowledge | Search department-scoped institutional documents with citations |

The registry validates tool names and input schemas, filters discovery by role and permissions, classifies reads/writes, and marks destructive operations for confirmation. The Node gateway repeats authorization before dispatch. Backend handlers perform resource/ownership and department-scope checks; prompt instructions are not treated as security controls.

This inventory covers the current AI tool registry, **not every REST API operation in the ERP**. Department CRUD, every file/note lifecycle operation, and other non-AI API capabilities are not all exposed as agent tools.

## Data, memory, verification, and audit

- **Live ERP state:** PostgreSQL through existing Node ERP services; the timetable optimizer reads/writes through the existing Python PostgreSQL service.
- **STM:** MongoDB conversation/session state and recent messages.
- **LTM:** Qdrant user memory; retrieval includes the authenticated user ID and optional department, so users do not see each other's personal memories.
- **Institution documents:** Qdrant search is restricted to the authenticated department. Private uploaded file content is additionally filtered by owner ID.
- **Audit:** Node records tool name, arguments, identity, agent/conversation IDs, result status, and resource ID for backend tool calls. Local knowledge search writes a Mongo execution log.
- **Confirmation:** Destructive tool calls stop before execution and return a pending action. The Node layer signs user-bound confirmation tokens and rechecks authorization at execution. Replay IDs are currently held in process memory, not a distributed store.
- **Write grounding:** Timetable generation reads the exact saved version back and compares persisted slot signatures before reporting success. The runtime otherwise reports write-result observation; there is no generic second-read verifier for every write.
- **Failure handling:** Tool errors are returned to the runtime as observations; unavailable services do not receive a fabricated fallback answer.

## Security and scope changes

- The FastAPI chat/timetable and other operational endpoints require the internal gateway secret and an identity whose ID and role match the supplied request fields.
- Direct schedule-analysis/apply routes are role- and department-gated. Substitution application validates the proposed slot, original teacher, substitute teacher, and department against PostgreSQL before writing.
- Timetable SQL reads now filter by requested semester, section, and department rather than returning all matching-semester slots.
- Faculty, subject, room, and timetable-generation inputs use explicit department scope; arbitrary first-department fallbacks were removed.
- Unknown or missing roles are not silently converted to student, and absent department values are not silently converted to CSE.
- The unused Node keyword-based local agent fallback and canned RAG-search success response were removed.

## Validation and remaining work

| Check | Result |
|---|---|
| Python compilation | Passed after the refactor changes |
| Node.js syntax checks for changed controllers/services | Passed |
| Python runtime unit tests (`tests/test_agent_runtime_unit.py`) | 6 passed before the final scoping edits; the final edits were compile-checked |
| Backend tool-to-handler and tool-to-policy consistency | Passed: 39/39 backend tools; local `searchKnowledge` is separately authorized |
| Department/slot SQL-scope checks with mocked query execution | Passed |
| Prisma schema validation | Not run: local Prisma CLI was unavailable; automatic `npx` installation was stopped |
| Live end-to-end role scenarios and real database writes | Not run; the existing integration test contains live database operations and was not used as an isolated test |

The complete security matrix and live end-to-end scenarios remain to be exercised in an isolated test database. Independent read-after-write verification, distributed confirmation-token replay protection, and true per-step streaming also remain follow-up work.

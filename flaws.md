# CampusFlow — Complete System Flaw Audit

## Audit Date

2026-10-07

## Executive Summary

An exhaustive, multi-disciplinary technical audit was conducted across the entire **CampusFlow** codebase (`c:\Users\avinash bharti\Desktop\minor project`), spanning the React/Vite Frontend, Node.js/Express Backend, Python FastAPI AI Microservice, PostgreSQL (Prisma) database, MongoDB (Mongoose/pymongo) conversational store, Qdrant Vector Engine, and associated container/deployment orchestrations (Docker Compose & Render).

The system possesses a sophisticated functional vision—combining university ERP operations (timetable generation, faculty substitution, attendance tracking, student leave workflows) with autonomous ReAct agentic assistance, multi-modal file ingestion, and vector RAG retrieval. 

However, a rigorous inspection of the runtime behavior, inter-service contracts, security boundaries, and database constraints reveals that several critical vulnerabilities, broken cross-container assumptions, and semantic fallbacks undermine the system's security, data integrity, and operational readiness. Prior remediation attempts patched symptoms superficially while leaving underlying attack vectors open (e.g., self-appointment as TG still succeeds via deferred user role assignment). Furthermore, the production multi-container deployment architecture completely breaks the document RAG indexing pipeline due to unshared local filesystem paths.

### Overall System Health

**CRITICAL** — Immediate architectural, security, and integration remediations are mandatory prior to any production deployment.

### System Health Matrix

| Dimension | Rating | Key Finding |
|---|---|---|
| **Security & RBAC** | **CRITICAL** | Student & faculty directories public; TG self-privilege escalation persists on login; student attendance stats IDOR; stateless 7-day JWTs with no-op logout. |
| **Microservice Architecture** | **CRITICAL** | Local filepath passing between Node.js and FastAPI containers fails in Docker & Render; RAG ingestion is non-functional across container boundaries. |
| **AI & Agentic Runtime** | **CRITICAL** | Hallucinated Groq model defaults (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`); SHA-256 token hashing used as "semantic embeddings" fallback destroys RAG similarity. |
| **Database & Data Integrity** | **HIGH** | Timetable generation creates multiple active records simultaneously without archiving old versions; timetable queries omit department scoping; vector deletions are non-existent. |
| **Business Logic & Workflows**| **HIGH** | Teacher leave approvals do not trigger substitution or notifications; frontend leave API calls non-existent backend endpoints (`/leaves` vs `/requests/leave`). |
| **DevOps & Deployment** | **HIGH** | Ephemeral random JWT secret on nodemon reload; Render persistent volume is not shared between Node and Python; Pinecone legacy remnants in docker-compose. |
| **Code Quality & Testing** | **MEDIUM** | Zero unit/integration tests (Jest, Mocha, Pytest absent); dual ORMs installed (Prisma + Sequelize); dead wrapper components. |

---

# Critical Findings

## FLAW-001 — Incomplete Fix for Tutor Guardian (TG) Self-Appointment Privilege Escalation

### Severity
CRITICAL

### Category
Security / Broken Access Control & Privilege Escalation

### Location
`backend/src/controllers/authController.js:433-457`, `backend/src/controllers/authController.js:134-138`

### Problem
During faculty registration (`POST /api/auth/register`), the previous remediation (SEC-06) set `newTeacher.isTG = false` inside the transaction. However, lines 433–457 still compute the `User` table role as:
```javascript
const targetRoleName = isTG ? 'TG' : 'TEACHER';
let teacherRole = await prisma.role.findUnique({ where: { name: targetRoleName } });
...
const newUser = await tx.user.create({
  data: {
    ...
    roleId: teacherRole.id
  }
});
```
On subsequent login (`POST /api/auth/login`), lines 134–138 resolve the user's effective role:
```javascript
const baseRole = (user.role?.name || 'STUDENT').toUpperCase();
const isTg = (user.teacherProfile?.isTG) || baseRole === 'TG';
let effectiveRole = baseRole;
if (isHod) effectiveRole = 'HOD';
else if (isTg && baseRole !== 'ADMIN') effectiveRole = 'TG';
```
Because `baseRole === 'TG'`, `isTg` evaluates to `true`, and `effectiveRole` is promoted to `TG`. The signed JWT and safe user object return role `'TG'`.

### Why This Is a Problem
Any faculty registrant who supplies `isTG: true` in their registration payload bypasses the administrative appointment process. Although their first session immediately following registration is minted as `TEACHER`, on their very next login they are permanently elevated to Tutor Guardian (TG), gaining unauthorized access to student leave approvals, mentorship records, and departmental disciplinary workflows.

### Evidence
- `backend/src/controllers/authController.js` lines 433–457:
  ```javascript
  const targetRoleName = isTG ? 'TG' : 'TEACHER';
  let teacherRole = await prisma.role.findUnique({ where: { name: targetRoleName } });
  if (!teacherRole) teacherRole = await prisma.role.findUnique({ where: { name: 'TEACHER' } });
  ...
  const newUser = await tx.user.create({ data: { ..., roleId: teacherRole.id } });
  ```
- `backend/src/controllers/authController.js` lines 134–138:
  ```javascript
  const isTg = (user.teacherProfile?.isTG) || baseRole === 'TG';
  ...
  else if (isTg && baseRole !== 'ADMIN') effectiveRole = 'TG';
  ```

### Impact
Unauthorized privilege escalation from standard faculty member to Tutor Guardian across all subsequent login sessions.

### Recommended Fix
1. In `authController.register`, unconditionally bind faculty registration to the `'TEACHER'` role:
   ```javascript
   const teacherRole = await prisma.role.findUnique({ where: { name: 'TEACHER' } });
   ```
2. In `authController.login`, derive `isTg` exclusively from the verified profile flag:
   ```javascript
   const isTg = Boolean(user.teacherProfile?.isTG);
   ```

### Priority
P0

---

## FLAW-002 — Public Unauthenticated Exposure and Bulk Data Ingestion of Student and Faculty Directories

### Severity
CRITICAL

### Category
Security / Broken Access Control / Data Leakage

### Location
`backend/src/routes/studentRoutes.js:14-19`, `backend/src/routes/facultyRoutes.js:20-25`

### Problem
Student and faculty directory endpoints utilize `optionalAuth` instead of mandatory authentication and RBAC checks:
- `GET /api/students`
- `GET /api/students/:id`
- `GET /api/faculty`
- `GET /api/faculty/:id`
- `GET /api/students/export` (completely unprotected!)
- `POST /api/students/import` (completely unprotected!)

### Why This Is a Problem
Any unauthenticated attacker on the public internet can:
1. Dump all student names, enrollment numbers, personal emails, phone numbers, semester levels, and section allocations.
2. Dump all faculty names, employee IDs, contact details, designations, and department affiliations.
3. Call `GET /api/students/export` without credentials and download a full Excel/CSV dump of the student body.
4. Call `POST /api/students/import` without credentials and upload an arbitrary CSV file to overwrite or inject rogue student records into the database.

### Evidence
- `backend/src/routes/studentRoutes.js` lines 14–19:
  ```javascript
  // Import & Export (Must precede /:id)
  router.post('/import', upload.single('file'), masterDataController.importStudents);
  router.get('/export', masterDataController.exportStudents);

  // Core Student CRUD (Cached 30s)
  router.get('/', optionalAuth, cacheService.middleware(30), studentController.getStudents);
  router.get('/:id', optionalAuth, studentController.getStudentById);
  ```
- `backend/src/routes/facultyRoutes.js` lines 24–25:
  ```javascript
  router.get('/', optionalAuth, cacheService.middleware(30), facultyController.getFaculty);
  router.get('/:id', optionalAuth, facultyController.getFacultyById);
  ```

### Impact
Catastrophic PII exposure (Family Educational Rights and Privacy / Digital Personal Data Protection violation) and unauthenticated database tampering.

### Recommended Fix
1. Protect `studentRoutes.js` with `verifyToken` and strict role gates:
   ```javascript
   router.post('/import', verifyToken, checkRole('admin', 'hod'), upload.single('file'), masterDataController.importStudents);
   router.get('/export', verifyToken, checkRole('admin', 'hod', 'faculty', 'tg'), masterDataController.exportStudents);
   router.get('/', verifyToken, studentController.getStudents);
   router.get('/:id', verifyToken, studentController.getStudentById);
   ```
2. Protect `facultyRoutes.js` with `verifyToken` on all listing and retrieval routes.

### Priority
P0

---

## FLAW-003 — Insecure Direct Object Reference (IDOR) on Student Attendance Records

### Severity
CRITICAL

### Category
Security / Broken Object Level Authorization (BOLA / IDOR)

### Location
`backend/src/routes/attendanceRoutes.js:8-11`, `backend/src/controllers/attendanceController.js:259-290`

### Problem
The student attendance retrieval endpoints accept an arbitrary `studentId` parameter without validating the caller's identity or role:
- `GET /api/attendance/stats/:studentId`
- `GET /api/attendance/student/:studentId`

In `attendanceController.js:259-290`:
```javascript
let studentId = req.params.studentId || req.query.studentId;
if (studentId === 'me' || !studentId) {
  studentId = req.user?.studentId;
  ...
}
const student = await prisma.student.findUnique({ where: { id: studentId } });
const records = await prisma.attendanceRecord.findMany({ where: { studentId: student.id } });
```

### Why This Is a Problem
Any student user with a valid login token can iterate through student UUIDs (or harvest them via FLAW-002) and view full subject-wise attendance percentages, dates attended/missed, and medical leave records of any other student.

### Evidence
- `backend/src/routes/attendanceRoutes.js` lines 8–11:
  ```javascript
  router.get('/stats', verifyToken, attendanceController.getStudentAttendanceStats);
  router.get('/stats/:studentId', verifyToken, attendanceController.getStudentAttendanceStats);
  router.get('/student', verifyToken, attendanceController.getStudentAttendanceStats);
  router.get('/student/:studentId', verifyToken, attendanceController.getStudentAttendanceStats);
  ```
- `backend/src/controllers/attendanceController.js` lines 259–290 lacks any check:
  `if (callerRole === 'STUDENT' && req.user.studentId !== studentId) return res.status(403)...`

### Impact
Unauthorized access to student academic and attendance records across the entire institution.

### Recommended Fix
Enforce an authorization check: If caller role is `'STUDENT'`, force `studentId = req.user.studentId` and reject any request attempting to query a different student ID with HTTP 403 Forbidden.

### Priority
P0

---

## FLAW-004 — Cross-Container Local Filepath Passing Breaking Notes RAG Pipeline in Production

### Severity
CRITICAL

### Category
Architecture / Microservices & Production Deployment Blocker

### Location
`backend/src/controllers/notesController.js:54-67`, `ai-service/main.py:630-631`, `docker-compose.yml:116`, `render.yaml:63-66`

### Problem
When notes or academic documents are uploaded via Node.js (`POST /api/notes/upload`), the backend saves the file to its local disk (`path.resolve(req.file.path)`) and invokes the FastAPI service:
```javascript
await axios.post(`${PYTHON_AI_SERVICE_URL}/ai/rag/index`, {
  noteId: doc.id,
  filePath: absolutePath, // e.g. "/app/uploads/notes/file-17189.pdf"
  ...
});
```
FastAPI's `/ai/rag/index` handler verifies:
```python
if not os.path.exists(req.filePath):
    raise HTTPException(status_code=404, detail=f"File not found on server: {req.filePath}")
```
In Docker Compose and Render, Node.js and FastAPI run in **separate containers/services**. The Render configuration (`render.yaml`) attaches a persistent disk only to `oistcse-server` (`backend`), while `oistcseai` has no access to `/var/data`. In Docker Compose, the volume `backend_uploads` is mounted exclusively to `backend`, not `python-ai`.

### Why This Is a Problem
Because the containers do not share a filesystem volume, `os.path.exists(req.filePath)` in the AI service ALWAYS evaluates to `False`. All document indexing attempts fail with HTTP 404, causing `qdrantIndexed` to remain `false` and rendering Qdrant RAG ingestion completely non-functional in production.

### Evidence
- `backend/src/controllers/notesController.js` lines 54–67 passes local Node host path.
- `ai-service/main.py` lines 630–631 expects local disk path.
- `render.yaml` lines 63–66:
  ```yaml
  disk:
    name: oistcse-uploads
    mountPath: /var/data
  ```
  (Present under `oistcse-server`, absent under `oistcseai`).
- `docker-compose.yml` line 116 mounts `backend_uploads:/app/uploads` only in `backend`.

### Impact
Total failure of the document ingestion and RAG search pipeline across all multi-container production environments.

### Recommended Fix
1. Pass file content over HTTP (multipart/form-data or binary stream) directly to `/ai/rag/index`, or
2. Store documents in an object store (ImageKit, Cloudflare R2, AWS S3) and pass the public/signed HTTPS download URL to FastAPI.

### Priority
P0

---

## FLAW-005 — Multi-Active Timetable Corruption and Department-Agnostic Timetable Resolution

### Severity
CRITICAL

### Category
Database / Data Integrity & Business Logic

### Location
`ai-service/tools/postgres_tools.py:408-414`, `backend/src/controllers/timetableController.js:53-80`

### Problem
1. When the AI engine persists a generated timetable via `PostgresTools.save_timetable`, it issues:
   ```sql
   INSERT INTO timetable (id, department_id, section_id, semester, academic_year, version, status, ...)
   VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, 'ACTIVE', ...)
   ```
   It never marks previously existing timetables for that department/section as `'ARCHIVED'`. Consequently, multiple timetables have `status = 'ACTIVE'` concurrently.
2. In `timetableController.getTimetable`, the database query is:
   ```javascript
   let timetableRecord = await prisma.timetable.findFirst({
     where: {
       semester: parseInt(semester, 10) || 5,
       academicYear,
       ...(section ? { section: { name: section.toUpperCase() } } : {}),
       status: 'ACTIVE'
     },
     orderBy: { version: 'desc' }
   });
   ```
   **`departmentId` is omitted from the `where` filter.**

### Why This Is a Problem
If multiple departments (e.g., Computer Science, Mechanical Engineering, Civil Engineering) have a semester 5 section A active timetable, `findFirst` selects whichever department's timetable has the highest version number or was inserted last. CSE students view Mechanical Engineering timetables, and teacher conflict checks trigger false collisions.

### Evidence
- `ai-service/tools/postgres_tools.py` lines 408–414: Inserts `'ACTIVE'` without updating existing records.
- `backend/src/controllers/timetableController.js` lines 53–59: No `departmentId` constraint in query.

### Impact
Cross-department timetable bleeding, student schedule disruption, and false faculty collision alerts.

### Recommended Fix
1. In `postgres_tools.py`, wrap timetable creation in a transaction that updates prior matching records to `'ARCHIVED'` before inserting the new one.
2. In `timetableController.js`, extract `departmentId` from the authenticated user or query parameter and mandate it in the `where` clause.

### Priority
P0

---

## FLAW-006 — Hallucinated Groq Model Identifiers and Unsafe Model Failover

### Severity
CRITICAL

### Category
AI Systems / Runtime Failure & Hallucinated Configurations

### Location
`ai-service/llm/provider.py:13-15`, `ai-service/llm/provider.py:201-206`, `ai-service/.env.example:8-10`

### Problem
`ai-service/llm/provider.py` hardcodes the following default model identifiers:
```python
DEFAULT_REASONING_MODEL = "openai/gpt-oss-120b"
DEFAULT_VISION_MODEL = "qwen/qwen3.8-27b"
DEFAULT_FALLBACK_MODEL = "openai/gpt-oss-20b"
```
None of these model IDs exist on Groq Cloud. Groq supports models such as `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`, and `llama-3.2-11b-vision-preview`.
When startup verification runs in lines 201–206:
```python
candidates = [m for m in active_ids if "gpt-oss" in m or "qwen" in m]
self.reasoning_model = candidates[0] if candidates else next(iter(active_ids))
```
`next(iter(active_ids))` picks an arbitrary model from Groq's available models—which frequently resolves to `whisper-large-v3` (an audio-to-text transcription model).

### Why This Is a Problem
When `chat.completions.create` is invoked with `whisper-large-v3`, the Groq API throws a fatal 400 Bad Request (`whisper-large-v3 is not a chat model`), causing the entire AI agentic loop to fail immediately.

### Evidence
- `ai-service/llm/provider.py` lines 13–15 and 201–206.
- `ai-service/.env.example` line 8: `GROQ_REASONING_MODEL=openai/gpt-oss-120b`.

### Impact
Total AI agent shutdown or unpredictable crashes upon deployment when Groq API keys are configured.

### Recommended Fix
Update default models to verified Groq endpoints:
```python
DEFAULT_REASONING_MODEL = "llama-3.3-70b-versatile"
DEFAULT_VISION_MODEL = "llama-3.2-11b-vision-preview"
DEFAULT_FALLBACK_MODEL = "llama-3.1-8b-instant"
```
Filter `active_ids` to models supporting chat completions before fallback selection.

### Priority
P0

---

## FLAW-007 — Pseudorandom SHA-256 Hashing Implemented as "Semantic Dense Embeddings"

### Severity
CRITICAL

### Category
AI Systems / RAG Retrieval / Semantic Integrity

### Location
`ai-service/embeddings/provider.py:20-53`

### Problem
`LocalDenseEmbeddingProvider` claims in docstrings to generate "768-dimensional vectors with high semantic cosine alignment" without external APIs. In reality, it generates vectors by computing SHA-256 and SHA-512 hashes of individual string tokens and project offsets:
```python
for i, token in enumerate(tokens):
    token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
    for j in range(0, min(len(token_hash), 32), 2):
        idx = (int(token_hash[j:j+2], 16) * 3 + (i * 11)) % self.dimension
        val = (int(token_hash[j:j+2], 16) / 255.0) - 0.5
        vector[idx] += val
```

### Why This Is a Problem
Cryptographic hash functions (SHA-256) are explicitly engineered to exhibit the avalanche effect: changing a single character produces entirely uncorrelated bits. Synonyms (e.g., "teacher" vs "faculty", "regulations" vs "rules") have 0.0 cosine similarity. The resulting vectors are pure pseudorandom noise. Any RAG query relying on this fallback returns completely random or zero matching documents.

### Evidence
`ai-service/embeddings/provider.py` lines 20–53.

### Impact
Silent breakdown of semantic search, document retrieval, and contextual RAG whenever external embedding APIs (OpenAI/HuggingFace) are absent.

### Recommended Fix
Integrate a real local embedding model via `fastembed` or `sentence-transformers` (e.g., `sentence-transformers/all-MiniLM-L6-v2` or `BAAI/bge-small-en-v1.5`), which generates genuine dense vector embeddings locally without external API dependencies.

### Priority
P0

---

## FLAW-008 — Ephemeral Random JWT Secret in Development Invaliding Sessions on Nodemon Reload

### Severity
CRITICAL

### Category
Security & Developer Experience / Authentication Stability

### Location
`backend/src/config/env.js:17-19`

### Problem
When `JWT_SECRET` is unset in a local development `.env`, the startup validator executes:
```javascript
process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
console.warn('[SECURITY WARNING] JWT_SECRET is not set. Generated ephemeral random secret for development.');
```

### Why This Is a Problem
In development, `nodemon` watches for file changes and restarts the Node process. Every file save re-executes `crypto.randomBytes(32)`, invalidating all existing JWTs. Frontend developers and automated test scripts are logged out after every code modification.

### Evidence
`backend/src/config/env.js` lines 17–19.

### Impact
Erratic authentication drops, failed end-to-end testing cycles, and corrupted development sessions.

### Recommended Fix
In non-production environments, use a static deterministic fallback secret (e.g., `'dev_insecure_jwt_secret_campusflow_local_only'`) if unset, or refuse to start until the developer provides one in `.env`.

### Priority
P0

---

# High Severity Findings

## FLAW-009 — Permanent Vector Leakage in Qdrant Due to Missing Deletion Pipeline

### Severity
HIGH

### Category
Database / AI Vector Lifecycle & Privacy

### Location
`ai-service/rag/qdrant_manager.py:1-381`, `backend/src/controllers/notesController.js:125-130`

### Problem
`QdrantRAGManager` contains indexing and search routines (`index_document_chunks`, `search_documents`, `save_user_memory`), but **zero deletion methods**.
When a document or note is deleted in the ERP via `DELETE /api/notes/:id`:
```javascript
await prisma.documentMetadata.delete({ where: { id } });
return res.status(200).json({ success: true, message: 'Document deleted from PostgreSQL.' });
```
PostgreSQL removes the record, but Qdrant retains all associated vector chunks indefinitely.

### Why This Is a Problem
Deleted syllabi, confidential notes, exam guidelines, or user memories remain searchable by the AI agent and RAG engine forever, creating privacy violations, ghost knowledge, and compliance failures.

### Evidence
- `ai-service/rag/qdrant_manager.py`: No occurrence of client deletion operations (`client.delete`, `Filter`, etc.).
- `backend/src/controllers/notesController.js` lines 125–130: Does not dispatch any deletion webhook or HTTP request to the AI service.

### Impact
Orphaned vector accumulation, persistent leakage of deleted institutional data, and hallucinations based on obsolete documents.

### Recommended Fix
1. Add `delete_document_chunks(note_id)` to `QdrantRAGManager` using Qdrant point filters on `note_id`.
2. Expose `DELETE /ai/rag/document/{note_id}` in FastAPI.
3. In `notesController.deleteNote`, call this endpoint before or after removing the PostgreSQL record.

### Priority
P1

---

## FLAW-010 — Stateless 7-Day JWTs with No-Op Logout and Unvalidated Refresh Tokens

### Severity
HIGH

### Category
Security / Session Management & Revocation

### Location
`backend/src/controllers/authController.js:632-663`, `backend/src/controllers/authController.js:860-865`

### Problem
1. Tokens are issued with a 7-day expiration (`ACCESS_TOKEN_EXPIRY = '7d'`).
2. The `logout` controller is a complete no-op:
   ```javascript
   exports.logout = async (req, res) => {
     return res.status(200).json({ success: true, message: 'Successfully logged out.' });
   };
   ```
3. In `refreshToken`:
   ```javascript
   const decoded = jwt.verify(token, JWT_SECRET);
   ```
   Both access tokens and refresh tokens are signed with the same `JWT_SECRET`. An ordinary access token can be submitted to refresh itself indefinitely. Furthermore, the database `User` record's `refreshToken` field is never verified or compared.

### Why This Is a Problem
If a student or faculty member clicks "Logout" on a shared university library workstation, their JWT remains fully valid for up to 7 days. Anyone extracting the token from browser history or network logs retains uninterrupted access.

### Evidence
`backend/src/controllers/authController.js` lines 632–663 and 860–865.

### Impact
Session hijacking and inability to revoke compromised user credentials.

### Recommended Fix
1. Reduce access token lifespan to 15–30 minutes.
2. Sign refresh tokens with a distinct `JWT_REFRESH_SECRET` and persist a hashed refresh token in the database.
3. On logout, invalidate the refresh token in PostgreSQL and maintain a short-lived Redis/cache blocklist for revoked access tokens.

### Priority
P1

---

## FLAW-011 — Frontend-Backend API Route Mismatch on Leave Applications Causing 404 Failures

### Severity
HIGH

### Category
Frontend-Backend Integration / Broken User Flow

### Location
`frontend/src/api/leaveApi.js:42-49`, `backend/src/routes/leaveRoutes.js:1-26`, `backend/src/routes/requestRoutes.js:20-30`

### Problem
In `frontend/src/api/leaveApi.js`:
```javascript
applyLeave(data) {
  return apiClient.post('/leaves', data);
},
updateLeaveStatus(leaveId, status, rejectionReason = '') {
  return apiClient.put(`/leaves/${leaveId}/status`, { status, rejectionReason });
}
```
However, in `backend/src/routes/leaveRoutes.js`, **no such routes exist**. The backend routes for student and faculty leave submissions are mounted under `/api/requests`:
- `POST /api/requests/leave/student`
- `POST /api/requests/leave/teacher`
- `PUT /api/requests/leave/:id/tg-review`
- `PUT /api/requests/leave/:id/hod-approve`

### Why This Is a Problem
When any UI component invokes `leaveApi.applyLeave` or `leaveApi.updateLeaveStatus`, the backend responds with HTTP 404 Not Found.

### Evidence
- `frontend/src/api/leaveApi.js` lines 42–49.
- `backend/src/routes/leaveRoutes.js` lines 1–26 (only defines `/today`, `/availability`, `/teachers/:id/toggle`, `/apply-substitute`).

### Impact
Users cannot submit or approve leave requests when calling the standard leave API client.

### Recommended Fix
Refactor `frontend/src/api/leaveApi.js` to target the canonical endpoints in `/requests/leave/...` or alias those routes in `leaveRoutes.js`.

### Priority
P1

---

## FLAW-012 — Teacher Leave Approval Bypasses Daily Substitution and Faculty Notification

### Severity
HIGH

### Category
Business Logic / Workflow Automation

### Location
`backend/src/controllers/requestController.js:1346-1390`

### Problem
When an HOD approves a leave application via `hodApproveLeave`:
1. It updates `leaveApplication.status = 'APPROVED'`.
2. It sends a notification only to students:
   ```javascript
   if (updated.student?.userId) {
     await sendNotification({ userId: updated.student.userId, ... });
   }
   ```
3. If `applicantType === 'TEACHER'`, `updated.student` is null; the teacher receives zero notification.
4. More critically, **no substitutions (`DailySubstitution`) are created or scheduled**.

### Why This Is a Problem
While quick leave toggles in `leaveController.js` attempt to identify affected classes, formal leave applications approved by the HOD leave all scheduled lecture slots for that teacher completely unassigned in the timetable.

### Evidence
`backend/src/controllers/requestController.js` lines 1346–1390.

### Impact
Classes of faculty on approved leave remain unstaffed without automated substitution triggering.

### Recommended Fix
Inside `hodApproveLeave`, check if `applicantType === 'TEACHER'`. If true:
1. Notify the teacher user account.
2. Query all `timetableSlot` records for the leave period.
3. Call `timetableAiEngine.proposeSubstitutes` or flag the slots as requiring immediate substitute assignment.

### Priority
P1

---

## FLAW-013 — Absence of Timetable Status Filtering in Conflict and Substitution Analyzers

### Severity
HIGH

### Category
Business Logic / Stale Data Interference

### Location
`backend/src/controllers/leaveController.js:306-324`, `backend/src/services/timetableAiEngine.js:120-150`

### Problem
When `proposeSubstitutes` or `timetableAiEngine.analyzeConstraints` calculates faculty busy slots, it executes:
```javascript
const allDaySlots = await prisma.timetableSlot.findMany({
  where: { dayOfWeek: dayName }
});
```
It does not filter by `timetable: { status: 'ACTIVE' }`.

### Why This Is a Problem
As historical timetables are updated and archived, `timetableSlot` records from versions 1, 2, and 3 remain in the database. A faculty member who taught period 2 in version 1 but is free in the active version 3 is considered "busy" forever, preventing them from being suggested as a substitute.

### Evidence
`backend/src/controllers/leaveController.js` lines 322–324.

### Impact
AI substitute suggestion algorithm produces false-negative conflicts and fails to find available faculty.

### Recommended Fix
Always join and filter by the active timetable status:
```javascript
where: {
  dayOfWeek: dayName,
  timetable: { status: 'ACTIVE' }
}
```

### Priority
P1

---

## FLAW-014 — Single-Process In-Memory Caching for OTP and Auth Sessions Breaking Clustered Runtimes

### Severity
HIGH

### Category
Scalability & Concurrency / Distributed State

### Location
`backend/src/controllers/authController.js:17-25`, `backend/src/middleware/auth.js:18-35`

### Problem
Password reset OTPs and user role caches are stored in Node process memory:
```javascript
const otpStore = new Map();
const userCache = new Map();
```

### Why This Is a Problem
In any multi-instance, clustered (PM2, Kubernetes), or serverless deployment, requests from the same user land on different processes. An OTP generated on Worker A does not exist on Worker B, causing `verify-otp` to fail with "OTP expired or invalid".

### Evidence
- `backend/src/controllers/authController.js` line 17: `const otpStore = new Map();`
- `backend/src/middleware/auth.js` line 18: `const userCache = new Map();`

### Impact
Intermittent authentication and password reset failures in production clusters.

### Recommended Fix
Migrate `otpStore` and `userCache` to an external shared Redis instance with native TTL expiration.

### Priority
P1

---

## FLAW-015 — Parallel Tool Execution Truncation in ReAct Agent Loop

### Severity
HIGH

### Category
AI Systems / Multi-Tool Execution Failure

### Location
`ai-service/agents/react_agent_loop.py:257-265`

### Problem
When the LLM generates multiple tool calls in a single turn (e.g., fetching a student's profile and checking their attendance simultaneously), the ReAct agent loop explicitly aborts all tools after the first one:
```python
if index > 0:
    tool_result = {
        "success": False,
        "error": "REPLAN_AFTER_OBSERVATION",
        "message": "Only the first tool call was dispatched."
    }
```

### Why This Is a Problem
Modern frontier models (like Llama 3.3) naturally emit parallel tool calls for independent queries. Feeding synthetic failure errors (`REPLAN_AFTER_OBSERVATION`) back to the model confuses the reasoning chain and frequently triggers unexpected apologetic responses or repetitive planning loops.

### Evidence
`ai-service/agents/react_agent_loop.py` lines 257–265.

### Impact
Degraded AI agent task efficiency, increased latency, and token waste due to avoidable replanning cycles.

### Recommended Fix
Support sequential execution of all independent read-only tool calls within the same iteration before sending the bundled tool observations back to the LLM.

### Priority
P1

---

# Medium Severity Findings

## FLAW-016 — Dual-ORM Redundancy (Prisma and Sequelize Both Installed)

### Severity
MEDIUM

### Category
Architecture / Dependency Bloat & Maintenance Debt

### Location
`backend/package.json:35, 37`

### Problem
`backend/package.json` installs both `@prisma/client` (`^5.14.0`) and `sequelize` (`^6.37.7`). While the application has transitioned to Prisma, legacy Sequelize artifacts and connection files still exist in the repository.

### Why This Is a Problem
Inflates container image size, introduces dependency vulnerabilities, and creates developer confusion regarding the source of truth for database migrations.

### Evidence
`backend/package.json` dependencies list.

### Impact
Increased build times, enlarged attack surface, and architectural inconsistency.

### Recommended Fix
Remove `sequelize` from `backend/package.json` and purge legacy Sequelize configuration files.

### Priority
P2

---

## FLAW-017 — Cascading Failure Risk from MongoDB Dependency

### Severity
MEDIUM

### Category
Architecture & Fault Tolerance

### Location
`backend/src/server.js:141-144`, `ai-service/main.py:120-135`

### Problem
PostgreSQL is the authoritative primary store for ERP relational data. MongoDB is intended solely for AI chat history and memory. However, server startup scripts tightly couple MongoDB connection health to the core application lifecycle.

### Why This Is a Problem
If MongoDB encounters downtime or network latency, the primary ERP REST API fails to start or crashes, preventing administrative staff and teachers from accessing classes, attendance, and timetables.

### Evidence
`backend/src/server.js` startup sequence exits if MongoDB is unreachable unless explicitly caught.

### Impact
Unnecessary ERP downtime caused by non-critical chat storage outages.

### Recommended Fix
Decouple MongoDB initialization: allow the backend to operate in degraded mode (disabling AI chat while maintaining full ERP CRUD operations) if MongoDB is temporarily unavailable.

### Priority
P2

---

## FLAW-018 — ID Type Inconsistency Across Microservices (UUID vs ObjectId vs Strings)

### Severity
MEDIUM

### Category
Database / Cross-System Consistency

### Location
`backend/src/models/postgres/schema.prisma`, `ai-service/memory/mongo_memory.py`

### Problem
PostgreSQL uses UUID v4 strings for all primary keys (`id String @id @default(uuid())`). MongoDB uses 24-character hex `ObjectId` strings. AI service agents frequently pass IDs without schema distinction, occasionally querying PostgreSQL using Mongo IDs or vice versa.

### Why This Is a Problem
Prisma queries crash with format errors when passed non-UUID strings in foreign key lookup parameters.

### Evidence
Mismatched ID types between MongoDB message documents and PostgreSQL user IDs.

### Impact
Intermittent 500 Internal Server Errors in agent tools querying PostgreSQL from Mongo conversation contexts.

### Recommended Fix
Establish a universal ID convention: strictly use PostgreSQL UUIDs as foreign reference keys across MongoDB and Qdrant payloads.

### Priority
P2

---

## FLAW-019 — Missing Transaction Boundaries in Attendance Session and Record Creation

### Severity
MEDIUM

### Category
Database / Concurrency & Atomicity

### Location
`backend/src/controllers/attendanceController.js:25-95`

### Problem
Attendance marking creates an `Attendance` header record, followed by iterating over student rows to create `AttendanceRecord` entries. These operations are executed without wrapping them in a Prisma `$transaction`.

### Why This Is a Problem
If an error occurs mid-loop (e.g., network timeout or invalid student ID), an orphaned attendance header is left in the database with partial or zero student attendance records.

### Evidence
`backend/src/controllers/attendanceController.js` lines 25–95.

### Impact
Corrupted attendance percentages and desynchronized class attendance rosters.

### Recommended Fix
Wrap the creation of `Attendance` and all corresponding `AttendanceRecord` rows in `prisma.$transaction`.

### Priority
P2

---

## FLAW-020 — Hardcoded Public DNS Server Overrides in Database Connectors

### Severity
MEDIUM

### Category
Network / Portability & Enterprise Compatibility

### Location
`backend/src/config/postgres.js:11`, `backend/src/config/mongo.js:11`

### Problem
Database connection utilities configure hardcoded DNS server overrides (`dns.setServers(['8.8.8.8', '1.1.1.1'])`).

### Why This Is a Problem
In enterprise, campus intranet, or firewalled VPC environments where external DNS ports (53/853) are blocked, the application fails to resolve local database hostnames (such as `postgres` or `mongodb` Docker service names).

### Evidence
`backend/src/config/postgres.js` line 11.

### Impact
Connection timeouts when deployed inside private corporate or university VPCs.

### Recommended Fix
Remove programmatic DNS overrides and inherit system DNS resolution from the operating environment or Docker daemon.

### Priority
P2

---

## FLAW-021 — Complete Absence of Automated Test Suites

### Severity
MEDIUM

### Category
Testing / Reliability & Quality Assurance

### Location
Root, `backend/`, `ai-service/`, `frontend/`

### Problem
There are no automated unit, integration, or regression test suites (no Jest, Vitest, Supertest, or Pytest configurations). Only a single ad-hoc script `test-e2e-verification.js` exists in the root directory.

### Why This Is a Problem
Regressions, broken API contracts, and security flaws cannot be detected automatically in CI/CD pipelines.

### Evidence
Absence of test scripts in `package.json` files.

### Impact
High risk of regressions during code updates and refactoring.

### Recommended Fix
Introduce a Jest/Supertest suite for the Node.js backend and a Pytest suite for the FastAPI AI service, integrated into GitHub Actions.

### Priority
P2

---

## FLAW-022 — Unbounded In-Memory Token Telemetry in LLM Provider

### Severity
MEDIUM

### Category
Performance / Memory Management

### Location
`ai-service/llm/provider.py:163-167, 340-350`

### Problem
`LLMProvider` tracks token telemetry using cumulative in-memory counters without periodic flushing or rotation:
```python
self.cumulative_prompt_tokens = 0
self.cumulative_completion_tokens = 0
self.cumulative_total_tokens = 0
```

### Why This Is a Problem
In long-running Uvicorn worker processes handling thousands of student queries, unbounded state tracking without external aggregation risks memory accumulation and limits observability.

### Evidence
`ai-service/llm/provider.py` lines 163–167.

### Impact
Loss of operational telemetry across worker restarts; potential worker process memory growth.

### Recommended Fix
Export telemetry to a time-series monitor (Prometheus, Datadog) or persist aggregations in PostgreSQL.

### Priority
P2

---

# Low Severity Findings

## FLAW-023 — Abandoned Pinecone Vector Configurations in Docker Compose and Environment Files

### Severity
LOW

### Category
Configuration / Technical Debt

### Location
`docker-compose.yml:66-69`, `ai-service/.env.example:18-22`

### Problem
`docker-compose.yml` and `.env.example` retain environment variables for Pinecone (`PINECONE_API_KEY`, `PINECONE_INDEX_NAME`), even though the codebase has standardized on Qdrant.

### Why This Is a Problem
Confuses deployment operators into believing a Pinecone subscription is required.

### Evidence
`docker-compose.yml` lines 66–69.

### Impact
Deployment friction and configuration clutter.

### Recommended Fix
Remove all Pinecone references from Docker and environment templates.

### Priority
P3

---

## FLAW-024 — Empty Wrapper Component AdminAcademicStructure

### Severity
LOW

### Category
Frontend / Dead Code

### Location
`frontend/src/pages/admin/AdminAcademicStructure.jsx:1-4`

### Problem
`AdminAcademicStructure.jsx` is an 85-byte file that merely re-exports `AdminDepartments`:
```javascript
import AdminDepartments from './AdminDepartments';
export default AdminDepartments;
```

### Why This Is a Problem
Creates redundant routing indirection and dead code in the frontend bundle.

### Evidence
`frontend/src/pages/admin/AdminAcademicStructure.jsx`.

### Impact
Minor code clutter.

### Recommended Fix
Update route definitions to point directly to `AdminDepartments` and delete `AdminAcademicStructure.jsx`.

### Priority
P3

---

## FLAW-025 — Inconsistent Error Response Payload Shapes Across Microservices

### Severity
LOW

### Category
API Contract Consistency

### Location
`backend/src/middleware/errorHandler.js`, `ai-service/main.py`

### Problem
Node.js endpoints return errors shaped as `{ success: false, message: "..." }`, while FastAPI endpoints return FastAPI default errors shaped as `{ "detail": "..." }`.

### Why This Is a Problem
Frontend API error handlers must write dual-condition checks (`error.response?.data?.message || error.response?.data?.detail`) to extract error messages.

### Evidence
Comparison between Express error handling middleware and FastAPI HTTPException defaults.

### Impact
Inconsistent frontend toast notifications and error handling boilerplate.

### Recommended Fix
Standardize FastAPI exception handlers to return `{ success: false, message: str(detail) }`.

### Priority
P3

---

## FLAW-026 — Absence of Strict Rate Limiting on Authentication Endpoints

### Severity
LOW

### Category
Security / Denial of Service & Brute Force

### Location
`backend/src/routes/authRoutes.js`

### Problem
Endpoints such as `POST /api/auth/login`, `POST /api/auth/register`, and `POST /api/auth/forgot-password` do not enforce rate limiting (via `express-rate-limit`).

### Why This Is a Problem
Allows brute-force password guessing and automated credential stuffing.

### Evidence
`backend/src/routes/authRoutes.js` lacks rate limiter middleware.

### Impact
Vulnerability to brute-force credential discovery and SMS/Email OTP flooding.

### Recommended Fix
Apply `express-rate-limit` (e.g., maximum 5 login attempts per minute per IP).

### Priority
P3

---

# Architecture Problems

```text
Current State:
Frontend (React/Vite) 
  ↓ (HTTP / REST)
Node.js Express Backend
  ├── PostgreSQL (Relational ERP Data via Prisma)
  ├── MongoDB (Chat Memory via Mongoose)
  └── Local File System (/app/uploads)
        ↕ (Broken Shared Disk Assumption)
FastAPI Python Microservice
  ├── Qdrant Vector Store
  └── Groq Cloud LLM
```

### Key Architectural Deficiencies

1. **Broken Inter-Container File Transport:**
   The backend assumes that saving a file to local disk allows the AI microservice to read it by passing an absolute path string. In containerized environments (Docker Compose, Render, AWS ECS), containers have isolated filesystems. This creates a hard breakpoint in the RAG pipeline.

2. **Dual-Database Ambiguity:**
   PostgreSQL holds user records and roles, while MongoDB holds conversation sessions. However, user IDs are inconsistently mapped across the boundary. If a user is deleted from PostgreSQL, their conversation records in MongoDB and vector embeddings in Qdrant remain permanently orphaned.

3. **In-Memory Clustering Failure:**
   Crucial operational states (password reset OTPs, authorization caches) reside in Node process memory (`Map`). This prevents horizontal scaling behind load balancers.

---

# Database Problems

1. **Absence of Department Scoping on Queries:**
   Crucial queries in `timetableController.js` and `leaveController.js` fail to filter by `departmentId`. In multi-department college deployments, data leaks between departments.
2. **Missing Archive State Machine:**
   Timetable updates do not archive older versions within an atomic database transaction. Multiple timetables retain `status = 'ACTIVE'`, creating data ambiguity.
3. **Missing Delete Cascades in Vector DB:**
   When relational records (Notes, Policies) are deleted in PostgreSQL, no cascading deletion hooks trigger against Qdrant.
4. **Missing Concurrency Controls:**
   Attendance marking and timetable slot modifications lack optimistic locking or row-level locking, exposing the system to race conditions during simultaneous writes.

---

# Authentication & Authorization Problems

1. **Privilege Escalation on Registration:**
   Faculty can request `isTG: true` during registration, which binds their `User.roleId` to Tutor Guardian upon next login.
2. **Unauthenticated PII Access:**
   Student and faculty directories, exports, and imports are exposed via `optionalAuth` or missing middleware.
3. **IDOR on Student Attendance:**
   `GET /api/attendance/stats/:studentId` permits any logged-in student to query any peer's attendance statistics.
4. **No-Op Logout:**
   Stateless JWTs are valid for 7 days with no server-side invalidation mechanism on logout.

---

# Backend Problems

1. **Business Logic in Controllers:**
   Complex business logic (such as substitution matching and schedule conflict calculation) is embedded directly within controllers rather than dedicated service layers.
2. **Missing Input Validation:**
   Endpoints rely on manual checking rather than schema validation libraries (such as `zod` or `joi`), allowing malformed payloads to produce unhandled exceptions.
3. **Ephemeral Development Secrets:**
   Auto-generating random JWT secrets on server reload breaks active developer sessions on every code edit.

---

# Frontend Problems

1. **API Endpoint Route Discrepancies:**
   `leaveApi.js` targets non-existent backend endpoints (`/leaves`), causing HTTP 404 errors during leave application workflows.
2. **Dual State Management:**
   Application state is divided between React Context (`ERPContext.jsx`) and direct component-level Axios queries, leading to stale UI representations following mutations.
3. **Dead Re-Export Components:**
   Components like `AdminAcademicStructure.jsx` exist purely as redundant re-exports.

---

# AI Agent Problems

1. **Hallucinated Default LLM Models:**
   Configuring non-existent models (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`) forces the system into unpredictable fallback paths that can select audio transcription models (`whisper-large-v3`).
2. **Non-Semantic Embedding Fallback:**
   Simulating embeddings using SHA-256 hashes completely destroys semantic cosine similarity.
3. **Parallel Tool Execution Rejection:**
   The ReAct loop artificially rejects all parallel tool calls after the first, causing token waste and replanning churn.

---

# Memory / RAG Problems

1. **Missing Vector Deletion Operations:**
   Qdrant manager lacks deletion logic, leaving deleted documents permanently accessible in RAG memory.
2. **Local Path Ingestion Failure:**
   RAG ingestion expects local disk access, breaking across container boundaries.
3. **Unbounded Short-Term Memory:**
   Session histories stored in MongoDB lack automatic truncation or summarization, risking context window exhaustion during long conversations.

---

# File Understanding Problems

1. **Single-Node Storage Dependency:**
   Uploaded documents are stored on local container disk rather than centralized cloud object storage.
2. **Missing OCR for Scanned Documents:**
   The document processor extracts text using standard string decoders; scanned image-only PDFs yield empty text and fail ingestion.

---

# Timetable Problems

1. **Concurrent Active Timetables:**
   Generating a new timetable does not archive previous versions, causing multiple schedules to remain active simultaneously.
2. **Stale Timetable Slot Collisions:**
   Conflict analysis queries slots across all historical timetables rather than filtering strictly by `status = 'ACTIVE'`.
3. **Missing Department Scoping:**
   Timetable fetching queries omit department constraints, allowing students in one department to receive schedules from another.

---

# Attendance Problems

1. **Broken Object Level Authorization (IDOR):**
   Students can view attendance records of any peer via `:studentId`.
2. **Non-Transactional Bulk Attendance:**
   Attendance sessions and records are inserted without atomic transactions, risking partial writes.

---

# Leave Problems

1. **Missing Substitution Pipeline on Teacher Leave:**
   HOD leave approvals for teachers do not trigger substitution proposals or assign replacement faculty.
2. **Frontend-Backend API Mismatch:**
   Frontend submits leave applications to `/leaves`, which does not exist on the backend.

---

# Security Problems

1. **Public Student/Faculty Export and Import:**
   Anyone can export or import the entire student body without authentication.
2. **Privilege Escalation:**
   Self-assigned Tutor Guardian roles via faculty registration.
3. **Stateless 7-Day JWTs:**
   No logout invalidation or token revocation mechanism.

---

# Deployment Problems

1. **Unshared Render Disk:**
   Persistent disk mounted on backend is inaccessible to the AI service, breaking RAG indexing.
2. **Obsolete Configuration Remnants:**
   Pinecone environment variables remain in `docker-compose.yml` despite switching to Qdrant.

---

# Performance Problems

1. **N+1 Database Queries:**
   Faculty availability calculations loop over individual teacher records rather than executing grouped SQL aggregations.
2. **Unbounded In-Memory Token Tracking:**
   Cumulative token counters in Python AI service grow continuously over worker lifetimes.

---

# Testing Gaps

1. **Zero Test Frameworks:**
   No unit or integration tests configured across any service.
2. **Lack of Automated CI/CD Testing:**
   Pull requests and deployments are not validated against regression test suites.

---

# Technical Debt

1. **Dual ORM Installations:**
   Both Prisma and Sequelize installed simultaneously in `backend/package.json`.
2. **In-Memory Caches:**
   In-memory `Map` instances used for state in multi-process systems.

---

# Dead Code / Duplicate Code

1. **Sequelize Artifacts:**
   Legacy Sequelize configuration files remain in `backend/src/config/`.
2. **Empty Wrapper Components:**
   `AdminAcademicStructure.jsx` is a redundant 4-line re-export.

---

# Source-of-Truth Conflicts

| Entity | Primary Store | Conflicting Store | Consequence |
|---|---|---|---|
| **User Identity** | PostgreSQL (`User`) | MongoDB (`Conversation.userId`) | Deleted PostgreSQL users leave orphaned conversations in Mongo. |
| **Active Timetable**| PostgreSQL (`Timetable`) | PostgreSQL (Multiple `ACTIVE` rows) | Queries return arbitrary timetable versions due to missing archiving. |
| **Institutional Knowledge** | PostgreSQL (`DocumentMetadata`) | Qdrant (`erp_documents`) | Deleted PostgreSQL documents remain permanently searchable in Qdrant. |

---

# Recommended Target Architecture

```text
                               ┌─────────────────────────────────┐
                               │       React / Vite Frontend      │
                               └────────────────┬────────────────┘
                                                │ (HTTPS / Bearer JWT)
                                                ▼
                               ┌─────────────────────────────────┐
                               │      Node.js / Express API      │
                               │   (Authentication, RBAC, ERP)   │
                               └───┬─────────────┬─────────────┬─┘
                                   │             │             │
                ┌──────────────────┘             │             └──────────────────┐
                ▼                                ▼                                ▼
  ┌───────────────────────────┐    ┌───────────────────────────┐    ┌───────────────────────────┐
  │   PostgreSQL (via Prisma) │    │  Central Object Storage   │    │    Redis (Distributed)    │
  │   - Authoritative ERP Data│    │   (Cloudflare R2 / S3)    │    │  - Session Blocklist      │
  │   - Single Source of Truth│    │  - Uploaded Documents     │    │  - Rate Limiting & OTPs   │
  └───────────────────────────┘    └─────────────┬─────────────┘    └───────────────────────────┘
                                                 │
                                                 ▼ (Public/Presigned HTTPS URL)
                                   ┌───────────────────────────┐
                                   │    FastAPI AI Microservice│
                                   │    - ReAct Agent Loop     │
                                   │    - Local Dense Embeddings│
                                   └───┬───────────────────┬───┘
                                       │                   │
                     ┌─────────────────┘                   └─────────────────┐
                     ▼                                                       ▼
       ┌───────────────────────────┐                           ┌───────────────────────────┐
       │   Qdrant Vector Engine    │                           │    Groq Cloud LLM API     │
       │  - Full Vector Lifecycle  │                           │   (Llama 3.3 70B & Vision)│
       │  - Cascading Deletions    │                           └───────────────────────────┘
       └───────────────────────────┘
```

---

# Recommended Fix Order

## Phase 1 — Critical (Security & Production Blockers)
1. **Fix FLAW-001:** Enforce `'TEACHER'` role unconditionally in faculty registration and derive `isTG` strictly from database profile flags.
2. **Fix FLAW-002:** Enforce `verifyToken` and `checkRole` on student/faculty directories, exports, and imports.
3. **Fix FLAW-003:** Enforce IDOR protection on `GET /api/attendance/stats/:studentId` to restrict students to their own ID.
4. **Fix FLAW-004:** Refactor file ingestion to transfer files via HTTP multipart streams or object storage URLs rather than local paths.
5. **Fix FLAW-005:** Scope all timetable queries by `departmentId` and archive prior timetables atomically upon new insertions.
6. **Fix FLAW-006:** Update Groq model defaults to real endpoints (`llama-3.3-70b-versatile`, `llama-3.2-11b-vision-preview`).
7. **Fix FLAW-007:** Replace SHA-256 hash embedding fallback with a real local embedding model (`fastembed` or `sentence-transformers`).
8. **Fix FLAW-008:** Use a static fallback secret in development to avoid token invalidation on nodemon reload.

## Phase 2 — High (Data Integrity & Workflows)
1. **Fix FLAW-009:** Implement cascading vector deletion in `QdrantRAGManager` and invoke it from `notesController.deleteNote`.
2. **Fix FLAW-010:** Implement short-lived access tokens, refresh token rotation, and token invalidation on logout.
3. **Fix FLAW-011:** Align `frontend/src/api/leaveApi.js` endpoints with backend `/requests/leave/...` routes.
4. **Fix FLAW-012:** Implement automated substitution triggering and faculty notifications when HOD approves teacher leave.
5. **Fix FLAW-013:** Filter timetable slots by `timetable: { status: 'ACTIVE' }` in substitution and conflict engines.
6. **Fix FLAW-014:** Migrate in-memory OTP and session stores to Redis.
7. **Fix FLAW-015:** Enable sequential multi-tool dispatch in ReAct agent loop.

## Phase 3 — Medium (Architecture & Quality)
1. **Fix FLAW-016 & FLAW-025:** Remove Sequelize dependencies and purge legacy configuration files.
2. **Fix FLAW-017:** Decouple MongoDB startup so relational ERP operations remain functional during chat store outages.
3. **Fix FLAW-018:** Standardize ID formats across microservices on UUID v4.
4. **Fix FLAW-019:** Wrap attendance session and record writes in atomic database transactions.
5. **Fix FLAW-020:** Remove hardcoded DNS server overrides from database connection scripts.
6. **Fix FLAW-021:** Set up automated test suites (Jest/Supertest for backend, Pytest for AI service).
7. **Fix FLAW-022:** Integrate Prometheus or database persistence for AI token telemetry.

## Phase 4 — Cleanup (Technical Debt & Polishing)
1. **Fix FLAW-023:** Remove unused Pinecone configurations from Docker and environment templates.
2. **Fix FLAW-024:** Delete dead wrapper component `AdminAcademicStructure.jsx`.
3. **Fix FLAW-025:** Standardize error response payloads across Express and FastAPI.
4. **Fix FLAW-026:** Implement rate limiting on authentication routes.

---

# Final Assessment

CampusFlow displays significant architectural ambition with extensive feature coverage. However, its current state is undermined by critical security vulnerabilities, broken cross-container communication in the RAG pipeline, hallucinated AI model configurations, and non-semantic embedding fallbacks. 

Executing the remediation plan outlined above—beginning with the **Phase 1 Critical** security and deployment fixes—will stabilize the system into an enterprise-grade, reliable, and secure college ERP platform.

# Comprehensive System Audit: Bugs, Flaws, and Vulnerabilities
**System:** CampusFlow — College Departmental Agentic ERP  
**Audit Date:** October 2026  
**Audited Scope:** Backend (Node.js/Express/Prisma), AI Microservice (FastAPI/Python), Frontend (React/Vite), Database Schemas (PostgreSQL & MongoDB)

---

## Executive Summary & Severity Matrix

An extensive architectural and code-level audit was conducted across the entire CampusFlow ERP system. While the application possesses a rich feature set—including automated timetable generation, dynamic substitution algorithms, multi-role dashboards, and LLM agent orchestration—the audit revealed several **critical security vulnerabilities**, **destructive business logic errors**, and **architectural bottlenecks** that could lead to account takeover, schedule corruption, and service disruption if deployed to production without remediation.

### Summary Matrix

| ID | Flaw / Issue Description | Category | Severity | File Location | Impact |
|---|---|---|---|---|---|
| **SEC-01** | Plaintext OTP Returned in API Response Body | Security | **CRITICAL** | `backend/src/controllers/authController.js:683` | Instant Account Takeover for any user |
| **SEC-02** | Unauthenticated Role Spoofing & Tool Execution via AI Chat | Security | **CRITICAL** | `backend/src/controllers/aiController.js:21-23` | Unauthenticated callers execute admin ERP actions |
| **SEC-03** | Public Exposure of Google Sheet Sync Config & Webhook | Security | **HIGH** | `backend/src/services/googleSheetSyncService.js:11` | Exposure of private Google Sheets and script webhooks |
| **SEC-04** | Unauthenticated Faculty Leave Toggle & Substitution Route | Security | **HIGH** | `backend/src/routes/leaveRoutes.js:17-23` | Public manipulation of faculty availability |
| **SEC-05** | QR Attendance IDOR / Spoofing Vulnerability | Security | **HIGH** | `backend/src/controllers/attendanceController.js:421-435` | Marking attendance for arbitrary student IDs |
| **SEC-06** | Self-Appointment as Tutor Guardian (TG) on Registration | Security | **MEDIUM** | `backend/src/controllers/authController.js:395, 431` | Unauthorized role elevation |
| **SEC-07** | Hardcoded Cryptographic & Registration Secrets | Security | **HIGH** | `backend/src/middleware/auth.js:11`, `authController.js:518` | Arbitrary token forging if `.env` omitted |
| **SEC-08** | Reflected CORS Origin with Credentials | Security | **MEDIUM** | `backend/src/server.js:46` | CSRF / cross-origin data leakage |
| **SEC-09** | Unprotected Internal Endpoints for File Processing | Security | **MEDIUM** | `backend/src/routes/fileRoutes.js:20, 26` | Unauthorized injection of file statuses |
| **LOGIC-01**| Permanent Timetable Slot Overwrite on Daily Substitution | Business Logic | **CRITICAL** | `backend/src/controllers/leaveController.js:381-384` | Substitute permanently replaces teacher for whole semester |
| **LOGIC-02**| Blind Round-Robin Faculty Substitution (Collisions) | Business Logic | **HIGH** | `backend/src/controllers/teacherSchedulerController.js:70-81` | Assigns busy/absent teachers as substitutes |
| **LOGIC-03**| Timetable Conflicts Triggered by Archived Versions | Business Logic | **HIGH** | `backend/src/controllers/timetableController.js:122, 158` | Historical versions generate false collision warnings |
| **LOGIC-04**| Loss of Selected Periods in Consideration Requests | Data Loss | **MEDIUM** | `backend/src/controllers/requestController.js:326-336` | Period count/timings discarded on database write |
| **LOGIC-05**| Desynchronized Attendance Session Counters on Overrides | Data Integrity | **MEDIUM** | `backend/src/controllers/attendanceController.js:346-372` | Parent counts disagree with child attendance records |
| **LOGIC-06**| Hard Deletion of Leave Applications Breaking Audit Trail | Data Loss | **MEDIUM** | `backend/src/controllers/leaveController.js:164` | Historical leave and audit logs permanently destroyed |
| **LOGIC-07**| Race Condition in Attendance Session Creation | Concurrency | **MEDIUM** | `backend/src/controllers/attendanceController.js:15-38` | Duplicate attendance sessions on simultaneous calls |
| **ARCH-01** | Fatal Server Crash on Optional MongoDB Connection Failure | Architecture | **HIGH** | `backend/src/server.js:141-144` | Core PostgreSQL ERP goes down if chat DB fails |
| **ARCH-02** | Local Filesystem Path Shared Across Microservices | Architecture | **MEDIUM** | `backend/src/controllers/fileController.js:110` | Fails when backend and AI run on separate containers |
| **ARCH-03** | In-Memory Stateful OTP and Session Caching | Scalability | **MEDIUM** | `backend/src/controllers/authController.js:17` | Fails across multiple server instances / PM2 |
| **ARCH-04** | Hardcoded DNS Server Overrides | Network | **LOW** | `backend/src/config/postgres.js:11`, `mongo.js:11` | Fails in campus/corporate firewalled environments |
| **ARCH-05** | Dual-ORM Dependency Redundancy (Prisma + Sequelize) | Maintenance | **LOW** | `backend/package.json:35, 37` | Unnecessary dependency bloat and confusion |
| **FE-01**   | Google Sheet Endpoint 403 Forbidden for Teachers & TGs | Frontend / API | **HIGH** | `backend/src/routes/requestRoutes.js:36` | Faculty cannot access live sheet despite UI button |
| **FE-02**   | Stale LocalStorage User Cache on Role Revocation | Frontend | **LOW** | `frontend/src/context/ERPContext.jsx:22-38` | User retains previous role permissions in UI |

---

## Detailed Findings

---

### Category 1: Critical Security Vulnerabilities & Authorization Flaws

#### SEC-01: Plaintext OTP Returned in API Response Body
- **Location:** [`backend/src/controllers/authController.js:680-685`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/controllers/authController.js#L680-L685)
- **Code:**
  ```javascript
  return res.status(200).json({
    success: true,
    message: `One-Time Password (OTP) has been dispatched to ${cleanEmail}.`,
    otp // Included for seamless automated/manual testing
  });
  ```
- **Vulnerability:** Any unauthenticated attacker who knows an email address (such as `hod.cse@college.edu` or `admin@college.edu`) can issue a `POST /api/auth/forgot-password` request, extract the 6-digit OTP directly from the HTTP response, and immediately call `POST /api/auth/verify-otp` with a new password.
- **Impact:** Complete, trivial account takeover of all students, faculty, HODs, and administrators without accessing their email.
- **Recommended Remediation:**
  1. Remove `otp` completely from the JSON response.
  2. In development or test environments, restrict OTP exposure to server terminal logs or gated behind `NODE_ENV === 'test'`.
  3. Enforce rate limiting (e.g., maximum 3 requests per 15 minutes per IP/email).

---

#### SEC-02: Unauthenticated Role Spoofing & Tool Execution via AI Chat
- **Location:** [`backend/src/controllers/aiController.js:21-23, 40-44`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/controllers/aiController.js#L21-L44) and [`backend/src/routes/aiRoutes.js:7-10`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/routes/aiRoutes.js#L7-L10)
- **Code:**
  ```javascript
  const userId = req.user ? String(req.user.id) : (req.body.user_id || 'guest_user');
  const userRole = req.user ? req.user.role : (req.body.role || 'hod');
  ...
  directAction = await executeAgentActionByIntent(
    promptText,
    req.user || { id: userId, role: userRole },
    req.body.confirmed_action || req.body.confirmedAction
  );
  ```
- **Vulnerability:** The route `POST /api/ai/chat` uses `optionalAuth`. When unauthenticated, the controller falls back to reading `req.body.role`, and if absent, **defaults to `'hod'`**! The controller then feeds this synthetic identity directly into `executeAgentActionByIntent`.
- **Impact:** An unauthenticated user can call the AI chat endpoint with `{ "prompt": "delete teacher ...", "role": "admin" }` or invoke any ERP action tool (`erpAgentTools.js`), bypassing standard route-level RBAC.
- **Recommended Remediation:**
  1. Replace `optionalAuth` with `verifyToken` on all chat and action endpoints.
  2. Never trust `req.body.role` or `req.body.user_id`; always derive identity strictly from `req.user`.

---

#### SEC-03: Public Exposure of Google Sheet Sync Config & Webhook
- **Location:** [`backend/src/services/googleSheetSyncService.js:11`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/services/googleSheetSyncService.js#L11) & [`backend/src/server.js:67-68`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/server.js#L67-L68)
- **Code:**
  ```javascript
  const CONFIG_PATH = path.join(__dirname, '../../uploads/google_sheet_sync.json');
  ...
  app.use('/uploads', express.static(uploadPath));
  ```
- **Vulnerability:** The Google Sheet synchronization service writes its configuration (containing `sheetUrl`, `webhookUrl`, and `department`) into the root `uploads/` directory. Because `uploads/` is served as a public static directory via Express, anyone can browse directly to `http://localhost:5000/uploads/google_sheet_sync.json`.
- **Impact:** Leakage of internal institutional spreadsheet URLs and execution webhook endpoints.
- **Recommended Remediation:**
  1. Relocate `google_sheet_sync.json` outside the public web root (e.g., to `backend/data/` or database model).
  2. Exclude `*.json` and sensitive extensions from static file delivery.

---

#### SEC-04: Unauthenticated Faculty Leave Toggle & Substitution Route
- **Location:** [`backend/src/routes/leaveRoutes.js:17-23`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/routes/leaveRoutes.js#L17-L23) & [`backend/src/routes/facultyRoutes.js:31-34`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/routes/facultyRoutes.js#L31-L34)
- **Code:**
  ```javascript
  router.post('/teachers/:id/toggle', optionalAuth, leaveController.toggleTeacherLeave);
  router.post('/teachers/:id/leave-toggle', optionalAuth, leaveController.toggleTeacherLeave);
  router.post('/apply-substitute', optionalAuth, leaveController.applySubstitute);
  ```
- **Vulnerability:** Crucial mutating endpoints that modify faculty attendance and apply substitution schedules use `optionalAuth` rather than `verifyToken` combined with `checkRole('HOD', 'ADMIN')`.
- **Impact:** Any client on the network can mark faculty on/off leave and reassign teacher timetable slots without logging in.
- **Recommended Remediation:**
  1. Enforce `verifyToken` on all mutating routes.
  2. Add role verification: `checkRole('HOD', 'ADMIN', 'TEACHER')`.

---

#### SEC-05: QR Code Attendance Spoofing & IDOR Vulnerability
- **Location:** [`backend/src/controllers/attendanceController.js:420-435`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/controllers/attendanceController.js#L420-L435) & [`backend/src/routes/attendanceRoutes.js:19`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/routes/attendanceRoutes.js#L19)
- **Code:**
  ```javascript
  exports.scanQrSession = async (req, res) => {
    const { qrToken, studentId } = req.body;
    let finalStudentId = studentId || req.user?.studentId;
    ...
  ```
- **Vulnerability:** `POST /api/attendance/qr/scan` uses `optionalAuth`. The controller accepts `studentId` directly from the request body. If a student captures the QR token string from the projector screen, they can script attendance for their entire friend group by sending a loop of different `studentId` values without authenticating as them.
- **Impact:** Mass proxy attendance marking and fraud.
- **Recommended Remediation:**
  1. Require `verifyToken` on `/qr/scan`.
  2. Force `finalStudentId = req.user.studentId`; reject any foreign `studentId` in the body unless the user possesses the `TEACHER` or `ADMIN` role.

---

#### SEC-06: Unrestricted Self-Appointment as Tutor Guardian (TG)
- **Location:** [`backend/src/controllers/authController.js:395, 431`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/controllers/authController.js#L395-L431)
- **Code:**
  ```javascript
  const { ..., isTG = false } = req.body;
  const targetRoleName = isTG ? 'TG' : 'TEACHER';
  ```
- **Vulnerability:** When registering via `POST /api/auth/register` with `role: "faculty"`, the request body can include `isTG: true`. The backend automatically creates the user with the elevated `TG` role, allowing them to recommend/reject leaves and access mentee records without HOD appointment.
- **Impact:** Privilege escalation at the point of registration.
- **Recommended Remediation:**
  1. Always register faculty with base role `TEACHER` and `isTG: false`.
  2. Require HOD or Admin action via `/api/faculty/:id/appoint-tg` to grant TG privileges.

---

#### SEC-07: Hardcoded Default Cryptographic Secrets in Source Code
- **Location:** [`backend/src/middleware/auth.js:11`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/middleware/auth.js#L11) & [`backend/src/controllers/authController.js:518`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/controllers/authController.js#L518)
- **Code:**
  ```javascript
  const JWT_SECRET = process.env.JWT_SECRET || 'cse_agentic_erp_super_secure_jwt_secret_2025';
  const expectedSecret = process.env.ADMIN_REGISTRATION_SECRET || 'CSE_ADMIN_SECRET_KEY_2026';
  ```
- **Vulnerability:** In the event that `.env` is omitted, misconfigured, or inaccessible during container boot, the system silently falls back to public, hardcoded string secrets embedded in version control.
- **Impact:** Attackers can forge valid JWTs signed with the default secret or register admin accounts.
- **Recommended Remediation:**
  1. Crash the application during startup (`process.exit(1)`) if `process.env.JWT_SECRET` is missing in production.

---

#### SEC-08: Permissive CORS Origin Reflection with Credentials
- **Location:** [`backend/src/server.js:45-48`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/server.js#L45-L48)
- **Code:**
  ```javascript
  app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true
  }));
  ```
- **Vulnerability:** Setting `origin: true` alongside `credentials: true` instructs Express to reflect whatever origin is provided in the request header (`Access-Control-Allow-Origin: <Origin>`), effectively granting any malicious website cross-origin access with user cookies.
- **Impact:** Potential cross-site request forgery and credential theft.
- **Recommended Remediation:**
  1. Define a strict whitelist array (`['http://localhost:5173', 'https://campusflow.yourcollege.edu']`).
  2. Reject unspecified origins in production.

---

#### SEC-09: Unprotected Internal Endpoints for File Processing
- **Location:** [`backend/src/routes/fileRoutes.js:20, 26`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/routes/fileRoutes.js#L20-L26)
- **Code:**
  ```javascript
  router.patch('/:id/status', optionalAuth, fileController.updateFileStatus);
  router.post('/agent-upload', optionalAuth, fileController.agentUploadFile);
  ```
- **Vulnerability:** These endpoints are intended exclusively for communication from the Python FastAPI microservice back to the Node backend. However, they use `optionalAuth` with no shared secret header (e.g. `X-Internal-Secret`).
- **Impact:** Any external actor can mark uploaded files as processed, inject malicious file entries, or alter processing metadata.
- **Recommended Remediation:**
  1. Implement an internal API key middleware (`X-Microservice-Secret`) shared between Node and Python.

---

### Category 2: Core Academic Business Logic & Data Integrity Flaws

#### LOGIC-01: Permanent Timetable Slot Overwrite on Daily Substitution
- **Location:** [`backend/src/controllers/leaveController.js:381-384`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/controllers/leaveController.js#L381-L384)
- **Code:**
  ```javascript
  // Update the slot teacher
  const updatedSlot = await prisma.timetableSlot.update({
    where: { id: slotId },
    data: { teacherId: substitute.id }
  });
  ```
- **The Flaw:** In the college ERP architecture, `TimetableSlot` represents the **recurring master schedule** (e.g., Every Monday Period 2). When a teacher takes sick leave for one day, clicking "Apply Substitute" overwrites `teacherId` on the slot itself.
- **The Consequence:** The original faculty member is permanently erased from the master schedule for that slot for all remaining weeks of the semester! When next Monday arrives, the substitute teacher is still listed on the timetable.
- **Recommended Remediation:**
  1. Do not update `timetableSlot.teacherId` for daily absences.
  2. Introduce a `DailySubstitution` model (linking `slotId`, `date`, `substituteTeacherId`, `originalTeacherId`, `status`) to handle day-specific overrides.
  3. When rendering daily schedules or checking attendance, query `DailySubstitution` first for date-specific overrides.

---

#### LOGIC-02: Blind Round-Robin Faculty Substitution (Collisions)
- **Location:** [`backend/src/controllers/teacherSchedulerController.js:70-81`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/controllers/teacherSchedulerController.js#L70-L81)
- **Code:**
  ```javascript
  const substitutions = affectedSlots.map((slot, idx) => {
    const substitute = otherFaculty[idx % (otherFaculty.length || 1)];
    return {
      slotId: slot.id,
      period: slot.periodNumber,
      ...
  ```
- **The Flaw:** When an absent teacher's classes are analyzed, candidate substitute teachers are picked using simple round-robin modulo arithmetic (`idx % otherFaculty.length`).
- **The Consequence:** The algorithm never checks:
  1. Whether the substitute teacher is already teaching another class in that same period.
  2. Whether the substitute teacher is also absent on approved leave today.
  3. Whether the substitute teacher has already reached their maximum daily period workload.
- **Recommended Remediation:**
  1. Route substitution generation through the constraint solver in `ai-service/scheduler/absence_adjuster.py` or filter candidate faculty by checking their slots and leave status for that specific day and period.

---

#### LOGIC-03: Timetable Conflicts Triggered by Archived Versions
- **Location:** [`backend/src/controllers/timetableController.js:122-124, 158-166`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/controllers/timetableController.js#L122-L166)
- **Code:**
  ```javascript
  const allSlots = await prisma.timetableSlot.findMany({
    include: { subject: true, teacher: true, classroom: true, section: true, timetable: true }
  });
  ```
- **The Flaw:** When the conflict engine runs, it fetches every `TimetableSlot` in the database without filtering by `timetable: { status: 'ACTIVE' }`. Similarly, `getMyTimetable` queries all slots for a teacher without filtering for active status.
- **The Consequence:** As soon as an HOD regenerates a timetable (moving to Version 2), the conflict engine compares Version 1 slots against Version 2 slots, reporting massive "double booking" conflicts between the teacher and themselves!
- **Recommended Remediation:**
  1. Always add `where: { timetable: { status: 'ACTIVE' } }` to all slot queries.

---

#### LOGIC-04: Loss of Selected Periods in Consideration Requests
- **Location:** [`backend/src/controllers/requestController.js:326-336`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/controllers/requestController.js#L326-L336)
- **The Flaw:** The frontend allows students to choose exact periods (e.g., P1–P4) with timing details. However, the database schema `AttendanceConsiderationRequest` does not have dedicated columns for periods. When `requestController.submitAttendanceConsideration` creates the Prisma record, it does not append the period details into `reason`.
- **The Consequence:** When the page is reloaded from PostgreSQL, the HOD and student lose the specific period tags associated with the OD application.
- **Recommended Remediation:**
  1. Append `[Periods: P1, P2 (10:00 AM - 11:40 AM)]` to `reason` during creation, or add a `periods` JSON column to the Prisma model.

---

#### LOGIC-05: Desynchronized Attendance Session Counters on Overrides
- **Location:** [`backend/src/controllers/attendanceController.js:346-372`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/controllers/attendanceController.js#L346-L372)
- **The Flaw:** When an administrator or faculty overrides a single student's attendance record via `POST /api/attendance/override`, the child `attendanceRecord.status` is updated, but the parent `Attendance` session's `presentCount`, `absentCount`, and `totalStudents` fields are left untouched.
- **The Consequence:** Reports that query `attendance.presentCount` directly will display outdated, inaccurate numbers that disagree with the actual student list.
- **Recommended Remediation:**
  1. Recalculate and update parent session counts inside a Prisma transaction upon every record status override.

---

#### LOGIC-06: Hard Deletion of Leave Applications Breaking Audit Trail
- **Location:** [`backend/src/controllers/leaveController.js:164`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/controllers/leaveController.js#L164)
- **Code:**
  ```javascript
  if (existingLeave) {
    // Toggle OFF -> Delete / Cancel today's leave record
    await prisma.leaveApplication.delete({ where: { id: existingLeave.id } });
  ```
- **The Flaw:** Toggling a teacher's leave back to "Available" performs a hard `prisma.leaveApplication.delete()`.
- **The Consequence:** Deleting the row breaks foreign references in `aIGeneratedRecord` (which stores substitution plans linked to `referenceId: leave.id`), causing orphaned records and erasing audit trails.
- **Recommended Remediation:**
  1. Use soft deletion or update status: `status: 'CANCELLED'`.

---

#### LOGIC-07: Race Condition in Attendance Session Creation
- **Location:** [`backend/src/controllers/attendanceController.js:15-38`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/controllers/attendanceController.js#L15-L38)
- **The Flaw:** `resolveOrCreateAttendance` performs a `findFirst` followed by `create`.
- **The Consequence:** Under concurrent parallel requests (such as simultaneous QR scans or bulk imports), two parallel queries can both evaluate `attendance` as null and execute `create`, producing duplicate parent sessions for the same subject, section, and period.
- **Recommended Remediation:**
  1. Add a unique constraint in `schema.prisma`: `@@unique([subjectId, date, periodNumber, sectionId])`.
  2. Use `prisma.attendance.upsert()` instead of `findFirst` + `create`.

---

### Category 3: System Architecture, Database & Deployment Flaws

#### ARCH-01: Fatal Server Crash on Optional MongoDB Connection Failure
- **Location:** [`backend/src/server.js:141-144`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/server.js#L141-L144)
- **Code:**
  ```javascript
  try {
    await connectMongo();
    console.log('  [MongoDB + Mongoose]  : ✓ CONNECTED (User Data & LLM STM)');
  } catch (mErr) {
    console.error(`  [MongoDB + Mongoose]  : ✗ FAILED - ${mErr.message}`);
    throw mErr;
  }
  ```
- **The Flaw:** If MongoDB Atlas experiences a network timeout or credentials expire during server boot, the catch block throws `mErr`, triggering `process.exit(1)`.
- **The Consequence:** Core ERP services (authentication, attendance, timetables, and student grades)—which run entirely on PostgreSQL—cannot start simply because the auxiliary chat memory database is unreachable.
- **Recommended Remediation:**
  1. Catch the error, log a warning, and allow the server to run in degraded mode (disabling AI chat memory while keeping core ERP functional).

---

#### ARCH-02: Microservice File Sharing Assumptions Across Container Boundaries
- **Location:** [`backend/src/controllers/fileController.js:110`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/controllers/fileController.js#L110)
- **Code:**
  ```javascript
  axios.post(`${PYTHON_AI_SERVICE_URL}/ai/files/process`, {
    local_path: path.resolve(tempFilePath),
    ...
  ```
- **The Flaw:** The Node backend sends a host filesystem path (`C:\Users\...` or `/app/uploads/...`) to the Python microservice. In a microservices architecture (Docker Compose or separate cloud instances), the Python container has a distinct filesystem.
- **The Consequence:** The Python service throws a `FileNotFoundError` when attempting to read the file.
- **Recommended Remediation:**
  1. Always pass `file_url` (ImageKit cloud URL or download endpoint) to the Python service and let it stream the file into memory.

---

#### ARCH-03: In-Memory Stateful OTP and Session Caching
- **Location:** [`backend/src/controllers/authController.js:17`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/controllers/authController.js#L17) & [`backend/src/middleware/auth.js:15`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/middleware/auth.js#L15)
- **The Flaw:** `otpStore` and `authUserCache` are stored in in-memory JavaScript `Map` objects.
- **The Consequence:**
  1. In multi-worker deployments (e.g., PM2 cluster mode or horizontal auto-scaling on cloud platforms), the user might request an OTP on Worker 1 and submit it to Worker 2, resulting in an "Invalid OTP" failure.
  2. When the server restarts, all pending OTP requests are lost.
- **Recommended Remediation:**
  1. Store OTPs with TTL in Redis or in a dedicated database table (`password_reset_tokens`).

---

#### ARCH-04: Hardcoded Public DNS Overrides
- **Location:** [`backend/src/config/postgres.js:11`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/config/postgres.js#L11) & [`backend/src/config/mongo.js:11`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/config/mongo.js#L11)
- **Code:**
  ```javascript
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  ```
- **The Flaw:** The application forces Node.js to use Google and Cloudflare public DNS servers.
- **The Consequence:** In campus intranets, corporate proxies, or private clouds (e.g. AWS VPC, Render internal networks), external DNS lookups for internal service hostnames fail or are blocked by firewall rules on port 53.
- **Recommended Remediation:**
  1. Remove hardcoded `dns.setServers` or make it opt-in via an environment variable (`CUSTOM_DNS_SERVERS`).

---

#### ARCH-05: Dual-ORM Dependency Redundancy (Prisma + Sequelize)
- **Location:** [`backend/package.json:18, 37`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/package.json#L18-L37)
- **The Flaw:** The project maintains dependencies on both `@prisma/client` and `sequelize`. While Sequelize is used only in older migration scripts (`backend/src/migrations/`), the active runtime exclusively uses Prisma.
- **The Consequence:** Increased bundle size, conflicting connection pools, and developer confusion.
- **Recommended Remediation:**
  1. Migrate the legacy migration scripts to standard Prisma migrations (`prisma migrate`) and remove Sequelize, `sqlite3`, and `pg-hstore` dependencies.

---

### Category 4: Frontend & User Experience Flaws

#### FE-01: Google Sheet Endpoint 403 Forbidden for Teachers & TGs
- **Location:** [`backend/src/routes/requestRoutes.js:36`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/backend/src/routes/requestRoutes.js#L36)
- **Code:**
  ```javascript
  router.get('/google-sheet/config', checkRole('HOD', 'ADMIN'), requestController.getGoogleSheetConfig);
  ```
- **The Flaw:** While action buttons were added to the Teacher and TG dashboards to view the live Google Sheet, the backend route restricts `GET /google-sheet/config` strictly to `HOD` and `ADMIN`.
- **The Consequence:** When a Teacher or TG clicks the button to open the modal, the API returns `403 Forbidden`, preventing them from viewing the linked spreadsheet.
- **Recommended Remediation:**
  1. Update route permissions:
     ```javascript
     router.get('/google-sheet/config', checkRole('HOD', 'ADMIN', 'TEACHER', 'TG'), requestController.getGoogleSheetConfig);
     ```

---

#### FE-02: Stale LocalStorage User Cache on Role Revocation
- **Location:** [`frontend/src/context/ERPContext.jsx:22-38`](file:///c:/Users/avinash%20bharti/Desktop/minor%20project/frontend/src/context/ERPContext.jsx#L22-L38)
- **The Flaw:** The initial state of `currentUser` is loaded synchronously from `localStorage.getItem('oist_user')`. If an administrator revokes a teacher's TG appointment in the database, the user still sees the TG options until a 401 error or manual re-login clears the cache.
- **Recommended Remediation:**
  1. Invalidate or update `oist_user` and `oist_role` immediately whenever `/api/auth/me` returns on session mount.

---

## Action Plan & Remediation Roadmap

### Phase 1: Immediate Critical Fixes (Day 1)
1. **Remove OTP from JSON response** in `authController.js:683`.
2. **Restrict `/api/ai/chat` authorization**: Require `verifyToken` and derive role strictly from `req.user`.
3. **Move `google_sheet_sync.json`** out of the public `uploads/` directory into `backend/data/`.
4. **Fix Temporary Substitution Overwrite**: Stop overwriting master `timetableSlot.teacherId`; introduce a date-specific substitution record.
5. **Fix Faculty Leave Toggle Routes**: Add `verifyToken` and `checkRole` to `leaveRoutes.js` and `facultyRoutes.js`.
6. **Fix Teacher/TG Google Sheet Access**: Expand `GET /requests/google-sheet/config` role access to `['HOD', 'ADMIN', 'TEACHER', 'TG']`.

### Phase 2: High-Priority Stabilization (Sprint 1)
1. **Filter Active Timetables in Conflict Diagnosis**: Add `where: { timetable: { status: 'ACTIVE' } }` to eliminate duplicate version warnings.
2. **Graceful Degraded Startup**: Prevent MongoDB connection errors from terminating the PostgreSQL server process.
3. **Persist Period Data in Consideration Requests**: Save selected period IDs into the request reason or schema.
4. **Fix QR Attendance IDOR**: Bind QR scan verification strictly to `req.user.studentId`.

### Phase 3: Architecture & Security Hardening (Sprint 2)
1. **Replace In-Memory OTP Store** with Redis or a PostgreSQL table with TTL.
2. **Remove Hardcoded Secrets**: Fail fast on server boot if `JWT_SECRET` is not set.
3. **Consolidate ORMs**: Remove unused Sequelize dependencies and standardize migrations on Prisma.
4. **Microservice File Transfer**: Pass public cloud URLs or stream buffers instead of local disk paths between Node and FastAPI.

---
*End of Audit Report.*

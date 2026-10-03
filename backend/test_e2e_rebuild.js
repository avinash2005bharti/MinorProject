// ============================================================================
// Comprehensive E2E Verification Suite for Rebuilt ERP Architecture
// Tests: PostgreSQL ERP, MongoDB AI collections, Qdrant vectors,
//        JWT Auth, RBAC enforcement, Empty States, and AI Tool Access
// ============================================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const http = require('http');
const mongoose = require('mongoose');
const { prisma } = require('./src/config/postgres');

// Ensure test mode prevents server auto-listen
process.env.NODE_ENV = 'test';
const { app } = require('./src/server');

const PORT = 5099;
let server;

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:${PORT}${path}`);
    const reqHeaders = { ...headers };
    let payload = null;

    if (body) {
      payload = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  \x1b[32m[PASS]\x1b[0m ${testName}`);
    passed++;
  } else {
    console.error(`  \x1b[31m[FAIL]\x1b[0m ${testName} ${details ? '- ' + details : ''}`);
    failed++;
  }
}

async function runE2ETests() {
  console.log('\n===============================================================');
  console.log(' STARTING E2E REBUILD VERIFICATION SUITE');
  console.log('===============================================================\n');

  // Start Express on test port
  const { connectDB } = require('./src/config/db');
  await connectDB();
  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`Test Express server listening on http://localhost:${PORT}`);
      resolve();
    });
  });

  try {
    // ------------------------------------------------------------------------
    // SECTION 1: DATABASE RESPONSIBILITY & ISOLATION
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 1: Database Responsibility & Isolation ---');

    // Test PostgreSQL tables via Prisma
    const userCount = await prisma.user.count();
    const roleCount = await prisma.role.count();
    const deptCount = await prisma.department.count();
    assert(roleCount >= 5, 'PostgreSQL contains 5 canonical roles (ADMIN, HOD, TEACHER, TG, STUDENT)', `Count: ${roleCount}`);
    assert(deptCount >= 1, 'PostgreSQL contains Department records', `Count: ${deptCount}`);
    assert(userCount >= 1, 'PostgreSQL contains User accounts (source of truth)', `Count: ${userCount}`);

    // Verify MongoDB does NOT contain any ERP tables/collections
    if (mongoose.connection.readyState === 1) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map((c) => c.name);
      console.log('  Active MongoDB collections:', collectionNames);

      const forbiddenCollections = ['users', 'students', 'teachers', 'attendances', 'timetables', 'leaves', 'subjects', 'sections'];
      const foundForbidden = forbiddenCollections.filter((c) => collectionNames.includes(c));
      assert(foundForbidden.length === 0, 'MongoDB does NOT duplicate PostgreSQL ERP collections', `Found: ${foundForbidden.join(', ')}`);

      const allowedAiCollections = ['conversations', 'messages', 'agent_runs', 'short_term_memory', 'tool_execution_logs'];
      const hasAiCollections = allowedAiCollections.some((c) => collectionNames.includes(c));
      assert(hasAiCollections, 'MongoDB contains AI application collections only');
    }

    // Health endpoints
    const healthRes = await request('GET', '/api/health');
    assert(healthRes.status === 200 && healthRes.data.status === 'ok', 'GET /api/health returns 200 OK');

    const dbHealthRes = await request('GET', '/api/health/databases');
    assert(dbHealthRes.status === 200, 'GET /api/health/databases returns 200 OK');
    assert(dbHealthRes.data.databases?.postgres?.connected === true, 'PostgreSQL connection healthy in API gateway');

    // ------------------------------------------------------------------------
    // SECTION 2: AUTHENTICATION FLOWS (STUDENT, TEACHER, ADMIN)
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 2: Authentication Flows ---');

    const timestamp = Date.now();
    const testStudentEmail = `e2e_student_${timestamp}@test.edu`;
    const testTeacherEmail = `e2e_teacher_${timestamp}@test.edu`;
    const defaultPassword = 'TestPassword@123';

    // 2.1 Student Registration
    const regStudentRes = await request('POST', '/api/auth/register/student', {}, {
      name: `E2E Student ${timestamp}`,
      email: testStudentEmail,
      password: defaultPassword,
      enrollment_no: `EN${timestamp.toString().slice(-6)}`,
      section: 'A',
      semester: 5
    });
    assert(regStudentRes.status === 201 && regStudentRes.data.success, 'Student Registration via POST /api/auth/register/student');

    // 2.2 Teacher Registration
    const regTeacherRes = await request('POST', '/api/auth/register/teacher', {}, {
      name: `E2E Teacher ${timestamp}`,
      email: testTeacherEmail,
      password: defaultPassword,
      designation: 'Assistant Professor',
      specialization: 'Artificial Intelligence'
    });
    assert(regTeacherRes.status === 201 && regTeacherRes.data.success, 'Teacher Registration via POST /api/auth/register/teacher');

    // 2.3 Invalid Password Login Test
    const badLoginRes = await request('POST', '/api/auth/login', {}, {
      email: testStudentEmail,
      password: 'WrongPassword'
    });
    assert(badLoginRes.status === 401 && badLoginRes.data.code === 'INVALID_CREDENTIALS', 'Login with wrong password rejected with 401 INVALID_CREDENTIALS');

    // 2.4 Student Login
    const studentLoginRes = await request('POST', '/api/auth/login', {}, {
      email: testStudentEmail,
      password: defaultPassword
    });
    assert(studentLoginRes.status === 200 && Boolean(studentLoginRes.data.token), 'Student Login successful and returns JWT token');
    const studentToken = studentLoginRes.data.token;
    assert(studentLoginRes.data.user.role === 'STUDENT', 'Authoritative role is STUDENT from PostgreSQL');

    // 2.5 Teacher Login
    const teacherLoginRes = await request('POST', '/api/auth/login', {}, {
      email: testTeacherEmail,
      password: defaultPassword
    });
    assert(teacherLoginRes.status === 200 && Boolean(teacherLoginRes.data.token), 'Teacher Login successful and returns JWT token');
    const teacherToken = teacherLoginRes.data.token;
    assert(teacherLoginRes.data.user.role === 'TEACHER', 'Authoritative role is TEACHER from PostgreSQL');

    // 2.6 Admin Login
    const adminLoginRes = await request('POST', '/api/auth/login', {}, {
      email: process.env.ADMIN_EMAIL || 'admin@college.edu',
      password: process.env.ADMIN_PASSWORD || 'Admin@123'
    });
    assert(adminLoginRes.status === 200 && Boolean(adminLoginRes.data.token), 'Admin Login successful and returns JWT token');
    const adminToken = adminLoginRes.data.token;
    assert(adminLoginRes.data.user.role === 'ADMIN', 'Authoritative role is ADMIN from PostgreSQL');

    // 2.7 Verify /api/auth/me with JWT
    const meRes = await request('GET', '/api/auth/me', { Authorization: `Bearer ${studentToken}` });
    assert(meRes.status === 200 && meRes.data.user.email === testStudentEmail, 'GET /api/auth/me resolves student user via PostgreSQL');

    // 2.8 Verify /api/auth/me with Missing Token -> 401
    const noTokenRes = await request('GET', '/api/auth/me');
    assert(noTokenRes.status === 401 && noTokenRes.data.code === 'AUTH_REQUIRED', 'GET /api/auth/me without token rejected with 401 AUTH_REQUIRED');

    // 2.9 Verify /api/auth/me with Invalid Token -> 401
    const badTokenRes = await request('GET', '/api/auth/me', { Authorization: 'Bearer forged.token.here' });
    assert(badTokenRes.status === 401 && (badTokenRes.data.code === 'TOKEN_INVALID' || badTokenRes.data.code === 'INVALID_TOKEN'), 'GET /api/auth/me with fake token rejected with 401');

    // ------------------------------------------------------------------------
    // SECTION 3: ROLE-BASED ACCESS CONTROL (RBAC)
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 3: Centralized RBAC Enforcement ---');

    // Student attempts to access Admin User Directory -> 403 Forbidden
    const studentAccessAdminRes = await request('GET', '/api/admin/users', { Authorization: `Bearer ${studentToken}` });
    assert(studentAccessAdminRes.status === 403 && studentAccessAdminRes.data.code === 'FORBIDDEN', 'Student accessing Admin route is blocked with 403 Forbidden');

    // Student attempts to access HOD Dashboard -> 403 Forbidden
    const studentAccessHodRes = await request('GET', '/api/dashboard/hod', { Authorization: `Bearer ${studentToken}` });
    assert(studentAccessHodRes.status === 403 && studentAccessHodRes.data.code === 'FORBIDDEN', 'Student accessing HOD Dashboard is blocked with 403 Forbidden');

    // Admin accesses Admin User Directory -> 200 OK
    const adminAccessUsersRes = await request('GET', '/api/admin/users', { Authorization: `Bearer ${adminToken}` });
    assert(adminAccessUsersRes.status === 200 && Array.isArray(adminAccessUsersRes.data.users), 'Admin accessing /api/admin/users succeeds (200 OK)');

    // Student accesses Student Dashboard -> 200 OK
    const studentDashRes = await request('GET', '/api/dashboard/student', { Authorization: `Bearer ${studentToken}` });
    assert(studentDashRes.status === 200 && studentDashRes.data.success, 'Student accessing /api/dashboard/student succeeds (200 OK)');

    // Teacher accesses Faculty Dashboard -> 200 OK
    const teacherDashRes = await request('GET', '/api/dashboard/faculty', { Authorization: `Bearer ${teacherToken}` });
    assert(teacherDashRes.status === 200 && teacherDashRes.data.success, 'Teacher accessing /api/dashboard/faculty succeeds (200 OK)');

    // ------------------------------------------------------------------------
    // SECTION 4: EMPTY STATES & REAL DATA INTEGRITY (NO MOCK FALLBACKS)
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 4: Zero Mock / Real Empty States ---');

    // Nonexistent section timetable -> must return empty array, NOT mock slots
    const emptyTimetableRes = await request('GET', '/api/timetable?section=Z&semester=99', { Authorization: `Bearer ${studentToken}` });
    assert(emptyTimetableRes.status === 200, 'GET /api/timetable returns 200 OK');
    const totalSlots = Array.isArray(emptyTimetableRes.data.slots) ? emptyTimetableRes.data.slots.length : Object.values(emptyTimetableRes.data.timetable || {}).flat().length;
    assert(totalSlots === 0, 'Empty timetable returns 0 slots (no fake mock slots)', `Count: ${totalSlots}`);

    // Attendance stats for new student with 0 sessions
    const attStatsRes = await request('GET', '/api/attendance/student/me', { Authorization: `Bearer ${studentToken}` });
    assert(attStatsRes.status === 200, 'GET /api/attendance/student/me returns 200 OK');
    const totalClasses = attStatsRes.data.totalClasses !== undefined ? attStatsRes.data.totalClasses : attStatsRes.data.stats?.totalClasses;
    assert(totalClasses === 0, 'New student total classes is 0 (real database state, no mock 85%)');

    // Notifications for student
    const notifRes = await request('GET', '/api/notifications/student', { Authorization: `Bearer ${studentToken}` });
    assert(notifRes.status === 200 && Array.isArray(notifRes.data.notifications), 'GET /api/notifications returns array from PostgreSQL');

    // ------------------------------------------------------------------------
    // SECTION 5: AI ORCHESTRATION & TOOL SECURITY
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 5: AI Service Integration & RBAC ---');

    // Call /api/ai/suggestions with valid student token
    const suggestionsRes = await request('GET', '/api/ai/suggestions', { Authorization: `Bearer ${studentToken}` });
    assert(suggestionsRes.status === 200 && Array.isArray(suggestionsRes.data.suggestions), 'GET /api/ai/suggestions returns contextual suggestions');

    // Call /api/ai/chat with student token asking about timetable
    const aiChatRes = await request('POST', '/api/ai/chat', { Authorization: `Bearer ${studentToken}` }, {
      prompt: 'What classes do I have today?',
      role: 'student'
    });
    assert(aiChatRes.status === 200 && Boolean(aiChatRes.data.answer || aiChatRes.data.response), 'POST /api/ai/chat returns AI response through Node-to-FastAPI orchestrator');

    // Clean up created test users from PostgreSQL
    console.log('\n--- Cleaning up test records ---');
    await prisma.student.deleteMany({ where: { user: { email: testStudentEmail } } });
    await prisma.teacher.deleteMany({ where: { user: { email: testTeacherEmail } } });
    await prisma.user.deleteMany({ where: { email: { in: [testStudentEmail, testTeacherEmail] } } });
    console.log('  Cleaned up temporary test users.');

  } catch (err) {
    console.error('\nE2E Suite Encountered Unhandled Error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    console.log('\n===============================================================');
    console.log(` E2E VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runE2ETests();

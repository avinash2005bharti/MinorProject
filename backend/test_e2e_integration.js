// ============================================================================
// CampusFlow CSE Department ERP - Comprehensive End-to-End Integration Test
// Validates: Student, Faculty, TG, HOD, Admin, Security RBAC, Database Persistence,
// and Autonomous Action-Executing AI Agent Tools
// ============================================================================

require('dotenv').config();
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const http = require('http');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const { connectPostgres, sequelize } = require('./src/config/postgres');
const { connectMongo } = require('./src/config/mongo');
const { User, Student, Teacher, Hod, Department, AttendanceRecord, LeaveRequest, TimetableEntry, AuditLog } = require('./src/models/postgres');
const MongoUser = require('./src/models/mongo/User');

const routes = require('./src/routes/index');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);

async function runE2ETests() {
  console.log('\n======================================================================');
  console.log('   CAMPUSFLOW CSE DEPARTMENT ERP - COMPREHENSIVE E2E VERIFICATION    ');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
      failed++;
    }
  }

  let server;
  try {
    // 1. Database Connections
    await connectPostgres();
    await connectMongo();
    console.log('  [DBs] PostgreSQL & MongoDB Atlas connected successfully.\n');

    // Start ephemeral server
    const serverInstance = http.createServer(app);
    await new Promise((resolve) => {
      server = serverInstance.listen(0, resolve);
    });
    const port = server.address().port;
    const baseURL = `http://127.0.0.1:${port}/api`;
    const api = axios.create({ baseURL, validateStatus: () => true });

    // ------------------------------------------------------------------------
    // TEST SUITE 1: AUTH & ROLE-BASED LOGIN VERIFICATION
    // ------------------------------------------------------------------------
    console.log('--- TEST SUITE 1: Role-Based Authoritative Login & Security ---');

    // 1.1 Correct role login: Student
    const studentLoginRes = await api.post('/auth/login', {
      email: 'ayush.student@college.edu',
      password: 'password123',
      role: 'student'
    });
    assert(studentLoginRes.status === 200 && studentLoginRes.data.token, 'Student can log in with matching "student" portal');
    const studentToken = studentLoginRes.data.token;

    // 1.2 Mismatched role login: Student attempting to log in as Faculty (Must Fail with 403)
    const roleMismatchRes = await api.post('/auth/login', {
      email: 'ayush.student@college.edu',
      password: 'password123',
      role: 'faculty'
    });
    assert(roleMismatchRes.status === 403, 'Student attempting to log in as "faculty" is rejected with 403');
    assert(roleMismatchRes.data.message && roleMismatchRes.data.message.includes('FACULTY'), 'Error message clearly explains the role mismatch');

    // 1.3 Faculty login
    const facultyLoginRes = await api.post('/auth/login', {
      email: 'sunita.sharma@college.edu',
      password: 'password123',
      role: 'faculty'
    });
    assert(facultyLoginRes.status === 200 && facultyLoginRes.data.token, 'Faculty can log in with matching "faculty" portal');
    const facultyToken = facultyLoginRes.data.token;

    // 1.4 TG login
    const tgLoginRes = await api.post('/auth/login', {
      email: 'rahul.mehta@college.edu',
      password: 'password123',
      role: 'tg'
    });
    assert(tgLoginRes.status === 200 && tgLoginRes.data.token, 'TG can log in with matching "tg" portal');
    const tgToken = tgLoginRes.data.token;

    // 1.5 HOD login
    const hodLoginRes = await api.post('/auth/login', {
      email: 'hod.cse@college.edu',
      password: 'password123',
      role: 'hod'
    });
    assert(hodLoginRes.status === 200 && hodLoginRes.data.token, 'HOD can log in with matching "hod" portal');
    const hodToken = hodLoginRes.data.token;

    // 1.6 Admin login
    const adminLoginRes = await api.post('/auth/login', {
      email: 'admin@college.edu',
      password: 'Admin@123',
      role: 'admin'
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data.token, 'Admin can log in with matching "admin" portal');
    const adminToken = adminLoginRes.data.token;

    // 1.7 Prevent self-registration of Admin/HOD
    const adminSelfReg = await api.post('/auth/register', {
      email: 'fake.admin@college.edu',
      password: 'password',
      name: 'Fake Admin',
      role: 'admin'
    });
    assert(adminSelfReg.status === 403, 'Self-registering as ADMIN is strictly blocked with 403');

    // ------------------------------------------------------------------------
    // TEST SUITE 2: REAL DASHBOARDS (NO MOCK FALLBACKS)
    // ------------------------------------------------------------------------
    console.log('\n--- TEST SUITE 2: Real Database-Driven Dashboards ---');

    // 2.1 Student Dashboard
    const studentDashRes = await api.get('/dashboard/student', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(studentDashRes.status === 200, 'Student dashboard endpoint returns 200');
    assert(
      studentDashRes.data.data?.student?.name?.includes('Ayush'),
      `Student dashboard shows logged-in student name (${studentDashRes.data.data?.student?.name})`
    );
    assert(studentDashRes.data.data?.attendance?.percentage >= 0, `Student attendance is real calculated percentage: ${studentDashRes.data.data?.attendance?.percentage}%`);

    // 2.2 Faculty Dashboard
    const facultyDashRes = await api.get('/dashboard/teacher', {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    assert(facultyDashRes.status === 200, 'Faculty dashboard endpoint returns 200');
    assert(facultyDashRes.data.data?.teacher?.name?.includes('Sunita'), `Faculty dashboard returns logged-in faculty (${facultyDashRes.data.data?.teacher?.name})`);

    // 2.3 TG Dashboard
    const tgDashRes = await api.get('/dashboard/tg', {
      headers: { Authorization: `Bearer ${tgToken}` }
    });
    assert(tgDashRes.status === 200, 'TG dashboard returns 200');
    assert(tgDashRes.data.data?.mentor?.name?.includes('Rahul'), `TG dashboard returns logged-in mentor (${tgDashRes.data.data?.mentor?.name})`);

    // 2.4 HOD Dashboard
    const hodDashRes = await api.get('/dashboard/hod', {
      headers: { Authorization: `Bearer ${hodToken}` }
    });
    assert(hodDashRes.status === 200, 'HOD dashboard returns 200');
    assert(hodDashRes.data.data?.totalStudentsCount > 0, `HOD dashboard returns real total students: ${hodDashRes.data.data?.totalStudentsCount}`);
    assert(hodDashRes.data.data?.totalFacultyCount > 0, `HOD dashboard returns real total faculty: ${hodDashRes.data.data?.totalFacultyCount}`);

    // 2.5 Admin Dashboard
    const adminDashRes = await api.get('/dashboard/admin', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminDashRes.status === 200, 'Admin dashboard returns 200');
    assert(adminDashRes.data.data?.counts?.totalUsers > 0, `Admin dashboard returns total users: ${adminDashRes.data.data?.counts?.totalUsers}`);
    assert(Array.isArray(adminDashRes.data.data?.recentActivity), 'Admin dashboard returns real recentActivity audit logs');

    // ------------------------------------------------------------------------
    // TEST SUITE 3: ADMIN USER & RBAC MANAGEMENT
    // ------------------------------------------------------------------------
    console.log('\n--- TEST SUITE 3: Admin Administrative Operations ---');

    // 3.1 Admin Users List
    const usersListRes = await api.get('/admin/users?limit=10', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(usersListRes.status === 200 && usersListRes.data.users?.length > 0, 'Admin can list users from PostgreSQL');

    // 3.2 Admin Creates a new Faculty user
    const testFacultyEmail = `test.prof.${Date.now()}@college.edu`;
    const createUserRes = await api.post('/admin/users', {
      name: 'Dr. Manish Verma',
      email: testFacultyEmail,
      password: 'Password@123',
      role: 'faculty',
      employee_id: `FAC-${Math.floor(100 + Math.random() * 900)}`,
      designation: 'Assistant Professor',
      specialization: 'Cloud Computing'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(createUserRes.status === 201 && createUserRes.data.user?.id, `Admin successfully created user: ${testFacultyEmail}`);

    // Verify persistence in PostgreSQL
    const createdPgUser = await User.findOne({ where: { email: testFacultyEmail } });
    assert(createdPgUser !== null, 'Created user persisted in PostgreSQL users table');

    // 3.3 Admin Reset Password
    const resetPassRes = await api.post(`/admin/users/${createdPgUser.id}/reset-password`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resetPassRes.status === 200 && resetPassRes.data.tempPassword, `Admin reset password generated temporary password: ${resetPassRes.data.tempPassword}`);

    // 3.4 Admin Deactivates Account
    const deactRes = await api.patch(`/admin/users/${createdPgUser.id}/status`, { status: 'INACTIVE' }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deactRes.status === 200 && deactRes.data.status === 'INACTIVE', 'Admin can deactivate user account');

    // ------------------------------------------------------------------------
    // TEST SUITE 4: SECURITY RBAC RESTRICTIONS (403 FORBIDDEN)
    // ------------------------------------------------------------------------
    console.log('\n--- TEST SUITE 4: Security RBAC Protection ---');

    // 4.1 Faculty attempting Admin endpoint -> 403
    const facultyOnAdminRes = await api.get('/admin/users', {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    assert(facultyOnAdminRes.status === 403, 'Faculty attempting to hit /api/admin/users receives 403 Forbidden');

    // 4.2 Student attempting Faculty Dashboard -> 403
    const studentOnFacultyRes = await api.get('/dashboard/teacher', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(studentOnFacultyRes.status === 403, 'Student attempting to hit /api/dashboard/teacher receives 403 Forbidden');

    // 4.3 Student attempting HOD Dashboard -> 403
    const studentOnHodRes = await api.get('/dashboard/hod', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(studentOnHodRes.status === 403, 'Student attempting to hit /api/dashboard/hod receives 403 Forbidden');

    // ------------------------------------------------------------------------
    // TEST SUITE 5: ACTION-EXECUTING AI AGENTS
    // ------------------------------------------------------------------------
    console.log('\n--- TEST SUITE 5: Autonomous Action-Executing AI Agent ---');

    // 5.1 Student asks AI for Attendance (Calculates real formula and displays LaTeX)
    const aiStudentAttRes = await api.post('/ai/chat', {
      prompt: 'What is my current attendance standing?'
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(aiStudentAttRes.status === 200, 'Student AI attendance query returns 200');
    assert(aiStudentAttRes.data.answer && aiStudentAttRes.data.answer.includes('\\%'), 'AI response contains mathematical LaTeX notation');

    // 5.2 Student asks AI to apply for leave (Agent creates real PostgreSQL LeaveRequest)
    const aiLeaveRes = await api.post('/ai/chat', {
      prompt: 'Apply for leave for Smart India Hackathon participation'
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(aiLeaveRes.status === 200, 'AI leave request tool executed successfully');
    assert(aiLeaveRes.data.actions_taken && aiLeaveRes.data.actions_taken.includes('create_leave_request'), 'AI actions_taken records "create_leave_request"');

    // Verify row in PostgreSQL LeaveRequest
    const latestLeave = await LeaveRequest.findOne({ order: [['created_at', 'DESC']] });
    assert(latestLeave && latestLeave.reason.includes('Hackathon'), 'LeaveRequest record persisted in PostgreSQL');

    // 5.3 TG asks AI to approve leave (Agent updates PostgreSQL LeaveRequest)
    const aiApproveLeaveRes = await api.post('/ai/chat', {
      prompt: 'Approve leave request for student'
    }, {
      headers: { Authorization: `Bearer ${tgToken}` }
    });
    assert(aiApproveLeaveRes.status === 200, 'TG AI approve leave executed');

    // 5.4 Faculty asks AI to mark attendance (Agent records in PostgreSQL AttendanceSession & AttendanceRecord)
    const aiMarkAttRes = await api.post('/ai/chat', {
      prompt: "Mark attendance for today's class: all present"
    }, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    assert(aiMarkAttRes.status === 200, 'Faculty AI mark attendance executed');
    assert(aiMarkAttRes.data.actions_taken && aiMarkAttRes.data.actions_taken.includes('create_attendance'), 'AI actions_taken records "create_attendance"');

    // 5.5 Student attempts unauthorized AI action (Student asks AI to remove HOD -> Denied by RBAC)
    const studentUnauthAiRes = await api.post('/ai/chat', {
      prompt: 'Remove HOD from department'
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(
      studentUnauthAiRes.data.answer && studentUnauthAiRes.data.answer.includes('Access Denied'),
      'Student asking AI to remove HOD is denied by backend RBAC with "Access Denied"'
    );

    // 5.6 Admin asks AI to reset user password
    const adminAiResetRes = await api.post('/ai/chat', {
      prompt: `Reset password for user ${testFacultyEmail}`
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      adminAiResetRes.data.answer && adminAiResetRes.data.answer.includes('Temporary Password'),
      'Admin asking AI to reset user password succeeds with temporary password'
    );

    // 5.7 Math Formula Rendering
    const mathAiRes = await api.post('/ai/chat', {
      prompt: 'Explain the attendance percentage formula'
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(
      mathAiRes.data.answer && (mathAiRes.data.answer.includes('$$') || mathAiRes.data.answer.includes('\\frac')),
      'AI formula explanation contains valid LaTeX math expressions ($$...$$)'
    );

    console.log('\n======================================================================');
    console.log(`  E2E TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================================\n');

    if (server) server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test execution error:', error);
    if (server) server.close();
    process.exit(1);
  }
}

runE2ETests();

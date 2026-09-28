process.env.NODE_ENV = 'test';
const http = require('http');
const assert = require('assert');
const { connectMySQL, sequelize } = require('../src/config/mysql');
const { connectDB, disconnectDB } = require('../src/config/db');
const { app } = require('../src/server');
const seedCseDatabase = require('../src/utils/seedData');
const { User, Timetable, TimetableMaster, TeacherAbsence, TeacherSubstitution } = require('../src/models/mysql');

let server;
let port;
let baseUrl;
let hodToken;
let studentToken;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const bodyBuffer = Buffer.concat(chunks);
        let bodyJson = null;
        try {
          bodyJson = JSON.parse(bodyBuffer.toString());
        } catch (e) {
          bodyJson = bodyBuffer;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: bodyJson
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('  RUNNING FULL ERP BACKEND INTEGRATION TEST SUITE   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. SETUP
  await connectMySQL();
  await sequelize.sync();
  await connectDB();
  await seedCseDatabase();

  await new Promise(resolve => {
    server = app.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`[Test Runner] Test server listening on ${baseUrl}\n`);
      resolve();
    });
  });

  try {
    // ----------------- TEST GROUP 1: AUTH & RBAC -----------------
    console.log('--- 1. AUTHENTICATION & RBAC ---');
    await test('HOD Login with credentials', async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'hod.cse@college.edu', password: 'password123' }
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.token);
      hodToken = res.body.token;
    });

    await test('Student Login with credentials', async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'ayush.student@college.edu', password: 'password123' }
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.token);
      studentToken = res.body.token;
    });

    await test('RBAC: Student cannot create timetable entries (Forbidden)', async () => {
      const res = await request('/api/timetable', {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: {
          year: '3rd Year',
          semester: 5,
          section: 'A',
          day: 'Monday',
          start_time: '08:30 AM',
          end_time: '09:30 AM',
          subject: 'Unauthorized Subject',
          faculty: 'Dr. Fake'
        }
      });
      assert.strictEqual(res.status, 403);
    });

    // ----------------- TEST GROUP 2: TIMETABLE & GENERATION -----------------
    console.log('\n--- 2. TIMETABLE & GENERATION ENGINE ---');
    let generatedMasterId = null;

    await test('GET /api/timetable returns current schedule', async () => {
      const res = await request('/api/timetable?year=3rd Year&semester=5&section=A');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.timetable));
      assert.ok(res.body.timetable.length > 0);
    });

    await test('POST /api/timetable/generate creates draft timetable', async () => {
      const res = await request('/api/timetable/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${hodToken}` },
        body: {
          department: 'CSE',
          year: '3rd Year',
          semester: 5,
          section: 'A',
          academic_year: '2026-27',
          custom_constraints: ['Keep Friday lighter']
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.metrics);
      assert.strictEqual(res.body.metrics.hard_constraints_satisfied, true);
      generatedMasterId = res.body.master_id;
    });

    await test('GET /api/timetable/conflicts validates zero collisions', async () => {
      const res = await request('/api/timetable/conflicts?semester=5&section=A');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.conflictsCount, 0);
      assert.strictEqual(res.body.hardConstraintsSatisfied, true);
    });

    await test('POST /api/timetable/:id/approve approves draft version', async () => {
      const targetId = generatedMasterId || 1;
      const res = await request(`/api/timetable/${targetId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${hodToken}` }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.master.status, 'Approved');
    });

    await test('POST /api/timetable/:id/publish publishes version and archives old', async () => {
      const targetId = generatedMasterId || 1;
      const res = await request(`/api/timetable/${targetId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${hodToken}` }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.master.status, 'Published');
    });

    await test('GET /api/timetable/export/excel returns XLSX file buffer', async () => {
      const res = await request('/api/timetable/export/excel?section=A&semester=5');
      assert.strictEqual(res.status, 200);
      assert.ok(res.headers['content-type'].includes('spreadsheetml'));
    });

    await test('GET /api/timetable/export/pdf returns PDF file buffer', async () => {
      const res = await request('/api/timetable/export/pdf?section=A&semester=5');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/pdf');
    });

    // ----------------- TEST GROUP 3: TEACHER SCHEDULER & ABSENCE -----------------
    console.log('\n--- 3. TEACHER SCHEDULER & ABSENCE ADJUSTMENT ---');
    let absenceData = null;

    await test('POST /api/teacher-scheduler/analyze calculates substitute proposals', async () => {
      const res = await request('/api/teacher-scheduler/analyze', {
        method: 'POST',
        body: {
          teacher_name: 'Dr. Sunita Sharma',
          day: 'Monday'
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.proposals.length > 0);
      absenceData = res.body;
    });

    await test('POST /api/teacher-scheduler/apply applies substitutions transactionally', async () => {
      assert.ok(absenceData, 'Absence data must exist from previous step');
      const res = await request('/api/teacher-scheduler/apply', {
        method: 'POST',
        headers: { Authorization: `Bearer ${hodToken}` },
        body: {
          absence_data: absenceData,
          approved_by: 'Dr. Alok Verma (HOD)'
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.applied_count > 0);
    });

    // ----------------- TEST GROUP 4: AI AGENT CHAT WORKFLOW -----------------
    console.log('\n--- 4. AGENTIC AI CHAT WORKFLOW ---');
    const convId = `test_chat_conv_${Date.now()}`;

    await test('Scenario 1: HOD asks "Generate timetable for CSE 3A for semester 5"', async () => {
      const res = await request('/api/ai/chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${hodToken}` },
        body: {
          message: 'Generate timetable for CSE 3A for semester 5',
          conversationId: convId,
          agent: 'timetable'
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.detected_intent, 'GENERATE_TIMETABLE');
      assert.ok(res.body.answer.includes('Draft Generated') || res.body.answer.includes('Timetable'));
      assert.strictEqual(res.body.approval_requirement.requires_approval, true);
    });

    await test('Scenario 2: HOD says "Professor Sharma is absent today. Adjust all his classes."', async () => {
      const res = await request('/api/ai/chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${hodToken}` },
        body: {
          message: 'Professor Sharma is absent today. Adjust all his classes.',
          conversationId: convId,
          agent: 'timetable'
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.detected_intent, 'ABSENCE_ADJUSTMENT');
      assert.ok(res.body.answer.includes('Sharma'));
      assert.strictEqual(res.body.approval_requirement.requires_approval, true);
    });

    await test('Approval Flow: HOD says "Approve"', async () => {
      const res = await request('/api/ai/chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${hodToken}` },
        body: {
          message: 'Approve',
          conversationId: convId,
          agent: 'timetable'
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.detected_intent, 'APPROVAL_CONFIRMATION');
      assert.ok(res.body.answer.includes('Approved') || res.body.answer.includes('Applied'));
    });

    // ----------------- TEST GROUP 5: HEALTH CHECK -----------------
    console.log('\n--- 5. DEEP CLOUD HEALTH CHECKS ---');
    await test('GET /api/health verifies MySQL, MongoDB, and service status', async () => {
      const res = await request('/api/health');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.checks.apiGateway === 'UP');
      assert.ok(res.body.checks.mysql.startsWith('UP'));
      assert.ok(res.body.checks.mongodb.startsWith('UP'));
    });

  } finally {
    if (server) {
      await new Promise(r => server.close(r));
    }
    await disconnectDB();
  }

  console.log('\n====================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED `);
  console.log('====================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

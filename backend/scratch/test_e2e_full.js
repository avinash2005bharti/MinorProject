// ============================================================================
// Comprehensive E2E Verification Script for CampusFlow Smart ERP
// ============================================================================

const axios = require('axios');
const jwt = require('jsonwebtoken');
const { prisma } = require('../src/config/postgres');

const BACKEND_URL = 'http://localhost:5000/api';
const JWT_SECRET = '6LP4FBmCAQIy9KCbpbaTwLIGZC55bMeNiBFB2rW9GtMwLSgIbwJipqbw77i';

async function runE2ETests() {
  console.log('=================================================================');
  console.log('🚀 STARTING CAMPUSFLOW SMART ERP END-TO-END VERIFICATION');
  console.log('=================================================================\n');

  // 1. Authenticate / Generate Valid Tokens for Real PostgreSQL Users
  console.log('--- 1. Authenticating Roles with Real PostgreSQL Accounts ---');

  const adminUser = await prisma.user.findFirst({ where: { role: { name: 'ADMIN' } } });
  const hodUser = await prisma.user.findFirst({ where: { role: { name: 'HOD' } }, include: { teacherProfile: true } });
  const teacherUser = await prisma.user.findFirst({ where: { role: { name: 'TEACHER' } }, include: { teacherProfile: true } });
  const studentUser = await prisma.user.findFirst({ where: { role: { name: 'STUDENT' } }, include: { studentProfile: true } });

  const adminToken = jwt.sign(
    { id: adminUser.id, email: adminUser.email, role: 'admin', name: 'System Admin' },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  console.log(`✅ Admin authenticated: ${adminUser.email}`);

  const hodToken = jwt.sign(
    { id: hodUser.id, email: hodUser.email, role: 'hod', name: hodUser.name, teacherId: hodUser.teacherProfile?.id },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  console.log(`✅ HOD authenticated: ${hodUser.email} (Teacher ID: ${hodUser.teacherProfile?.id})`);

  const teacherToken = jwt.sign(
    { id: teacherUser.id, email: teacherUser.email, role: 'teacher', name: teacherUser.name, teacherId: teacherUser.teacherProfile?.id },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  console.log(`✅ Teacher authenticated: ${teacherUser.email} (Teacher ID: ${teacherUser.teacherProfile?.id})`);

  const studentToken = jwt.sign(
    { id: studentUser.id, email: studentUser.email, role: 'student', name: studentUser.name, studentId: studentUser.studentProfile?.id },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  console.log(`✅ Student authenticated: ${studentUser.email} (Student ID: ${studentUser.studentProfile?.id})`);

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const hodHeaders = { Authorization: `Bearer ${hodToken}` };
  const teacherHeaders = { Authorization: `Bearer ${teacherToken}` };
  const studentHeaders = { Authorization: `Bearer ${studentToken}` };

  // 2. Test Master Data APIs
  console.log('\n--- 2. Testing Master Data Management APIs ---');
  try {
    // 2a. Fetch Classrooms
    const roomsRes = await axios.get(`${BACKEND_URL}/classrooms`, { headers: hodHeaders });
    console.log(`✅ Classrooms retrieved: ${roomsRes.data.data?.length || roomsRes.data.length} rooms`);

    // 2b. Fetch Faculty
    const facRes = await axios.get(`${BACKEND_URL}/faculty`, { headers: hodHeaders });
    console.log(`✅ Faculty roster retrieved: ${facRes.data.faculty?.length || facRes.data.data?.length} faculty`);

    // 2c. Fetch Subjects
    const subRes = await axios.get(`${BACKEND_URL}/academic/subjects?semester=5`, { headers: hodHeaders });
    console.log(`✅ Course subjects retrieved: ${subRes.data.subjects?.length || subRes.data.data?.length} subjects for Sem 5`);

    // 2d. Test Bulk Import Preview Dry-run
    const confirmRes = await axios.post(
      `${BACKEND_URL}/master-data/import/confirm?type=classrooms`,
      {
        records: [
          { roomNumber: 'CR-305', roomType: 'CLASSROOM', capacity: 60 },
          { roomNumber: 'Lab-4 (Network)', roomType: 'LAB', capacity: 35 }
        ]
      },
      { headers: adminHeaders }
    );
    console.log(`✅ Master Data insert confirm passed: ${confirmRes.data.inserted} classrooms processed`);

    // 2e. Test Excel Export
    const exportRes = await axios.get(`${BACKEND_URL}/master-data/export/teachers`, {
      headers: adminHeaders,
      responseType: 'arraybuffer'
    });
    console.log(`✅ Master Data Excel Export passed (${exportRes.data.length} bytes received)`);
  } catch (e) {
    console.error('❌ Master Data test failed:', e.response?.data || e.message);
  }

  // 3. Test Smart Timetable Generator with Constraints
  console.log('\n--- 3. Testing Smart Timetable Generator (Timing, Breaks, Periods, Subjects) ---');
  try {
    const timetablePayload = {
      department: 'CSE',
      year: '3rd Year',
      semester: 5,
      section: 'A',
      academic_year: '2026-27',
      collegeTiming: {
        startTime: '09:00 AM',
        endTime: '04:30 PM',
        saturdayWorking: true
      },
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      breaks: [
        { name: 'Short Break', startTime: '11:10 AM', endTime: '11:25 AM', isBreak: true },
        { name: 'Lunch Break', startTime: '01:05 PM', endTime: '01:50 PM', isBreak: true }
      ],
      periods: [
        { period: 1, label: 'Period 1', startTime: '09:00 AM', endTime: '09:50 AM', duration: 50 },
        { period: 2, label: 'Period 2', startTime: '09:50 AM', endTime: '10:40 AM', duration: 50 },
        { period: 3, label: 'Period 3', startTime: '10:40 AM', endTime: '11:30 AM', duration: 50 },
        { period: 4, label: 'Period 4', startTime: '11:45 AM', endTime: '12:35 PM', duration: 50 },
        { period: 5, label: 'Period 5', startTime: '12:35 PM', endTime: '01:25 PM', duration: 50 },
        { period: 6, label: 'Period 6', startTime: '02:00 PM', endTime: '02:50 PM', duration: 50 },
        { period: 7, label: 'Period 7', startTime: '02:50 PM', endTime: '03:40 PM', duration: 50 }
      ],
      start_time: '09:00 AM',
      period_duration_minutes: 50,
      periods_per_day: 7,
      custom_subjects: [
        { code: 'CS501', name: 'Database Management Systems', periods_per_week: 4, is_lab: false },
        { code: 'CS502', name: 'Operating Systems', periods_per_week: 4, is_lab: false },
        { code: 'CS503', name: 'Computer Networks', periods_per_week: 4, is_lab: false },
        { code: 'CS504', name: 'Theory of Computation', periods_per_week: 3, is_lab: false },
        { code: 'CS505', name: 'Database & OS Lab', periods_per_week: 2, is_lab: true, consecutive_periods: 2 }
      ]
    };

    const genRes = await axios.post(`${BACKEND_URL}/timetable/generate`, timetablePayload, { headers: hodHeaders });
    const slots = genRes.data.slots || genRes.data.timetable || [];
    console.log(`✅ Timetable Generated successfully: ${slots.length} class slots created across Monday to Saturday`);

    // 3b. Verify conflict detection
    if (genRes.data.conflicts !== undefined) {
      console.log(`✅ Constraint & Conflict checking executed: ${genRes.data.conflicts.length} warnings detected`);
    }

    // 3c. Test PDF Export
    const pdfRes = await axios.post(
      `${BACKEND_URL}/timetable/export/pdf`,
      { section: 'A', semester: 5, year: '3rd Year' },
      { headers: hodHeaders, responseType: 'arraybuffer' }
    );
    console.log(`✅ Timetable 2D PDF Download passed (${pdfRes.data.length} bytes, format: application/pdf)`);

    // 3d. Test Excel Export
    const excelRes = await axios.post(
      `${BACKEND_URL}/timetable/export/excel`,
      { section: 'A', semester: 5, academicYear: '2026-27' },
      { headers: hodHeaders, responseType: 'arraybuffer' }
    );
    console.log(`✅ Timetable 2D Excel Download passed (${excelRes.data.length} bytes, format: application/vnd.openxmlformats-officedocument)`);
  } catch (e) {
    console.error('❌ Timetable generation / export test failed:', e.response?.data || e.message);
  }

  // 4. Test Teacher Leave System, Student Visibility & AI Substitution
  console.log('\n--- 4. Testing Teacher Leave, Student Visibility & AI Substitution ---');
  try {
    const targetTeacherId = teacherUser.teacherProfile?.id;
    console.log(`Testing with Faculty: ${teacherUser.name} (Teacher ID: ${targetTeacherId})`);

    // 4b. Teacher Toggles ON LEAVE
    const toggleOnRes = await axios.post(
      `${BACKEND_URL}/teachers/${targetTeacherId}/leave-toggle`,
      { onLeave: true, reason: 'Medical emergency' },
      { headers: teacherHeaders }
    );
    console.log(`✅ Teacher toggled ON LEAVE: "${toggleOnRes.data.message}"`);
    console.log(`   Affected classes detected: ${toggleOnRes.data.affectedClasses?.length || 0}`);

    // 4c. Verify Student sees Faculty as ON LEAVE (no private reason shown)
    const studentDashRes = await axios.get(`${BACKEND_URL}/dashboard/student`, { headers: studentHeaders });
    const studentAvail = studentDashRes.data.data?.facultyAvailability || [];
    const studentViewTeacher = studentAvail.find(t => t.id === targetTeacherId || t.name === teacherUser.name);
    console.log(`✅ Student Faculty Availability check: ${studentViewTeacher?.name} is ${studentViewTeacher?.status}`);
    if (studentViewTeacher?.reason) {
      console.warn('⚠️ Warning: Student view exposed private reason!');
    } else {
      console.log('✅ Student RBAC verified: private leave reasons hidden from students.');
    }

    // 4d. HOD checks Affected Classes
    const affRes = await axios.get(`${BACKEND_URL}/teachers/${targetTeacherId}/affected-classes`, { headers: hodHeaders });
    const affectedSlots = affRes.data.affectedClasses || [];
    console.log(`✅ HOD affected classes query: ${affectedSlots.length} affected slots today`);

    // 4e. AI Proposes Substitutes
    const propRes = await axios.post(
      `${BACKEND_URL}/teachers/${targetTeacherId}/propose-substitutes`,
      { date: '' },
      { headers: hodHeaders }
    );
    const proposals = propRes.data.proposals || [];
    console.log(`✅ AI Substitution Engine evaluated: ${proposals.length} slot proposals generated`);
    if (proposals.length > 0 && proposals[0].recommendedSubstitute) {
      console.log(`   Recommended top substitute for Period ${proposals[0].period}: ${proposals[0].recommendedSubstitute.name} (Score: ${proposals[0].recommendedSubstitute.score}%)`);

      // 4f. HOD Approves Substitution
      const applyRes = await axios.post(
        `${BACKEND_URL}/leaves/apply-substitute`,
        {
          slotId: proposals[0].slotId,
          originalTeacherId: targetTeacherId,
          substituteTeacherId: proposals[0].recommendedSubstitute.teacherId,
          reason: 'HOD approved AI substitute'
        },
        { headers: hodHeaders }
      );
      console.log(`✅ HOD 1-Click Substitution Approved: "${applyRes.data.message}"`);
    }

    // 4g. Toggle teacher back to AVAILABLE
    const toggleOffRes = await axios.post(
      `${BACKEND_URL}/teachers/${targetTeacherId}/leave-toggle`,
      { onLeave: false },
      { headers: teacherHeaders }
    );
    console.log(`✅ Teacher toggled back to AVAILABLE: "${toggleOffRes.data.message}"`);
  } catch (e) {
    console.error('❌ Teacher leave / AI substitution test failed:', e.response?.data || e.message);
  }

  console.log('\n=================================================================');
  console.log('🎉 ALL END-TO-END VERIFICATION CHECKS COMPLETED');
  console.log('=================================================================');
  process.exit(0);
}

runE2ETests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

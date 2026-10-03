// Automated End-to-End Verification Script
// Tests all real backend endpoints and flows with PostgreSQL database

const BASE_URL = 'http://localhost:5000/api';

async function testAll() {
  console.log('====================================================');
  console.log('STARTING AUTOMATED REAL BACKEND E2E VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function report(name, isSuccess, details = '') {
    if (isSuccess) {
      passed++;
      console.log(`[PASS] ${name} ${details ? '- ' + details : ''}`);
    } else {
      failed++;
      console.error(`[FAIL] ${name} ${details ? '- ' + details : ''}`);
    }
  }

  // Helper for requests
  async function api(method, endpoint, body = null, token = null) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : await res.text();
    return { status: res.status, ok: res.ok, data };
  }

  // 1. Health check
  try {
    const health = await api('GET', '/health');
    report('1. Backend Health & Database Connectivity', health.ok && health.data?.databaseStatus === 'connected', `DB: ${health.data?.databaseStatus}`);
  } catch (e) {
    report('1. Backend Health & Database Connectivity', false, e.message);
  }

  // 2. Student Self Registration
  const testStudentEnrollment = `0103CS${Date.now().toString().slice(-6)}`;
  const testStudentEmail = `student_${Date.now()}@college.edu`;
  let studentToken = null;

  try {
    const regStudent = await api('POST', '/auth/register', {
      role: 'student',
      name: 'Ayush Test Student',
      email: testStudentEmail,
      enrollment_no: testStudentEnrollment,
      password: 'password123',
      year: '3rd Year',
      semester: 5,
      section: 'A',
      batch: '2023-2027',
      phone: '9876543210'
    });
    report('2. Student Self-Registration (/api/auth/register)', regStudent.ok && regStudent.data?.success, `Created User ID: ${regStudent.data?.user?.id}`);

    // Verify Login
    const loginRes = await api('POST', '/auth/login', {
      email: testStudentEmail,
      password: 'password123'
    });
    studentToken = loginRes.data?.token;
    report('3. Student Login & JWT Token Dispatch', loginRes.ok && !!studentToken, `Role: ${loginRes.data?.user?.role}`);
  } catch (e) {
    report('2 & 3. Student Registration / Login', false, e.message);
  }

  // 3. Teacher Self Registration
  const testTeacherEmail = `faculty_${Date.now()}@college.edu`;
  let teacherToken = null;

  try {
    const regTeacher = await api('POST', '/auth/register', {
      role: 'faculty',
      name: 'Dr. Test Faculty',
      email: testTeacherEmail,
      password: 'password123',
      designation: 'Assistant Professor',
      specialization: 'Cybersecurity & Blockchain',
      phone: '9876543211'
    });
    report('4. Teacher Self-Registration (/api/auth/register)', regTeacher.ok && regTeacher.data?.success, `Created User ID: ${regTeacher.data?.user?.id}`);

    // Verify Login
    const loginRes = await api('POST', '/auth/login', {
      email: testTeacherEmail,
      password: 'password123'
    });
    teacherToken = loginRes.data?.token;
    report('5. Teacher Login & Role Verification', loginRes.ok && (loginRes.data?.user?.role === 'TEACHER' || loginRes.data?.user?.role === 'faculty'), `Role: ${loginRes.data?.user?.role}`);
  } catch (e) {
    report('4 & 5. Teacher Registration / Login', false, e.message);
  }

  // 4. Privileged Logins: Admin & HOD
  let adminToken = null;
  let hodToken = null;

  try {
    const adminLogin = await api('POST', '/auth/login', {
      email: 'admin@college.edu',
      password: 'Admin@123'
    });
    adminToken = adminLogin.data?.token;
    report('6. Admin Login (/api/auth/login)', adminLogin.ok && !!adminToken, `Role: ${adminLogin.data?.user?.role}`);
  } catch (e) {
    report('6. Admin Login', false, e.message);
  }

  try {
    const hodLogin = await api('POST', '/auth/login', {
      email: 'hod.cse@college.edu',
      password: 'password123'
    });
    hodToken = hodLogin.data?.token;
    report('7. HOD Login (/api/auth/login)', hodLogin.ok && !!hodToken, `Role: ${hodLogin.data?.user?.role}`);
  } catch (e) {
    report('7. HOD Login', false, e.message);
  }

  // 5. Dashboards
  try {
    const stDash = await api('GET', '/dashboard/student', null, studentToken);
    report('8. Student Dashboard (/api/dashboard/student)', stDash.ok && stDash.data?.success, `Student: ${stDash.data?.data?.student?.name}, Att: ${stDash.data?.data?.attendance?.percentage}%`);
  } catch (e) {
    report('8. Student Dashboard', false, e.message);
  }

  try {
    const facDash = await api('GET', '/dashboard/teacher', null, teacherToken);
    const facultyName = facDash.data?.data?.faculty?.name || facDash.data?.data?.teacher?.name;
    report('9. Teacher Dashboard (/api/dashboard/teacher)', facDash.ok && facDash.data?.success, `Faculty: ${facultyName}`);
  } catch (e) {
    report('9. Teacher Dashboard', false, e.message);
  }

  try {
    const hodDash = await api('GET', '/dashboard/hod', null, hodToken);
    const totalStudents = hodDash.data?.data?.stats?.totalStudents ?? hodDash.data?.data?.totalStudents;
    const avgAtt = hodDash.data?.data?.stats?.averageAttendance ?? hodDash.data?.data?.departmentAttendance;
    report('10. HOD Dashboard (/api/dashboard/hod)', hodDash.ok && hodDash.data?.success, `Total Students: ${totalStudents}, Att: ${avgAtt}%`);
  } catch (e) {
    report('10. HOD Dashboard', false, e.message);
  }

  try {
    const adminDash = await api('GET', '/dashboard/admin', null, adminToken);
    report('11. Admin Dashboard (/api/dashboard/admin)', adminDash.ok && adminDash.data?.success, `Total Users: ${adminDash.data?.data?.totalUsers}, Students: ${adminDash.data?.data?.totalStudents}`);
  } catch (e) {
    report('11. Admin Dashboard', false, e.message);
  }

  // 6. Timetable & Export APIs
  try {
    const ttRes = await api('GET', '/timetable?year=3rd Year&semester=5&section=A', null, studentToken);
    const hasSlots = Array.isArray(ttRes.data?.slots) || typeof ttRes.data?.timetable === 'object';
    report('12. Timetable Fetch (/api/timetable)', ttRes.ok && hasSlots, `Slots: ${ttRes.data?.slots?.length ?? 0}`);
  } catch (e) {
    report('12. Timetable Fetch', false, e.message);
  }

  try {
    const pdfRes = await fetch(`${BASE_URL}/timetable/export/pdf?year=3rd Year&semester=5&section=A`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    report('13. Timetable PDF Export Binary Stream (/api/timetable/export/pdf)', pdfRes.ok && pdfRes.headers.get('content-type')?.includes('pdf'), `Status: ${pdfRes.status}, Content-Type: ${pdfRes.headers.get('content-type')}`);
  } catch (e) {
    report('13. Timetable PDF Export', false, e.message);
  }

  try {
    const excelRes = await fetch(`${BASE_URL}/timetable/export/excel?year=3rd Year&semester=5&section=A`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    report('14. Timetable Excel Export Binary Stream (/api/timetable/export/excel)', excelRes.ok, `Status: ${excelRes.status}`);
  } catch (e) {
    report('14. Timetable Excel Export', false, e.message);
  }

  // 7. Academic Hierarchy
  try {
    const hierRes = await api('GET', '/academic/hierarchy', null, studentToken);
    report('15. CSE Academic Hierarchy (/api/academic/hierarchy)', hierRes.ok && Array.isArray(hierRes.data?.years), `Years: ${hierRes.data?.years?.length}`);
  } catch (e) {
    report('15. CSE Academic Hierarchy', false, e.message);
  }

  // 8. Leave Submission
  try {
    const leaveRes = await api('POST', '/requests/leave', {
      leaveType: 'Medical',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: 'Automated verification medical leave test',
      supportingDoc: 'Test_Prescription.pdf'
    }, studentToken);
    report('16. Student Leave Application (/api/requests/leave)', leaveRes.ok && leaveRes.data?.success, `Request ID: ${leaveRes.data?.data?.id || leaveRes.data?.message}`);
  } catch (e) {
    report('16. Student Leave Application', false, e.message);
  }

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================\n');
}

testAll();

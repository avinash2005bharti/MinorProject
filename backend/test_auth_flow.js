// ============================================================================
// Departmental ERP - Auth & RBAC Verification Test (Using native Axios)
// ============================================================================

process.env.NODE_ENV = 'test';
require('dotenv').config({ path: __dirname + '/.env' });
const axios = require('axios');
const http = require('http');
const { app } = require('./src/server');
const { prisma } = require('./src/config/postgres');

async function testAuthPipeline() {
  console.log('Testing Rebuilt Authentication & RBAC System...\n');

  // Start temporary server for testing
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, '127.0.0.1', resolve));
  const baseUrl = 'http://127.0.0.1:5099/api';

  try {
    // Test 1: Admin Login
    console.log('1. Testing Admin Login...');
    const adminLoginRes = await axios.post(`${baseUrl}/auth/login`, {
      email: 'admin@college.edu',
      password: 'Admin@123'
    });

    if (adminLoginRes.status === 200 && adminLoginRes.data.token) {
      console.log('  ✓ Admin login succeeded. Role:', adminLoginRes.data.user.role);
    } else {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
    }
    const adminToken = adminLoginRes.data.token;

    // Test 2: Verify /api/auth/me with Admin Token
    console.log('2. Testing /api/auth/me with Admin Token...');
    const meRes = await axios.get(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (meRes.status === 200 && meRes.data.user.email === 'admin@college.edu') {
      console.log('  ✓ /api/auth/me returned correct PostgreSQL user:', meRes.data.user.name, `(${meRes.data.user.role})`);
    } else {
      throw new Error(`/api/auth/me failed: ${JSON.stringify(meRes.data)}`);
    }

    // Test 3: Student Registration
    console.log('3. Testing Student Registration...');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const studentData = {
      email: `teststudent${rand}@college.edu`,
      password: 'Password@123',
      name: 'Rahul Sharma',
      enrollmentNo: `0187CS231${rand}`,
      semester: 5,
      departmentCode: 'CSE',
      sectionName: 'A'
    };

    const regStudentRes = await axios.post(`${baseUrl}/auth/register/student`, studentData);
    if (regStudentRes.status === 201 && regStudentRes.data.token) {
      console.log('  ✓ Student registered in PostgreSQL. Student ID:', regStudentRes.data.user.studentId);
    } else {
      throw new Error(`Student registration failed: ${JSON.stringify(regStudentRes.data)}`);
    }
    const studentToken = regStudentRes.data.token;

    // Test 4: Student Login
    console.log('4. Testing Student Login...');
    const studentLoginRes = await axios.post(`${baseUrl}/auth/login`, {
      email: studentData.email,
      password: studentData.password
    });

    if (studentLoginRes.status === 200 && studentLoginRes.data.user.role === 'STUDENT') {
      console.log('  ✓ Student login succeeded. Role:', studentLoginRes.data.user.role);
    } else {
      throw new Error(`Student login failed: ${JSON.stringify(studentLoginRes.data)}`);
    }

    // Test 5: Verify Student Session via /api/auth/me
    console.log('5. Testing Student Session via /api/auth/me...');
    const studentMeRes = await axios.get(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (studentMeRes.status === 200 && studentMeRes.data.user.role === 'STUDENT') {
      console.log('  ✓ Student session verified! Name:', studentMeRes.data.user.name, 'Department:', studentMeRes.data.user.departmentCode);
    } else {
      throw new Error(`Student /api/auth/me failed: ${JSON.stringify(studentMeRes.data)}`);
    }

    // Test 6: Teacher Registration
    console.log('6. Testing Teacher Registration...');
    const teacherData = {
      email: `testfaculty${rand}@college.edu`,
      password: 'Password@123',
      name: 'Dr. Priya Mehta',
      employeeId: `EMPCS${rand}`,
      designation: 'Associate Professor',
      departmentCode: 'CSE',
      isTG: true
    };

    const regTeacherRes = await axios.post(`${baseUrl}/auth/register/teacher`, teacherData);
    if (regTeacherRes.status === 201 && regTeacherRes.data.token) {
      console.log('  ✓ Teacher registered in PostgreSQL. Effective Role:', regTeacherRes.data.user.role, 'isTG:', regTeacherRes.data.user.isTG);
    } else {
      throw new Error(`Teacher registration failed: ${JSON.stringify(regTeacherRes.data)}`);
    }

    // Test 7: Invalid Password Rejection
    console.log('7. Testing Invalid Password Rejection...');
    try {
      await axios.post(`${baseUrl}/auth/login`, {
        email: studentData.email,
        password: 'IncorrectPassword'
      });
      throw new Error('Expected 401 for incorrect password!');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('  ✓ Incorrect password rejected with 401 Unauthorized.');
      } else {
        throw err;
      }
    }

    // Test 8: Protected Route Without Token
    console.log('8. Testing Protected Route Without Token...');
    try {
      await axios.get(`${baseUrl}/auth/me`);
      throw new Error('Expected 401 for missing token!');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('  ✓ Protected route without token rejected with 401 Unauthorized.');
      } else {
        throw err;
      }
    }

    console.log('\n========================================================');
    console.log('  ✓ ALL AUTHENTICATION & RBAC TESTS PASSED SUCCESSFULLY  ');
    console.log('========================================================\n');

    // Clean up test users
    await prisma.student.deleteMany({ where: { email: studentData.email } });
    await prisma.teacher.deleteMany({ where: { email: teacherData.email } });
    await prisma.user.deleteMany({ where: { email: { in: [studentData.email, teacherData.email] } } });
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testAuthPipeline().catch(err => {
  console.error('Test pipeline error:', err.message);
  process.exit(1);
});

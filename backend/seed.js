// ============================================================================
// Departmental ERP - Baseline System Seed
// Seeds essential roles, default department, academic session, semesters, sections,
// initial Admin, and initial HOD account with profile.
// ============================================================================

require('dotenv').config({ path: __dirname + '/.env' });
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding baseline ERP system records...');

  // 1. Mandatory Roles
  const roles = [
    { name: 'ADMIN', description: 'System Administrator' },
    { name: 'HOD', description: 'Head of Department' },
    { name: 'TEACHER', description: 'Faculty / Teacher' },
    { name: 'TG', description: 'Tutor Guardian Faculty' },
    { name: 'STUDENT', description: 'Department Student' }
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r
    });
  }
  console.log('✓ Roles seeded: ADMIN, HOD, TEACHER, TG, STUDENT');

  // 2. Default Department: CSE
  const cseDept = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: {
      code: 'CSE',
      name: 'Computer Science & Engineering',
      description: 'Department of Computer Science & Engineering'
    }
  });
  console.log('✓ Default Department seeded: CSE');

  // 3. Academic Session: 2026-27
  await prisma.academicSession.upsert({
    where: { name: '2026-27' },
    update: {},
    create: {
      name: '2026-27',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2027-06-30'),
      isCurrent: true
    }
  });
  console.log('✓ Academic Session seeded: 2026-27');

  // 4. Semesters 1 through 8
  const semesterMap = {};
  for (let sem = 1; sem <= 8; sem++) {
    const s = await prisma.semester.upsert({
      where: {
        departmentId_semesterNumber_academicYear: {
          departmentId: cseDept.id,
          semesterNumber: sem,
          academicYear: '2026-27'
        }
      },
      update: {},
      create: {
        departmentId: cseDept.id,
        semesterNumber: sem,
        academicYear: '2026-27'
      }
    });
    semesterMap[sem] = s;
  }
  console.log('✓ Semesters 1-8 seeded for CSE');

  // 5. Sections A, B, C for each semester
  const sectionNames = ['A', 'B', 'C'];
  for (let sem = 1; sem <= 8; sem++) {
    const semester = semesterMap[sem];
    for (const secName of sectionNames) {
      await prisma.section.upsert({
        where: {
          departmentId_name_academicYear_semesterId: {
            departmentId: cseDept.id,
            name: secName,
            academicYear: '2026-27',
            semesterId: semester.id
          }
        },
        update: {},
        create: {
          departmentId: cseDept.id,
          semesterId: semester.id,
          name: secName,
          academicYear: '2026-27',
          capacity: 60
        }
      });
    }
  }
  console.log('✓ Sections A, B, C seeded across Semesters 1-8');

  // 6. Default Admin User
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (adminRole) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@college.edu';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          name: 'System Administrator',
          email: adminEmail,
          passwordHash,
          roleId: adminRole.id,
          departmentId: cseDept.id,
          isActive: true
        }
      });
      console.log(`✓ Admin user created (${adminEmail})`);
    } else {
      console.log(`✓ Admin user exists (${adminEmail})`);
    }
  }

  // 7. Default HOD User & Profile
  const hodRole = await prisma.role.findUnique({ where: { name: 'HOD' } });
  if (hodRole) {
    const hodEmail = 'hod.cse@college.edu';
    const hodPassword = 'password123';
    const passwordHash = await bcrypt.hash(hodPassword, 10);

    let hodUser = await prisma.user.findUnique({ where: { email: hodEmail } });
    if (!hodUser) {
      hodUser = await prisma.user.create({
        data: {
          name: 'Dr. Alok Verma',
          email: hodEmail,
          passwordHash,
          roleId: hodRole.id,
          departmentId: cseDept.id,
          isActive: true
        }
      });
      console.log(`✓ HOD user created (${hodEmail})`);
    } else {
      console.log(`✓ HOD user exists (${hodEmail})`);
    }

    // Teacher profile for HOD
    let hodTeacher = await prisma.teacher.findUnique({ where: { email: hodEmail } });
    if (!hodTeacher) {
      hodTeacher = await prisma.teacher.create({
        data: {
          userId: hodUser.id,
          employeeId: 'EMP-CSE-001',
          firstName: 'Alok',
          lastName: 'Verma',
          email: hodEmail,
          phone: '+91 98260 11223',
          designation: 'Professor & Head (HOD)',
          departmentId: cseDept.id,
          isTG: false,
          status: 'ACTIVE'
        }
      });
      console.log(`✓ HOD Teacher profile created (${hodTeacher.employeeId})`);
    }

    // HOD Assignment
    const existingHodRecord = await prisma.hOD.findFirst({
      where: { teacherId: hodTeacher.id, departmentId: cseDept.id }
    });
    if (!existingHodRecord) {
      await prisma.hOD.create({
        data: {
          teacherId: hodTeacher.id,
          departmentId: cseDept.id,
          isCurrent: true
        }
      });
      console.log(`✓ HOD assignment record created for CSE department`);
    }
  }

  console.log('System baseline seed completed successfully.');
  await prisma.$disconnect();
}

if (require.main === module) {
  seed().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}

module.exports = seed;

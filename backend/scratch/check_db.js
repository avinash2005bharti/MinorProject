const { prisma } = require('../src/config/postgres');

async function check() {
  try {
    const users = await prisma.user.findMany({
      include: { role: true }
    });
    console.log('USERS count:', users.length);
    console.log('USERS sample:', users.map(u => ({ id: u.id, email: u.email, role: u.role.name })));

    const teachers = await prisma.teacher.findMany({
      include: {
        department: true,
        tgSections: { include: { semester: true } },
        mentorStudents: true
      }
    });
    console.log('TEACHERS count:', teachers.length);
    console.log('TEACHERS:', JSON.stringify(teachers.map(t => ({
      id: t.id,
      userId: t.userId,
      name: `${t.firstName} ${t.lastName || ''}`,
      email: t.email,
      isTG: t.isTG,
      department: t.department?.code,
      tgSections: t.tgSections.map(s => ({ id: s.id, name: s.name, sem: s.semester?.semesterNumber })),
      menteeCount: t.mentorStudents.length
    })), null, 2));

    const students = await prisma.student.findMany({
      take: 10,
      include: { section: true, tutorGuardian: true }
    });
    console.log('STUDENTS sample:', JSON.stringify(students.map(s => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName || ''}`,
      rollNo: s.rollNo,
      enrollmentNo: s.enrollmentNo,
      semester: s.semester,
      section: s.section?.name,
      tg: s.tutorGuardian?.firstName
    })), null, 2));

    const totalStudents = await prisma.student.count();
    console.log('Total students:', totalStudents);

    const attendances = await prisma.attendanceRecord.count();
    console.log('Total attendance records:', attendances);

    const leaves = await prisma.leaveApplication.count();
    console.log('Total leave applications:', leaves);

    const considerations = await prisma.attendanceConsiderationRequest.count();
    console.log('Total consideration requests:', considerations);

    const corrections = await prisma.attendanceCorrectionRequest.count();
    console.log('Total correction requests:', corrections);

    const timetableSlots = await prisma.timetableSlot.count();
    console.log('Total timetable slots:', timetableSlots);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();

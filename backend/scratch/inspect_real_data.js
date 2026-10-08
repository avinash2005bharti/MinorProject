const { prisma } = require('../src/config/postgres');

async function inspectRealData() {
  const teacher = await prisma.teacher.findFirst({
    where: { isTG: true, tgSections: { some: {} } }
  });

  const students = await prisma.student.findMany({
    where: { tgTeacherId: teacher.id },
    include: { section: true }
  });

  console.log(`Found ${students.length} mentees for TG ${teacher.firstName} ${teacher.lastName}`);

  const studentIds = students.map(s => s.id);
  const records = await prisma.attendanceRecord.findMany({
    where: { studentId: { in: studentIds } },
    include: { attendance: true }
  });

  console.log(`Found ${records.length} total attendance records for these mentees`);

  const studentStats = {};
  for (const s of students) {
    studentStats[s.id] = { rollNo: s.rollNo, name: s.firstName + ' ' + (s.lastName || ''), total: 0, present: 0 };
  }

  for (const r of records) {
    if (studentStats[r.studentId]) {
      studentStats[r.studentId].total++;
      if (r.status === 'PRESENT' || r.status === 'LATE' || r.status === 'Present') {
        studentStats[r.studentId].present++;
      }
    }
  }

  const rates = Object.values(studentStats).map(s => {
    const rate = s.total > 0 ? (s.present / s.total) * 100 : 0;
    return { ...s, rate: Math.round(rate * 10) / 10 };
  });

  console.log('Sample student attendance rates (first 10):');
  console.table(rates.slice(0, 10));

  // Check distribution from actual rates
  const dist = {
    excellent: rates.filter(s => s.rate >= 90).length,
    good: rates.filter(s => s.rate >= 75 && s.rate < 90).length,
    low: rates.filter(s => s.rate >= 60 && s.rate < 75).length,
    critical: rates.filter(s => s.rate < 60).length
  };
  console.log('Actual attendance distribution from DB records:', dist);

  const avgAttendance = rates.length > 0
    ? rates.reduce((sum, s) => sum + s.rate, 0) / rates.length
    : 0;
  console.log('Actual average attendance across mentees:', avgAttendance.toFixed(1) + '%');

  // Check real requests in DB for these students
  const leaves = await prisma.leaveApplication.findMany({
    where: { studentId: { in: studentIds } }
  });
  console.log('Real leaves for mentees:', leaves.length, leaves.map(l => ({ id: l.id, status: l.status, type: l.leaveType })));

  const considerations = await prisma.attendanceConsiderationRequest.findMany({
    where: { studentId: { in: studentIds } }
  });
  console.log('Real considerations for mentees:', considerations.length, considerations.map(c => ({ id: c.id, status: c.status, category: c.category })));

  const corrections = await prisma.attendanceCorrectionRequest.findMany({
    where: { studentId: { in: studentIds } }
  });
  console.log('Real corrections for mentees:', corrections.length, corrections.map(c => ({ id: c.id, status: c.status })));

  // Check notices in DB
  const notices = await prisma.notification.findMany();
  console.log('Real notifications in DB:', notices.length, notices.map(n => ({ id: n.id, title: n.title, role: n.recipientRole })));

  await prisma.$disconnect();
}

inspectRealData();

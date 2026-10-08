const { prisma } = require('../src/config/postgres');
const dashboardController = require('../src/controllers/dashboardController');

async function testTg() {
  // Find the TG teacher
  const teacher = await prisma.teacher.findFirst({
    where: { isTG: true, tgSections: { some: {} } }
  });
  console.log('Using TG teacher:', teacher?.firstName, teacher?.lastName, 'ID:', teacher?.id, 'UserID:', teacher?.userId);

  const req = {
    user: {
      id: teacher.userId,
      teacherId: teacher.id,
      role: 'tg',
      name: `${teacher.firstName} ${teacher.lastName}`
    },
    query: {}
  };

  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      console.log('Status code:', this.statusCode);
      console.log('Keys in data:', Object.keys(data.data || {}));
      console.log('Mentor info:', JSON.stringify(data.data?.mentor, null, 2));
      console.log('Stats:', {
        totalMentees: data.data?.totalMentees,
        averageAttendance: data.data?.averageAttendance,
        academicAverage: data.data?.academicAverage,
        attentionCount: data.data?.studentsNeedingAttention?.length,
        distribution: data.data?.distribution,
        health: data.data?.studentHealth,
        pendingActions: data.data?.pendingActions
      });
      console.log('First 2 attention students:', JSON.stringify(data.data?.studentsNeedingAttention?.slice(0, 2), null, 2));
      console.log('Today schedule count:', data.data?.todaySchedule?.length);
      console.log('Today section attendance:', data.data?.todaySectionAttendance);
    }
  };

  await dashboardController.getTgDashboard(req, res);
  await prisma.$disconnect();
}

testTg();

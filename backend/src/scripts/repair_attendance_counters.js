const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function repairAttendanceCounters() {
  console.log('Repairing Attendance session counters...');
  try {
    const sessions = await prisma.attendance.findMany();
    let repairedCount = 0;

    for (const session of sessions) {
      const totalStudents = await prisma.attendanceRecord.count({
        where: { attendanceId: session.id }
      });
      const presentCount = await prisma.attendanceRecord.count({
        where: {
          attendanceId: session.id,
          status: { in: ['PRESENT', 'Present', 'LATE', 'Late'] }
        }
      });
      const absentCount = totalStudents - presentCount;

      if (
        session.totalStudents !== totalStudents ||
        session.presentCount !== presentCount ||
        session.absentCount !== absentCount
      ) {
        console.log(
          `Repairing session ${session.id}: total ${session.totalStudents}->${totalStudents}, present ${session.presentCount}->${presentCount}, absent ${session.absentCount}->${absentCount}`
        );
        await prisma.attendance.update({
          where: { id: session.id },
          data: {
            totalStudents,
            presentCount,
            absentCount
          }
        });
        repairedCount++;
      }
    }

    console.log(`Repaired ${repairedCount} out of ${sessions.length} attendance sessions.`);
  } catch (error) {
    console.error('Error repairing attendance counters:', error);
  } finally {
    await prisma.$disconnect();
  }
}

repairAttendanceCounters();

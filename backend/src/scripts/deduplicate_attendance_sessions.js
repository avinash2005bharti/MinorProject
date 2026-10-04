const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deduplicateAttendanceSessions() {
  console.log('Checking for duplicate Attendance sessions...');
  try {
    const allSessions = await prisma.attendance.findMany({
      include: {
        records: true
      },
      orderBy: { createdAt: 'asc' }
    });

    const sessionGroups = new Map();

    for (const session of allSessions) {
      const dateStr = session.date instanceof Date ? session.date.toISOString().split('T')[0] : String(session.date);
      const key = `${session.subjectId}_${dateStr}_${session.periodNumber || 1}_${session.sectionId || 'null'}`;
      if (!sessionGroups.has(key)) {
        sessionGroups.set(key, []);
      }
      sessionGroups.get(key).push(session);
    }

    let mergedCount = 0;

    for (const [key, sessions] of sessionGroups.entries()) {
      if (sessions.length > 1) {
        console.log(`Found duplicate sessions for key ${key}: ${sessions.length} sessions.`);
        const primarySession = sessions[0];
        const duplicates = sessions.slice(1);

        for (const dup of duplicates) {
          console.log(`Merging duplicate session ${dup.id} into primary session ${primarySession.id}...`);
          for (const record of dup.records) {
            // Check if record for this student already exists in primary
            const existingInPrimary = await prisma.attendanceRecord.findUnique({
              where: {
                attendanceId_studentId: {
                  attendanceId: primarySession.id,
                  studentId: record.studentId
                }
              }
            });

            if (!existingInPrimary) {
              await prisma.attendanceRecord.update({
                where: { id: record.id },
                data: { attendanceId: primarySession.id }
              });
            } else {
              // Delete redundant record
              await prisma.attendanceRecord.delete({
                where: { id: record.id }
              });
            }
          }

          // Delete duplicate session
          await prisma.attendance.delete({
            where: { id: dup.id }
          });
          mergedCount++;
        }

        // Recompute primary session counts
        const total = await prisma.attendanceRecord.count({ where: { attendanceId: primarySession.id } });
        const present = await prisma.attendanceRecord.count({
          where: { attendanceId: primarySession.id, status: { in: ['PRESENT', 'Present', 'LATE', 'Late'] } }
        });
        await prisma.attendance.update({
          where: { id: primarySession.id },
          data: {
            totalStudents: total,
            presentCount: present,
            absentCount: total - present
          }
        });
      }
    }

    console.log(`Deduplication complete. Merged ${mergedCount} duplicate sessions.`);
  } catch (error) {
    console.error('Error during attendance deduplication:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deduplicateAttendanceSessions();

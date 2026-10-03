// ============================================================================
// PostgreSQL Prisma Attendance Service
// Single Source of Truth for Attendance Sessions, Records, and Queries
// ============================================================================

const { prisma } = require('../../config/postgres');

class PostgresAttendanceService {
  async createSession({ sectionId, subjectId, teacherId, date, startTime, endTime, period, qrToken }) {
    return prisma.attendanceSession.create({
      data: {
        sectionId,
        subjectId,
        teacherId,
        date: new Date(date),
        startTime: startTime ? new Date(`1970-01-01T${startTime}`) : null,
        endTime: endTime ? new Date(`1970-01-01T${endTime}`) : null,
        period: period || 1,
        qrToken,
        status: 'OPEN'
      }
    });
  }

  async markAttendanceBatch(sessionId, studentStatusList, markedBy = 'Teacher') {
    const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error('Attendance session not found.');

    const operations = studentStatusList.map(item => {
      return prisma.attendanceRecord.upsert({
        where: {
          uq_session_student: {
            sessionId,
            studentId: item.studentId
          }
        },
        create: {
          sessionId,
          studentId: item.studentId,
          status: item.status || 'PRESENT',
          markedBy,
          remarks: item.remarks || null
        },
        update: {
          status: item.status || 'PRESENT',
          markedBy,
          remarks: item.remarks || null
        }
      });
    });

    return prisma.$transaction(operations);
  }

  async getStudentRecords(studentId, { subjectId, startDate, endDate } = {}) {
    const where = { studentId };
    if (startDate || endDate) {
      where.session = {
        date: {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate) } : {})
        }
      };
    }
    if (subjectId) {
      where.session = {
        ...where.session,
        subjectId
      };
    }

    return prisma.attendanceRecord.findMany({
      where,
      include: {
        session: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            teacher: { select: { id: true, firstName: true, lastName: true } }
          }
        }
      },
      orderBy: { markedAt: 'desc' }
    });
  }

  // Attendance Corrections
  async createCorrectionRequest({ studentId, attendanceRecordId, requestedStatus, reason, evidenceUrl }) {
    return prisma.attendanceCorrectionRequest.create({
      data: {
        studentId,
        attendanceRecordId,
        requestedStatus: requestedStatus || 'PRESENT',
        reason,
        evidenceUrl,
        status: 'PENDING'
      }
    });
  }

  async reviewCorrectionRequest(requestId, { status, reviewedBy, reviewedRole, reviewComment }) {
    const correction = await prisma.attendanceCorrectionRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedBy,
        reviewedRole,
        reviewComment,
        reviewedAt: new Date()
      }
    });

    // If approved, update underlying record
    if (status === 'APPROVED' && correction.attendanceRecordId) {
      await prisma.attendanceRecord.update({
        where: { id: correction.attendanceRecordId },
        data: { status: correction.requestedStatus, remarks: `Corrected: ${reviewComment || 'Approved'}` }
      });
    }

    return correction;
  }

  // Attendance Considerations
  async createConsiderationRequest({ studentId, startDate, endDate, reason, requestedPercentage, category, supportingDoc }) {
    return prisma.attendanceConsiderationRequest.create({
      data: {
        studentId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        requestedPercentage,
        category: category || 'Hackathon / Project Competition',
        supportingDoc,
        status: 'PENDING'
      }
    });
  }
}

module.exports = new PostgresAttendanceService();

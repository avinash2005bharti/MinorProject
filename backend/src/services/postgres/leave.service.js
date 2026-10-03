// ============================================================================
// PostgreSQL Prisma Leave Service
// Single Source of Truth for Student Leave Requests and Multi-stage Approvals
// ============================================================================

const { prisma } = require('../../config/postgres');

class PostgresLeaveService {
  async createLeave({ studentId, startDate, endDate, reason, leaveType = 'SICK', supportingDoc }) {
    // Find student's assigned TG
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        mentorAssignments: {
          include: { mentorGroup: true }
        }
      }
    });

    const tgId = student?.mentorAssignments[0]?.mentorGroup?.teacherId || null;

    return prisma.leaveRequest.create({
      data: {
        studentId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        leaveType,
        supportingDoc,
        status: 'PENDING',
        currentApproverRole: 'TG',
        tgId
      }
    });
  }

  async getStudentLeaves(studentId) {
    return prisma.leaveRequest.findMany({
      where: { studentId },
      include: {
        tgTeacher: { select: { firstName: true, lastName: true } },
        hodTeacher: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getTgPendingLeaves(tgTeacherId) {
    return prisma.leaveRequest.findMany({
      where: {
        tgId: tgTeacherId,
        status: 'PENDING',
        currentApproverRole: 'TG'
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, enrollmentNo: true, semester: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getHodPendingLeaves(departmentId) {
    return prisma.leaveRequest.findMany({
      where: {
        status: { in: ['TG_APPROVED', 'PENDING'] },
        currentApproverRole: 'HOD',
        student: { departmentId }
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, enrollmentNo: true, semester: true }
        },
        tgTeacher: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async tgReview(id, { status, comment, tgId }) {
    const nextStatus = status === 'APPROVED' ? 'TG_APPROVED' : 'REJECTED';
    return prisma.leaveRequest.update({
      where: { id },
      data: {
        status: nextStatus,
        currentApproverRole: nextStatus === 'TG_APPROVED' ? 'HOD' : 'TG',
        reviewComment: comment,
        reviewedAt: new Date()
      }
    });
  }

  async hodReview(id, { status, comment, hodId }) {
    const finalStatus = status === 'APPROVED' ? 'HOD_APPROVED' : 'REJECTED';
    return prisma.leaveRequest.update({
      where: { id },
      data: {
        status: finalStatus,
        hodId,
        reviewComment: comment,
        reviewedAt: new Date()
      }
    });
  }
}

module.exports = new PostgresLeaveService();

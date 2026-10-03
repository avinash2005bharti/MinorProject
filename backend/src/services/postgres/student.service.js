// ============================================================================
// PostgreSQL Prisma Student Service
// Single Source of Truth for Student ERP Data
// ============================================================================

const { prisma } = require('../../config/postgres');

class PostgresStudentService {
  async getAll({ departmentId, semester, sectionId, search } = {}) {
    const where = {};

    if (departmentId) where.departmentId = departmentId;
    if (semester) where.semester = parseInt(semester, 10);
    if (sectionId) where.sectionId = sectionId;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { enrollmentNo: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
        mentorAssignments: {
          include: {
            mentorGroup: {
              include: {
                teacher: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } }
              }
            }
          }
        }
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
    });

    return students.map(s => ({
      ...s,
      name: `${s.firstName} ${s.lastName || ''}`.trim(),
      mentor: s.mentorAssignments[0]?.mentorGroup?.teacher
        ? `${s.mentorAssignments[0].mentorGroup.teacher.firstName} ${s.mentorAssignments[0].mentorGroup.teacher.lastName || ''}`.trim()
        : null
    }));
  }

  async getById(id) {
    if (!id) return null;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        department: true,
        section: true,
        user: { select: { id: true, email: true, role: true } },
        mentorAssignments: {
          include: {
            mentorGroup: {
              include: { teacher: true }
            }
          }
        }
      }
    });

    if (!student) return null;
    return {
      ...student,
      name: `${student.firstName} ${student.lastName || ''}`.trim()
    };
  }

  async getByEmail(email) {
    if (!email) return null;
    return prisma.student.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { department: true, section: true }
    });
  }

  async getByEnrollmentNo(enrollmentNo) {
    if (!enrollmentNo) return null;
    return prisma.student.findUnique({
      where: { enrollmentNo: enrollmentNo.trim().toUpperCase() },
      include: { department: true, section: true }
    });
  }

  async create(data) {
    const { firstName, lastName, email, enrollmentNo, rollNo, phone, semester, departmentId, sectionId, admissionYear } = data;
    return prisma.student.create({
      data: {
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        enrollmentNo: enrollmentNo.trim().toUpperCase(),
        rollNo,
        phone,
        semester: semester ? parseInt(semester, 10) : 5,
        departmentId,
        sectionId,
        admissionYear: admissionYear ? parseInt(admissionYear, 10) : 2023
      }
    });
  }

  async update(id, data) {
    return prisma.student.update({
      where: { id },
      data
    });
  }

  async getAttendancePercentage(studentId) {
    const totalRecords = await prisma.attendanceRecord.count({ where: { studentId } });
    if (totalRecords === 0) return 0;
    const presentRecords = await prisma.attendanceRecord.count({
      where: { studentId, status: { in: ['PRESENT', 'Present', 'LATE', 'Late'] } }
    });
    return Math.round((presentRecords / totalRecords) * 100);
  }
}

module.exports = new PostgresStudentService();

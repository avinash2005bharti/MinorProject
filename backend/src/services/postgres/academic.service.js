// ============================================================================
// PostgreSQL Prisma Academic Service
// Single Source of Truth for Departments, Programs, Semesters, Sections, Subjects
// ============================================================================

const { prisma } = require('../../config/postgres');

class PostgresAcademicService {
  async getDepartments() {
    return prisma.department.findMany({
      include: {
        _count: {
          select: {
            teachers: true,
            students: true,
            sections: true,
            subjects: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getDepartmentById(id) {
    return prisma.department.findUnique({
      where: { id },
      include: {
        programs: true,
        sections: true,
        hods: { where: { isCurrent: true }, include: { teacher: true } }
      }
    });
  }

  async getSections(departmentId) {
    const where = departmentId ? { departmentId } : {};
    return prisma.section.findMany({
      where,
      include: {
        department: { select: { id: true, code: true, name: true } },
        semester: { select: { id: true, semesterNumber: true } },
        _count: { select: { students: true } }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getSubjects({ departmentId, semester } = {}) {
    const where = {};
    if (departmentId) where.departmentId = departmentId;
    if (semester) where.semester = parseInt(semester, 10);

    return prisma.subject.findMany({
      where,
      include: {
        department: { select: { id: true, code: true, name: true } },
        teacherAssignments: {
          include: {
            teacher: { select: { id: true, firstName: true, lastName: true } }
          }
        }
      },
      orderBy: [{ semester: 'asc' }, { code: 'asc' }]
    });
  }

  async getRooms() {
    return prisma.room.findMany({
      orderBy: { roomNumber: 'asc' }
    });
  }

  async getAcademicYears() {
    return prisma.academicYear.findMany({
      orderBy: { startDate: 'desc' }
    });
  }
}

module.exports = new PostgresAcademicService();

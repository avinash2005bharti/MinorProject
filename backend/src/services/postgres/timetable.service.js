// ============================================================================
// PostgreSQL Prisma Timetable Service
// Single Source of Truth for Department Schedules, Versions, and Collisions
// ============================================================================

const { prisma } = require('../../config/postgres');

class PostgresTimetableService {
  async getEntries({ sectionId, teacherId, dayOfWeek, semester, versionId } = {}) {
    const where = {};
    if (sectionId) where.sectionId = sectionId;
    if (teacherId) where.teacherId = teacherId;
    if (dayOfWeek) where.dayOfWeek = parseInt(dayOfWeek, 10);
    if (semester) where.semester = parseInt(semester, 10);
    if (versionId) where.timetableVersion = versionId;

    return prisma.timetableEntry.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, code: true, credits: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        room: { select: { id: true, roomNumber: true, building: true } },
        section: { select: { id: true, name: true } }
      },
      orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }, { startTime: 'asc' }]
    });
  }

  async getActiveVersion(departmentId) {
    return prisma.timetableVersion.findFirst({
      where: {
        departmentId,
        status: { in: ['ACTIVE', 'Active', 'Approved', 'APPROVED'] }
      },
      include: {
        entries: {
          include: {
            subject: true,
            teacher: true,
            room: true,
            section: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createVersion({ departmentId, generatedBy = 'AI Agent', reason = 'Regular Semester Schedule', status = 'DRAFT' }) {
    return prisma.timetableVersion.create({
      data: {
        departmentId,
        generatedBy,
        reason,
        status
      }
    });
  }

  async addEntry(data) {
    const { sectionId, subjectId, teacherId, roomId, dayOfWeek, day, period, startTime, endTime, academicYear, semester, timetableVersion, type } = data;
    return prisma.timetableEntry.create({
      data: {
        sectionId,
        subjectId,
        teacherId,
        roomId,
        dayOfWeek: parseInt(dayOfWeek, 10),
        day: day || 'Monday',
        period: period ? parseInt(period, 10) : 1,
        startTime: new Date(`1970-01-01T${startTime}`),
        endTime: new Date(`1970-01-01T${endTime}`),
        academicYear: academicYear || '2026-27',
        semester: semester ? parseInt(semester, 10) : 5,
        timetableVersion,
        type: type || 'Lecture'
      }
    });
  }

  async checkCollisions({ teacherId, roomId, sectionId, dayOfWeek, startTime, endTime, excludeEntryId }) {
    const collisions = [];
    const parsedDay = parseInt(dayOfWeek, 10);
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);

    const baseWhere = {
      dayOfWeek: parsedDay,
      ...(excludeEntryId ? { id: { not: excludeEntryId } } : {}),
      OR: [
        { startTime: { lt: end }, endTime: { gt: start } }
      ]
    };

    if (teacherId) {
      const teacherConflict = await prisma.timetableEntry.findFirst({
        where: { ...baseWhere, teacherId },
        include: { teacher: true, subject: true }
      });
      if (teacherConflict) {
        collisions.push({
          type: 'TEACHER_COLLISION',
          message: `Teacher ${teacherConflict.teacher.firstName} is already assigned to ${teacherConflict.subject.name} at this time.`
        });
      }
    }

    if (roomId) {
      const roomConflict = await prisma.timetableEntry.findFirst({
        where: { ...baseWhere, roomId },
        include: { room: true }
      });
      if (roomConflict) {
        collisions.push({
          type: 'ROOM_COLLISION',
          message: `Room ${roomConflict.room.roomNumber} is already booked at this time.`
        });
      }
    }

    return collisions;
  }
}

module.exports = new PostgresTimetableService();

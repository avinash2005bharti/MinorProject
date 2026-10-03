// ============================================================================
// Departmental ERP - Academic Controller (Curriculum & Academic Structure)
// Canonical Source of Truth: PostgreSQL via Prisma
// ============================================================================

const { prisma } = require('../config/postgres');
const { logger } = require('../services/loggerService');

// 1. Get CSE Department Academic Hierarchy
exports.getCseHierarchy = async (req, res) => {
  try {
    const [sections, subjects] = await Promise.all([
      prisma.section.findMany({
        include: { semester: true },
        orderBy: { name: 'asc' }
      }),
      prisma.subject.findMany({
        orderBy: [{ semester: 'asc' }, { code: 'asc' }]
      })
    ]);

    const getSemSections = (sem) =>
      sections
        .filter((s) => s.semester?.semesterNumber === sem)
        .map((s) => s.name);

    const years = [
      {
        year: '1st Year',
        semesters: [
          { semester: 1, sections: getSemSections(1), subjects: subjects.filter((s) => s.semester === 1) },
          { semester: 2, sections: getSemSections(2), subjects: subjects.filter((s) => s.semester === 2) }
        ]
      },
      {
        year: '2nd Year',
        semesters: [
          { semester: 3, sections: getSemSections(3), subjects: subjects.filter((s) => s.semester === 3) },
          { semester: 4, sections: getSemSections(4), subjects: subjects.filter((s) => s.semester === 4) }
        ]
      },
      {
        year: '3rd Year',
        semesters: [
          { semester: 5, sections: getSemSections(5), subjects: subjects.filter((s) => s.semester === 5) },
          { semester: 6, sections: getSemSections(6), subjects: subjects.filter((s) => s.semester === 6) }
        ]
      },
      {
        year: '4th Year',
        semesters: [
          { semester: 7, sections: getSemSections(7), subjects: subjects.filter((s) => s.semester === 7) },
          { semester: 8, sections: getSemSections(8), subjects: subjects.filter((s) => s.semester === 8) }
        ]
      }
    ];

    return res.status(200).json({
      success: true,
      department: 'Computer Science & Engineering (CSE)',
      totalYears: 4,
      years
    });
  } catch (error) {
    logger.error(`[Academic Controller] Hierarchy error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get All Subjects
exports.getSubjects = async (req, res) => {
  try {
    const { semester } = req.query;
    const where = {};
    if (semester) where.semester = parseInt(semester, 10);

    const subjects = await prisma.subject.findMany({
      where,
      orderBy: [{ semester: 'asc' }, { code: 'asc' }]
    });

    return res.status(200).json({ success: true, count: subjects.length, subjects });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Create Subject
exports.createSubject = async (req, res) => {
  try {
    const code = (req.body.code || req.body.subjectCode || '').trim().toUpperCase();
    const name = (req.body.name || req.body.subjectName || '').trim();
    const semester = parseInt(req.body.semester || req.body.semesterNumber || req.body.sem, 10);
    const credits = parseInt(req.body.credits, 10) || 4;
    const weeklyHours = parseInt(req.body.weeklyHours || req.body.hours_per_week || req.body.weekly_hours, 10) || 4;
    const isElective = Boolean(req.body.isElective || req.body.is_elective || req.body.type === 'Elective' || req.body.type === 'ELECTIVE');

    if (!code || !name || !semester) {
      return res.status(400).json({ success: false, message: 'Subject code, name, and semester are required.' });
    }

    const dept = await prisma.department.findFirst();
    if (!dept) {
      return res.status(500).json({ success: false, message: 'Department record not found.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await prisma.subject.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return res.status(409).json({ success: false, message: `Subject with code ${cleanCode} already exists.` });
    }

    const subject = await prisma.subject.create({
      data: {
        code: cleanCode,
        name: name.trim(),
        departmentId: dept.id,
        semester: parseInt(semester, 10),
        credits: parseInt(credits, 10) || 4,
        weeklyHours: parseInt(weeklyHours, 10) || 4,
        isElective: Boolean(isElective)
      }
    });

    return res.status(201).json({ success: true, message: 'Subject added successfully.', subject });
  } catch (error) {
    logger.error(`[Academic Controller] createSubject error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update Subject
exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, semester, credits, weeklyHours, isElective } = req.body;

    const data = {};
    if (name) data.name = name.trim();
    if (semester !== undefined) data.semester = parseInt(semester, 10);
    if (credits !== undefined) data.credits = parseInt(credits, 10);
    if (weeklyHours !== undefined) data.weeklyHours = parseInt(weeklyHours, 10);
    if (isElective !== undefined) data.isElective = Boolean(isElective);

    const subject = await prisma.subject.update({
      where: { id },
      data
    });

    return res.status(200).json({ success: true, message: 'Subject updated successfully.', subject });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Delete Subject (Cascade cleanup of timetable slots, teacher mappings, attendance records)
exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const subject = await prisma.subject.findFirst({
      where: isUuid ? { id } : { code: { equals: id, mode: 'insensitive' } }
    });

    if (!subject) {
      return res.status(404).json({ success: false, message: `Subject '${id}' not found in curriculum.` });
    }

    const subjectId = subject.id;

    await prisma.$transaction(async (tx) => {
      // 1. Delete linked correction/consideration requests
      await tx.attendanceCorrectionRequest.deleteMany({ where: { subjectId } });
      await tx.attendanceConsiderationRequest.deleteMany({ where: { subjectId } });

      // 2. Delete attendance records for this subject
      const atts = await tx.attendance.findMany({
        where: { subjectId },
        select: { id: true }
      });
      if (atts.length > 0) {
        const attIds = atts.map(a => a.id);
        await tx.attendanceRecord.deleteMany({ where: { attendanceId: { in: attIds } } });
        await tx.attendance.deleteMany({ where: { id: { in: attIds } } });
      }

      // 3. Delete timetable slots
      await tx.timetableSlot.deleteMany({ where: { subjectId } });

      // 4. Delete teacher-subject assignments
      await tx.teacherSubject.deleteMany({ where: { subjectId } });

      // 5. Delete enrollments
      await tx.enrollment.deleteMany({ where: { subjectId } });

      // 6. Unlink document metadata if any
      await tx.documentMetadata.updateMany({
        where: { subjectId },
        data: { subjectId: null }
      });

      // 7. Delete the subject
      await tx.subject.delete({ where: { id: subjectId } });
    });

    return res.status(200).json({
      success: true,
      message: `Course ${subject.name} (${subject.code}) and related records deleted successfully.`
    });
  } catch (error) {
    logger.error(`[Academic Controller] deleteSubject error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get All Sections
exports.getSections = async (req, res) => {
  try {
    const sections = await prisma.section.findMany({
      include: { semester: true, department: true },
      orderBy: { name: 'asc' }
    });

    return res.status(200).json({
      success: true,
      count: sections.length,
      sections: sections.map((s) => ({
        id: s.id,
        name: s.name,
        section_name: s.name,
        semester: s.semester?.semesterNumber || 5,
        academicYear: s.academicYear,
        capacity: s.capacity
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Create Section
exports.createSection = async (req, res) => {
  try {
    const rawName = req.body.name || req.body.section_name || req.body.sectionName || '';
    const name = rawName.trim().toUpperCase();
    const semesterNumber = parseInt(req.body.semesterNumber || req.body.semester || req.body.sem, 10) || 5;
    const capacity = parseInt(req.body.capacity, 10) || 60;
    const academicYear = (req.body.academicYear || req.body.year || '2026-27').trim();

    if (!name) return res.status(400).json({ success: false, message: 'Section name is required.' });

    const dept = await prisma.department.findFirst();
    if (!dept) {
      return res.status(500).json({ success: false, message: 'Department record not found.' });
    }

    // Check or create semester
    let semester = await prisma.semester.findFirst({
      where: { departmentId: dept.id, semesterNumber: parseInt(semesterNumber, 10) }
    });
    if (!semester) {
      semester = await prisma.semester.create({
        data: { departmentId: dept.id, semesterNumber: parseInt(semesterNumber, 10), academicYear }
      });
    }

    const section = await prisma.section.create({
      data: {
        name,
        departmentId: dept.id,
        semesterId: semester.id,
        capacity: parseInt(capacity, 10) || 60,
        academicYear
      }
    });

    return res.status(201).json({ success: true, message: 'Section created successfully.', section });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Delete Section (Cascade cleanup of timetable, teacher assignments, and students)
exports.deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const section = await prisma.section.findFirst({
      where: isUuid ? { id } : { name: { equals: id, mode: 'insensitive' } }
    });

    if (!section) {
      return res.status(404).json({ success: false, message: `Section '${id}' not found.` });
    }

    const sectionId = section.id;

    await prisma.$transaction(async (tx) => {
      // 1. Detach enrolled students from this section
      await tx.student.updateMany({
        where: { sectionId },
        data: { sectionId: null }
      });

      // 2. Delete timetable slots
      await tx.timetableSlot.deleteMany({
        where: { sectionId }
      });

      // 3. Delete timetables
      await tx.timetable.deleteMany({
        where: { sectionId }
      });

      // 4. Delete teacher-subject assignments
      await tx.teacherSubject.deleteMany({
        where: { sectionId }
      });

      // 5. Clean up attendances and attendance records linked to this section
      const attendances = await tx.attendance.findMany({
        where: { sectionId },
        select: { id: true }
      });
      if (attendances.length > 0) {
        const attIds = attendances.map(a => a.id);
        await tx.attendanceRecord.deleteMany({
          where: { attendanceId: { in: attIds } }
        });
        await tx.attendance.deleteMany({
          where: { id: { in: attIds } }
        });
      }

      // 6. Delete the section
      await tx.section.delete({
        where: { id: sectionId }
      });
    });

    return res.status(200).json({
      success: true,
      message: `Section ${section.name} and related schedules successfully removed.`
    });
  } catch (error) {
    logger.error(`[Academic Controller] deleteSection error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

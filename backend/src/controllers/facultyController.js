// ============================================================================
// Departmental ERP - Faculty & Teacher Controller
// Canonical Source of Truth: PostgreSQL via Prisma
// ============================================================================

const bcrypt = require('bcryptjs');
const { prisma } = require('../config/postgres');
const { logger } = require('../services/loggerService');

// Format teacher record helper
const formatTeacher = (t) => {
  const isHod = (t.hodAssignments && t.hodAssignments.length > 0) || (t.user?.role?.name === 'HOD');
  const isTg = t.isTG || (t.user?.role?.name === 'TG');
  const name = `${t.firstName} ${t.lastName || ''}`.trim();

  return {
    ...t,
    name,
    isTG: isTg,
    isTg,
    isHOD: isHod,
    role: isTg ? 'tg' : (isHod ? 'hod' : 'teacher'),
    departmentName: t.department?.name || 'Computer Science & Engineering',
    departmentCode: t.department?.code || 'CSE'
  };
};

// 1. Get All Faculty
exports.getFaculty = async (req, res) => {
  try {
    const { search, designation } = req.query;
    const where = {};

    if (designation) where.designation = designation;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const teachers = await prisma.teacher.findMany({
      where,
      include: {
        department: true,
        user: { select: { id: true, email: true, role: true } },
        hodAssignments: { where: { isCurrent: true } }
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
    });

    const formattedList = teachers.map(formatTeacher);

    return res.status(200).json({
      success: true,
      count: formattedList.length,
      faculty: formattedList,
      data: formattedList
    });
  } catch (error) {
    logger.error(`[Faculty Controller] Error fetching faculty: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Single Faculty Member
exports.getFacultyById = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { id: id.length === 36 ? id : undefined },
          { employeeId: id.toUpperCase() },
          { email: id.toLowerCase() }
        ].filter(Boolean)
      },
      include: {
        department: true,
        user: { select: { id: true, email: true, role: true } },
        hodAssignments: { where: { isCurrent: true } },
        teacherSubjects: { include: { subject: true, section: true } }
      }
    });

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Faculty member not found in ERP records.' });
    }

    return res.status(200).json({ success: true, faculty: formatTeacher(teacher), data: formatTeacher(teacher) });
  } catch (error) {
    logger.error(`[Faculty Controller] Error fetching faculty ${req.params.id}: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Create Faculty
exports.createFaculty = async (req, res) => {
  try {
    const { name, email, employeeId, designation = 'Assistant Professor', phone, isTG = false, departmentCode = 'CSE' } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanEmpId = (employeeId || `EMP${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();

    const existing = await prisma.teacher.findFirst({
      where: { OR: [{ email: cleanEmail }, { employeeId: cleanEmpId }] }
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Teacher with this email or employee ID already exists.' });
    }

    const defaultDept = await prisma.department.findFirst();
    const teacherRole = await prisma.role.findFirst({ where: { name: isTG ? 'TG' : 'TEACHER' } });

    const passwordHash = await bcrypt.hash('Teacher@123', 10);
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] || 'Teacher';
    const lastName = parts.slice(1).join(' ') || '';

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          passwordHash,
          roleId: teacherRole.id,
          departmentId: defaultDept.id,
          isActive: true
        }
      });

      const newTeacher = await tx.teacher.create({
        data: {
          userId: newUser.id,
          employeeId: cleanEmpId,
          firstName,
          lastName,
          email: cleanEmail,
          phone: phone || null,
          designation,
          departmentId: defaultDept.id,
          isTG: Boolean(isTG),
          status: 'ACTIVE'
        },
        include: {
          department: true
        }
      });

      return newTeacher;
    });

    return res.status(201).json({
      success: true,
      message: 'Faculty member created successfully.',
      faculty: formatTeacher(result)
    });
  } catch (error) {
    logger.error(`[Faculty Controller] Error creating faculty: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update Faculty Member
exports.updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, designation, status, isTG } = req.body;

    const data = {};
    if (phone !== undefined) data.phone = phone;
    if (designation !== undefined) data.designation = designation;
    if (status !== undefined) data.status = status;
    if (isTG !== undefined) data.isTG = Boolean(isTG);

    if (name) {
      const parts = name.trim().split(/\s+/);
      data.firstName = parts[0];
      data.lastName = parts.slice(1).join(' ');
    }

    const updated = await prisma.teacher.update({
      where: { id },
      data,
      include: {
        department: true,
        user: true,
        hodAssignments: { where: { isCurrent: true } }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Faculty profile updated successfully.',
      faculty: formatTeacher(updated)
    });
  } catch (error) {
    logger.error(`[Faculty Controller] Error updating faculty ${req.params.id}: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Appoint as Tutor Guardian (TG)
exports.appointTg = async (req, res) => {
  try {
    const { id } = req.params;
    const { section, sectionName, academicYear } = req.body;

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true, department: true }
    });

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher record not found.' });
    }

    const updated = await prisma.teacher.update({
      where: { id },
      data: { isTG: true },
      include: { department: true }
    });

    // Update user role if user is linked
    if (teacher.userId) {
      const tgRole = await prisma.role.findUnique({ where: { name: 'TG' } });
      if (tgRole) {
        await prisma.user.update({
          where: { id: teacher.userId },
          data: { roleId: tgRole.id }
        });
      }
    }

    // Link TG to Section & its students
    const targetSectionName = (section || sectionName || '').trim().toUpperCase();
    if (targetSectionName) {
      const sec = await prisma.section.findFirst({
        where: {
          departmentId: teacher.departmentId,
          name: targetSectionName
        }
      });

      if (sec) {
        await prisma.section.update({
          where: { id: sec.id },
          data: { tgTeacherId: id }
        });

        // Update all students in that section
        await prisma.student.updateMany({
          where: { sectionId: sec.id },
          data: { tgTeacherId: id }
        });
      }
    }

    const { invalidateAuthUser } = require('../middleware/auth');
    if (updated?.userId) invalidateAuthUser(updated.userId);

    return res.status(200).json({
      success: true,
      message: `Teacher appointed as Tutor Guardian (TG)${targetSectionName ? ` for Section ${targetSectionName}` : ''}.`,
      faculty: formatTeacher(updated)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Remove TG Status
exports.removeTg = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true, department: true }
    });

    const updated = await prisma.teacher.update({
      where: { id },
      data: { isTG: false },
      include: { department: true }
    });

    if (teacher?.userId) {
      const teacherRole = await prisma.role.findUnique({ where: { name: 'TEACHER' } });
      if (teacherRole) {
        await prisma.user.update({
          where: { id: teacher.userId },
          data: { roleId: teacherRole.id }
        });
      }
    }

    // Unlink from sections and students
    await prisma.section.updateMany({
      where: { tgTeacherId: id },
      data: { tgTeacherId: null }
    });

    await prisma.student.updateMany({
      where: { tgTeacherId: id },
      data: { tgTeacherId: null }
    });

    const { invalidateAuthUser } = require('../middleware/auth');
    if (teacher?.userId) invalidateAuthUser(teacher.userId);

    return res.status(200).json({
      success: true,
      message: 'TG appointment revoked.',
      faculty: formatTeacher(updated)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
exports.revokeTg = exports.removeTg;

// 7. Delete Faculty
exports.deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      // 1. Unlink any students where this teacher is TG
      await tx.student.updateMany({
        where: { tgTeacherId: id },
        data: { tgTeacherId: null }
      });

      // 2. Unlink or remove teacher subjects
      await tx.teacherSubject.deleteMany({ where: { teacherId: id } });

      // 3. Clear timetable slots
      await tx.timetableSlot.deleteMany({ where: { teacherId: id } });

      // 4. Remove leave applications
      await tx.leaveApplication.deleteMany({ where: { teacherId: id } });

      // 5. Remove HOD assignment if exists
      await tx.hOD.deleteMany({ where: { teacherId: id } });

      // 6. Delete teacher record
      const teacher = await tx.teacher.delete({ where: { id } });

      // 7. Delete associated user if exists
      if (teacher.userId) {
        await tx.user.delete({ where: { id: teacher.userId } }).catch(() => {});
      }
    });

    return res.status(200).json({ success: true, message: 'Faculty member deleted successfully.' });
  } catch (error) {
    logger.error(`[Faculty Controller] Error deleting faculty ${req.params.id}: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

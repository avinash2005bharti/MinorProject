// ============================================================================
// Departmental ERP - Student Controller
// Canonical Source of Truth: PostgreSQL via Prisma
// ============================================================================

const bcrypt = require('bcryptjs');
const { prisma } = require('../config/postgres');
const { logger } = require('../services/loggerService');

// 1. Get All Students with Search, Semester/Section filter, and Pagination
exports.getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const skip = (page - 1) * limit;

    const { search, semester, section, status } = req.query;

    const where = {};
    if (semester) where.semester = parseInt(semester, 10);
    if (status) where.status = status;

    if (section) {
      where.section = { name: section.toUpperCase() };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { enrollmentNo: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: true,
          section: true,
          tutorGuardian: true,
          user: { select: { id: true, email: true, role: true } }
        },
        orderBy: { enrollmentNo: 'asc' }
      })
    ]);

    const formattedStudents = students.map((s) => ({
      ...s,
      name: `${s.firstName} ${s.lastName || ''}`.trim(),
      departmentName: s.department?.name || 'CSE',
      sectionName: s.section?.name || 'A',
      tgName: s.tutorGuardian ? `${s.tutorGuardian.firstName} ${s.tutorGuardian.lastName || ''}`.trim() : null
    }));

    return res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      students: formattedStudents
    });
  } catch (error) {
    logger.error(`[Student Controller] Error fetching students: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Single Student by ID or Enrollment No
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { id: id.length === 36 ? id : undefined },
          { enrollmentNo: id.toUpperCase() }
        ].filter(Boolean)
      },
      include: {
        department: true,
        section: true,
        tutorGuardian: true,
        user: { select: { id: true, email: true, role: true } }
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found in ERP database.' });
    }

    // Compute student attendance stats
    const totalRecords = await prisma.attendanceRecord.count({ where: { studentId: student.id } });
    const presentRecords = await prisma.attendanceRecord.count({
      where: { studentId: student.id, status: { in: ['PRESENT', 'Present'] } }
    });
    const attendancePct = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

    return res.status(200).json({
      success: true,
      student: {
        ...student,
        name: `${student.firstName} ${student.lastName || ''}`.trim(),
        attendancePercentage: attendancePct,
        totalClassesAttended: presentRecords,
        totalClassesConducted: totalRecords
      }
    });
  } catch (error) {
    logger.error(`[Student Controller] Error getting student ${req.params.id}: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Create Student
exports.createStudent = async (req, res) => {
  try {
    const {
      enrollment_no,
      enrollmentNo,
      rollNo,
      roll_no,
      name,
      firstName: inFirst,
      lastName: inLast,
      email,
      phone,
      semester,
      sectionName,
      section,
      sectionId: inSectionId,
      admissionYear,
      year,
      status
    } = req.body;

    const finalEnrollment = (enrollmentNo || enrollment_no || '').trim().toUpperCase();
    const finalRoll = (rollNo || roll_no || '').trim() || null;
    const finalEmail = (email || '').trim().toLowerCase();

    if (!finalEnrollment || (!name && !inFirst) || !finalEmail) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and enrollment number are required.'
      });
    }

    const existing = await prisma.student.findFirst({
      where: { OR: [{ enrollmentNo: finalEnrollment }, { email: finalEmail }] }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Student with this enrollment number or email already exists.'
      });
    }

    let firstName = inFirst ? inFirst.trim() : '';
    let lastName = inLast ? inLast.trim() : '';
    if (!firstName && name) {
      const parts = name.trim().split(/\s+/);
      firstName = parts[0] || 'Student';
      lastName = parts.slice(1).join(' ') || '';
    }

    const defaultDept = await prisma.department.findFirst();
    if (!defaultDept) {
      return res.status(500).json({ success: false, message: 'No department found in ERP database.' });
    }

    // Resolve section
    let resolvedSectionId = inSectionId || null;
    const secTargetName = (sectionName || section || '').trim().toUpperCase();
    if (!resolvedSectionId && secTargetName) {
      const sec = await prisma.section.findFirst({
        where: { departmentId: defaultDept.id, name: secTargetName }
      });
      if (sec) resolvedSectionId = sec.id;
    }

    const finalAdmissionYear = parseInt(admissionYear || year, 10) || new Date().getFullYear();
    const finalSemester = parseInt(semester, 10) || 5;

    // Transactionally create or link User + Student
    const student = await prisma.$transaction(async (tx) => {
      let userId = null;
      const existingUser = await tx.user.findUnique({ where: { email: finalEmail } });
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const studentRole = await tx.role.findFirst({
          where: { name: { equals: 'STUDENT', mode: 'insensitive' } }
        });
        if (studentRole) {
          const passwordHash = await bcrypt.hash('Student@123', 10);
          const newUser = await tx.user.create({
            data: {
              name: `${firstName} ${lastName}`.trim(),
              email: finalEmail,
              passwordHash,
              roleId: studentRole.id,
              departmentId: defaultDept.id,
              isActive: true
            }
          });
          userId = newUser.id;
        }
      }

      return tx.student.create({
        data: {
          userId,
          enrollmentNo: finalEnrollment,
          rollNo: finalRoll,
          firstName,
          lastName,
          email: finalEmail,
          phone: phone || null,
          admissionYear: finalAdmissionYear,
          semester: finalSemester,
          departmentId: defaultDept.id,
          sectionId: resolvedSectionId,
          status: status || 'ACTIVE'
        },
        include: {
          department: true,
          section: true
        }
      });
    });

    return res.status(201).json({
      success: true,
      message: 'Student record created successfully.',
      student: {
        ...student,
        name: `${student.firstName} ${student.lastName || ''}`.trim()
      }
    });
  } catch (error) {
    logger.error(`[Student Controller] Error creating student: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update Student
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, semester, status, tgTeacherId, rollNo, roll_no, sectionId, sectionName, section } = req.body;

    const data = {};
    if (phone !== undefined) data.phone = phone;
    if (semester !== undefined) data.semester = parseInt(semester, 10);
    if (status !== undefined) data.status = status;
    if (tgTeacherId !== undefined) data.tgTeacherId = tgTeacherId;
    if (rollNo !== undefined || roll_no !== undefined) data.rollNo = (rollNo || roll_no || '').trim() || null;

    if (sectionId) {
      data.sectionId = sectionId;
    } else if (sectionName || section) {
      const secName = (sectionName || section).trim().toUpperCase();
      const sec = await prisma.section.findFirst({ where: { name: secName } });
      if (sec) data.sectionId = sec.id;
    }

    if (name) {
      const parts = name.trim().split(/\s+/);
      data.firstName = parts[0];
      data.lastName = parts.slice(1).join(' ');
    }

    const updated = await prisma.student.update({
      where: { id },
      data,
      include: {
        department: true,
        section: true,
        tutorGuardian: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Student record updated successfully.',
      student: {
        ...updated,
        name: `${updated.firstName} ${updated.lastName || ''}`.trim()
      }
    });
  } catch (error) {
    logger.error(`[Student Controller] Error updating student ${req.params.id}: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Delete Student
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      // Safe cascade delete of student records
      await tx.attendanceCorrectionRequest.deleteMany({ where: { studentId: id } });
      await tx.attendanceConsiderationRequest.deleteMany({ where: { studentId: id } });
      await tx.leaveApplication.deleteMany({ where: { studentId: id } });
      await tx.attendanceRecord.deleteMany({ where: { studentId: id } });
      await tx.enrollment.deleteMany({ where: { studentId: id } });

      const st = await tx.student.delete({ where: { id } });
      if (st.userId) {
        await tx.user.delete({ where: { id: st.userId } }).catch(() => {});
      }
    });

    return res.status(200).json({ success: true, message: 'Student record deleted successfully.' });
  } catch (error) {
    logger.error(`[Student Controller] Error deleting student: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

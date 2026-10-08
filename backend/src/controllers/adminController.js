// ============================================================================
// Departmental ERP - Admin Controller
// Authoritative System Governance: PostgreSQL via Prisma
// ============================================================================

const bcrypt = require('bcryptjs');
const { prisma } = require('../config/postgres');
const { AgentLog, Conversation } = require('../models/mongo/aiMemoryModels');
const { logger } = require('../services/loggerService');

// 1. Get Department Overview Analytics
exports.getDepartmentAnalytics = async (req, res) => {
  try {
    const [totalStudents, totalFaculty, totalSubjects, totalSections, totalDocuments] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.subject.count(),
      prisma.section.count(),
      prisma.documentMetadata.count()
    ]);

    const [y1, y2, y3, y4] = await Promise.all([
      prisma.student.count({ where: { semester: { in: [1, 2] } } }),
      prisma.student.count({ where: { semester: { in: [3, 4] } } }),
      prisma.student.count({ where: { semester: { in: [5, 6] } } }),
      prisma.student.count({ where: { semester: { in: [7, 8] } } })
    ]);

    const yearCounts = {
      '1st Year': y1,
      '2nd Year': y2,
      '3rd Year': y3,
      '4th Year': y4
    };

    let totalAiQueries = 0;
    let totalConversations = 0;
    try {
      totalAiQueries = await AgentLog.countDocuments();
      totalConversations = await Conversation.countDocuments();
    } catch (e) {
      // Non-blocking
    }

    const totalAttendanceRecords = await prisma.attendanceRecord.count();
    const presentRecords = await prisma.attendanceRecord.count({
      where: { status: { in: ['PRESENT', 'Present', 'LATE', 'Late'] } }
    });
    const avgAttendance = totalAttendanceRecords > 0 ? Math.round((presentRecords / totalAttendanceRecords) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalFaculty,
        totalSubjects,
        totalSections,
        totalAssignments: 0,
        totalDocuments,
        yearCounts,
        avgAttendance,
        aiMetrics: {
          totalAiQueries,
          totalConversations
        }
      }
    });
  } catch (error) {
    logger.error(`[Admin Controller] Analytics error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. User Management in PostgreSQL
exports.getUsers = async (req, res) => {
  try {
    const { role, search, q, status, page = 1, limit = 50 } = req.query;
    const queryTerm = (q || search || '').trim();
    const where = {};

    if (role && role.toUpperCase() !== 'ALL') {
      where.role = { name: { equals: role.toUpperCase(), mode: 'insensitive' } };
    }

    if (status && status.toUpperCase() !== 'ALL') {
      where.isActive = status.toUpperCase() === 'ACTIVE' || status.toUpperCase() === 'TRUE';
    }

    if (queryTerm) {
      where.OR = [
        { name: { contains: queryTerm, mode: 'insensitive' } },
        { email: { contains: queryTerm, mode: 'insensitive' } },
        { studentProfile: { enrollmentNo: { contains: queryTerm, mode: 'insensitive' } } },
        { studentProfile: { rollNo: { contains: queryTerm, mode: 'insensitive' } } },
        { teacherProfile: { employeeId: { contains: queryTerm, mode: 'insensitive' } } }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [totalCount, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          role: true,
          department: true,
          studentProfile: {
            include: { section: true }
          },
          teacherProfile: true
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return res.status(200).json({
      success: true,
      count: totalCount,
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role?.name || 'STUDENT',
        department: u.department?.name || 'CSE',
        departmentId: u.departmentId,
        isActive: u.isActive,
        status: u.isActive ? 'ACTIVE' : 'INACTIVE',
        createdAt: u.createdAt,
        studentProfile: u.studentProfile ? {
          ...u.studentProfile,
          enrollment_no: u.studentProfile.enrollmentNo,
          roll_no: u.studentProfile.rollNo,
          sectionName: u.studentProfile.section?.name || 'A'
        } : null,
        teacherProfile: u.teacherProfile ? {
          ...u.teacherProfile,
          employee_id: u.teacherProfile.employeeId
        } : null,
        facultyProfile: u.teacherProfile ? {
          ...u.teacherProfile,
          employee_id: u.teacherProfile.employeeId
        } : null,
        phone: u.studentProfile?.phone || u.teacherProfile?.phone || '',
        semester: u.studentProfile?.semester || 1,
        section: u.studentProfile?.section?.name || 'A'
      }))
    });
  } catch (error) {
    logger.error(`[Admin Controller] getUsers error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'STUDENT', departmentCode = 'CSE' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User with this email already exists.' });
    }

    const roleRecord = await prisma.role.findFirst({ where: { name: role.toUpperCase() } });
    const dept = await prisma.department.findFirst({ where: { code: departmentCode.toUpperCase() } });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        roleId: roleRecord.id,
        departmentId: dept?.id || null,
        isActive: true
      },
      include: { role: true, department: true }
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name,
        department: user.department?.name
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        department: true,
        studentProfile: { include: { section: true } },
        teacherProfile: true
      }
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name || 'STUDENT',
        department: user.department?.name || 'CSE',
        isActive: user.isActive,
        status: user.isActive ? 'ACTIVE' : 'INACTIVE',
        studentProfile: user.studentProfile ? {
          ...user.studentProfile,
          enrollment_no: user.studentProfile.enrollmentNo,
          roll_no: user.studentProfile.rollNo,
          sectionName: user.studentProfile.section?.name || 'A'
        } : null,
        teacherProfile: user.teacherProfile ? {
          ...user.teacherProfile,
          employee_id: user.teacherProfile.employeeId
        } : null,
        facultyProfile: user.teacherProfile ? {
          ...user.teacherProfile,
          employee_id: user.teacherProfile.employeeId
        } : null,
        phone: user.studentProfile?.phone || user.teacherProfile?.phone || '',
        semester: user.studentProfile?.semester || 1,
        section: user.studentProfile?.section?.name || 'A'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterRole = (req.user?.role || '').toUpperCase();
    const isHod = requesterRole === 'HOD';
    const isAdmin = requesterRole === 'ADMIN';

    // Verify target user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true, studentProfile: true, teacherProfile: true }
    });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found in database.' });
    }

    const {
      name,
      email,
      password,
      role,
      status,
      isActive,
      phone,
      mobile,
      // student fields
      enrollmentNo,
      enrollment_no,
      rollNo,
      roll_no,
      semester,
      section,
      sectionName,
      // teacher fields
      employeeId,
      employee_id,
      designation,
      isTG
    } = req.body;

    // Security Rule: HOD CANNOT update passwords!
    if (isHod && password && password.trim()) {
      return res.status(403).json({
        success: false,
        message: 'Security policy violation: HOD is not permitted to edit passwords. Password updates are strictly restricted to System Administrator.'
      });
    }

    // Security Rule: HOD CANNOT elevate users to ADMIN
    if (isHod && role && role.toUpperCase() === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Security policy violation: HOD cannot assign Administrator role.'
      });
    }

    // Build User update data
    const userData = {};
    if (name && name.trim()) userData.name = name.trim();
    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (emailExists && emailExists.id !== id) {
          return res.status(409).json({ success: false, message: 'Another user is already registered with this email address.' });
        }
        userData.email = cleanEmail;
      }
    }

    // Password Update: Strictly for ADMIN
    if (password && password.trim()) {
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: 'Only Administrator can update user passwords directly.' });
      }
      userData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    // Status Update
    if (isActive !== undefined) {
      userData.isActive = Boolean(isActive);
    } else if (status) {
      userData.isActive = status.toUpperCase() === 'ACTIVE' || status.toUpperCase() === 'TRUE';
    }

    // Role Update (Only if permitted)
    if (role && (!isHod || role.toUpperCase() !== 'ADMIN')) {
      const roleRecord = await prisma.role.findFirst({
        where: { name: { equals: role.toUpperCase(), mode: 'insensitive' } }
      });
      if (roleRecord) {
        userData.roleId = roleRecord.id;
      }
    }

    // Perform Transactional Update across User and linked Profiles
    await prisma.$transaction(async (tx) => {
      // 1. Update User table
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id },
          data: userData
        });
      }

      const effectiveName = userData.name || existingUser.name;
      const effectiveEmail = userData.email || existingUser.email;
      const effectiveStatus = userData.isActive !== undefined ? (userData.isActive ? 'ACTIVE' : 'INACTIVE') : undefined;
      const parts = effectiveName.split(/\s+/);
      const firstName = parts[0] || 'User';
      const lastName = parts.slice(1).join(' ') || '';
      const finalPhone = phone || mobile;

      // 2. Update Student Profile if user is student
      if (existingUser.studentProfile) {
        const studentUpdate = {
          firstName,
          lastName,
          email: effectiveEmail
        };
        if (finalPhone !== undefined) studentUpdate.phone = finalPhone;
        if (effectiveStatus) studentUpdate.status = effectiveStatus;
        if (semester !== undefined) studentUpdate.semester = parseInt(semester, 10);
        const finalEnrollment = enrollmentNo || enrollment_no;
        if (finalEnrollment) studentUpdate.enrollmentNo = finalEnrollment.trim().toUpperCase();
        const finalRoll = rollNo || roll_no;
        if (finalRoll !== undefined) studentUpdate.rollNo = finalRoll ? finalRoll.trim() : null;

        const secTarget = sectionName || section;
        if (secTarget) {
          const sec = await tx.section.findFirst({ where: { name: secTarget.trim().toUpperCase() } });
          if (sec) studentUpdate.sectionId = sec.id;
        }

        await tx.student.update({
          where: { id: existingUser.studentProfile.id },
          data: studentUpdate
        });
      }

      // 3. Update Teacher Profile if user is faculty
      if (existingUser.teacherProfile) {
        const teacherUpdate = {
          firstName,
          lastName,
          email: effectiveEmail
        };
        if (finalPhone !== undefined) teacherUpdate.phone = finalPhone;
        if (effectiveStatus) teacherUpdate.status = effectiveStatus;
        const finalEmpId = employeeId || employee_id;
        if (finalEmpId) teacherUpdate.employeeId = finalEmpId.trim().toUpperCase();
        if (designation) teacherUpdate.designation = designation.trim();
        if (isTG !== undefined) teacherUpdate.isTG = Boolean(isTG);

        await tx.teacher.update({
          where: { id: existingUser.teacherProfile.id },
          data: teacherUpdate
        });
      }
    });

    const refreshedUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true, department: true, studentProfile: { include: { section: true } }, teacherProfile: true }
    });

    return res.status(200).json({
      success: true,
      message: 'User information updated successfully in database.',
      user: {
        id: refreshedUser.id,
        name: refreshedUser.name,
        email: refreshedUser.email,
        role: refreshedUser.role?.name,
        isActive: refreshedUser.isActive,
        status: refreshedUser.isActive ? 'ACTIVE' : 'INACTIVE',
        studentProfile: refreshedUser.studentProfile,
        teacherProfile: refreshedUser.teacherProfile
      }
    });
  } catch (error) {
    logger.error(`[Admin Controller] updateUser error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Assign Head of Department (HOD)
exports.assignHod = async (req, res) => {
  try {
    const { teacherId, departmentCode = 'CSE' } = req.body;
    if (!teacherId) return res.status(400).json({ success: false, message: 'teacherId is required.' });

    const dept = await prisma.department.findFirst({ where: { code: departmentCode.toUpperCase() } });
    const hodRole = await prisma.role.findFirst({ where: { name: 'HOD' } });

    await prisma.$transaction(async (tx) => {
      // End previous HOD assignment
      await tx.hOD.updateMany({
        where: { departmentId: dept.id, isCurrent: true },
        data: { isCurrent: false, endDate: new Date() }
      });

      // Create new HOD assignment
      await tx.hOD.create({
        data: {
          teacherId,
          departmentId: dept.id,
          isCurrent: true,
          startDate: new Date()
        }
      });

      // Update teacher user role to HOD
      const teacher = await tx.teacher.findUnique({ where: { id: teacherId } });
      if (teacher && teacher.userId && hodRole) {
        await tx.user.update({
          where: { id: teacher.userId },
          data: { roleId: hodRole.id }
        });
      }
    });

    return res.status(200).json({ success: true, message: 'HOD appointed successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. AI Audit Logs
exports.getAiAuditLogs = async (req, res) => {
  try {
    const logs = await AgentLog.find().sort({ startedAt: -1 }).limit(50);
    return res.status(200).json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Faculty Workload
exports.getFacultyWorkload = async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        timetableSlots: true,
        department: true
      }
    });

    const workload = teachers.map((t) => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName || ''}`.trim(),
      designation: t.designation,
      department: t.department?.name,
      totalSlots: t.timetableSlots.length,
      weeklyHours: t.timetableSlots.length
    }));

    return res.status(200).json({ success: true, workload });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Update User Status
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
      include: { role: true }
    });
    return res.status(200).json({ success: true, message: 'User status updated.', user: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Reset User Password
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword = 'Password@123' } = req.body;
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });
    return res.status(200).json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Remove HOD
exports.removeHod = async (req, res) => {
  try {
    const { departmentCode = 'CSE' } = req.body;
    const dept = await prisma.department.findFirst({ where: { code: departmentCode.toUpperCase() } });
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found.' });

    await prisma.hOD.updateMany({
      where: { departmentId: dept.id, isCurrent: true },
      data: { isCurrent: false, endDate: new Date() }
    });

    return res.status(200).json({ success: true, message: 'HOD assignment removed.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 9. AI Config
exports.getAiConfig = async (req, res) => {
  return res.status(200).json({
    success: true,
    config: {
      provider: 'Groq',
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      maxTokens: 2048,
      vectorEngine: 'Qdrant Cloud',
      ltmCollection: 'erp_long_term_memory',
      ragCollection: 'erp_documents'
    }
  });
};

exports.updateAiConfig = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'AI parameters updated.',
    config: req.body
  });
};

// 10. System Logs
exports.getSystemLogs = async (req, res) => {
  try {
    const logs = await prisma.aIGeneratedRecord.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

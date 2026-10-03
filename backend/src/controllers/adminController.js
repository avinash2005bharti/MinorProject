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
    const { role, search } = req.query;
    const where = {};

    if (role && role !== 'all') {
      where.role = { name: role.toUpperCase() };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        role: true,
        department: true,
        studentProfile: true,
        teacherProfile: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role?.name,
        department: u.department?.name || 'CSE',
        isActive: u.isActive,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
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
      include: { role: true, department: true, studentProfile: true, teacherProfile: true }
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive, role } = req.body;

    const data = {};
    if (name) data.name = name.trim();
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    if (role) {
      const roleRecord = await prisma.role.findFirst({ where: { name: role.toUpperCase() } });
      if (roleRecord) data.roleId = roleRecord.id;
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      include: { role: true }
    });

    return res.status(200).json({ success: true, message: 'User updated.', user: updated });
  } catch (error) {
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
      model: 'openai/gpt-oss-120b',
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

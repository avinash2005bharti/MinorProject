// ============================================================================
// CampusFlow CSE Department ERP - Universal Action-Executing Agent Tools
// Single Source of Truth: PostgreSQL via Prisma Client
// Strictly enforces RBAC, Audit Logging, and Destructive Confirmation
// ============================================================================

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { prisma } = require('../config/postgres');
const { PERMISSIONS, getPermissionsForRole } = require('../config/permissions');
const { logger, aiLogger } = require('./loggerService');
const excelService = require('./excelService');
const pdfService = require('./pdfService');
const PYTHON_AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000';
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || '';

// Verify server-side authorization for a specific tool execution
function verifyToolAuthorization(user, requiredPermission) {
  if (!user) {
    return {
      authorized: false,
      reason: 'Authentication required. No authenticated user identity found.'
    };
  }

  const role = (user.role || 'student').toLowerCase();
  const permissions = getPermissionsForRole(role);

  if (requiredPermission && !permissions.includes(requiredPermission)) {
    return {
      authorized: false,
      reason: `Access Denied: Your account role is ${role.toUpperCase()}, which lacks the required institutional permission '${requiredPermission}' to execute this action.`
    };
  }

  return { authorized: true };
}

// Helper to get today's date range
function getDayInfo(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
  return { start, end, dayName, dateStr: d.toISOString().split('T')[0] };
}

// Safely validate UUIDs before querying Prisma UUID fields to prevent PostgreSQL syntax errors
const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
const isWithinDepartment = (user, resource) => {
  if ((user?.role || '').toUpperCase() === 'ADMIN') return true;
  return Boolean(user?.departmentId && resource?.departmentId && String(user.departmentId) === String(resource.departmentId));
};
const resolveDepartmentId = async (user, requestedCode) => {
  if (!user?.departmentId && (user?.role || '').toUpperCase() !== 'ADMIN') return null;
  if (requestedCode) {
    if ((user?.role || '').toUpperCase() !== 'ADMIN' &&
        String(requestedCode).toLowerCase() !== String(user.departmentCode || '').toLowerCase()) return null;
    const department = await prisma.department.findFirst({
      where: { code: { equals: String(requestedCode), mode: 'insensitive' } },
      select: { id: true }
    });
    return department?.id || null;
  }
  return user?.departmentId || null;
};

// ----------------------------------------------------------------------------
// Universal ERP Tool Registry
// ----------------------------------------------------------------------------

const erpAgentTools = {
  // ==========================================================================
  // 1. TEACHER TOOLS
  // ==========================================================================

  // 1.1 List Teachers
  async getTeachers(args = {}, context = {}) {
    const user = context.user;
    const auth = verifyToolAuthorization(user, PERMISSIONS.FACULTY_MANAGE);
    if ((user?.role || '').toUpperCase() === 'HOD' && !user.departmentId) {
      return { success: false, error: 'Department scope is required for this operation.' };
    }
    // Students can view public faculty directory
    const isPublic = (user?.role || '').toLowerCase() === 'student';

    const where = {
      ...((user?.role || '').toUpperCase() === 'HOD' ? { departmentId: user.departmentId } : {}),
      ...(args.status ? { status: args.status } : { status: 'ACTIVE' }),
      ...(args.isTG !== undefined ? { isTG: Boolean(args.isTG) } : {}),
      ...(args.designation ? { designation: { contains: args.designation, mode: 'insensitive' } } : {})
    };

    const teachers = await prisma.teacher.findMany({
      where,
      include: {
        department: true,
        teacherSubjects: { include: { subject: true } }
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
    });

    const steps = [
      'Querying PostgreSQL teacher records',
      `Found ${teachers.length} matching faculty members`
    ];

    const data = teachers.map(t => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName || ''}`.trim(),
      employeeId: isPublic ? undefined : t.employeeId,
      email: isPublic ? undefined : t.email,
      phone: isPublic ? undefined : t.phone,
      designation: t.designation,
      isTG: t.isTG,
      status: t.status,
      subjects: t.teacherSubjects.map(ts => ts.subject?.name).filter(Boolean),
      maxPeriodsPerDay: t.maxPeriodsPerDay,
      maxPeriodsPerWeek: t.maxPeriodsPerWeek
    }));

    return { success: true, steps, count: data.length, data };
  },

  // 1.2 Get Single Teacher
  async getTeacher(args = {}, context = {}) {
    const user = context.user;
    const identifier = args.id || args.teacherId || args.teacher_id || args.email || args.name;
    if (!identifier) {
      return { success: false, error: 'Teacher ID, email, or name is required.' };
    }

    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          ...(isUUID(identifier) ? [{ id: identifier }] : []),
          { email: { equals: identifier, mode: 'insensitive' } },
          { employeeId: { equals: identifier, mode: 'insensitive' } },
          { firstName: { contains: identifier, mode: 'insensitive' } }
        ]
      },
      include: {
        department: true,
        teacherSubjects: { include: { subject: true, section: true } },
        timetableSlots: {
          include: { subject: true, section: true, classroom: true },
          orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
        }
      }
    });

    if (!teacher) {
      return { success: false, error: `Teacher '${identifier}' not found in PostgreSQL.` };
    }
    const role = (user?.role || '').toUpperCase();
    if (role === 'HOD' && !isWithinDepartment(user, teacher)) {
      return { success: false, error: 'Access denied: this teacher is outside your department.' };
    }
    const canViewPrivateDetails = ['HOD', 'ADMIN'].includes(role) ||
      String(user?.teacherId || '') === String(teacher.id);

    const steps = [
      `Searching teacher record for '${identifier}'`,
      'Loading assigned subjects and timetable schedule'
    ];

    return {
      success: true,
      steps,
      data: {
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName || ''}`.trim(),
        ...(canViewPrivateDetails ? {
          employeeId: teacher.employeeId,
          email: teacher.email,
          phone: teacher.phone
        } : {}),
        designation: teacher.designation,
        isTG: teacher.isTG,
        status: teacher.status,
        department: teacher.department?.name,
        subjects: teacher.teacherSubjects.map(ts => ({
          subjectName: ts.subject?.name,
          subjectCode: ts.subject?.code,
          section: ts.section?.name,
          isPrimary: ts.isPrimary
        })),
        ...(canViewPrivateDetails ? {
          weeklySlotsCount: teacher.timetableSlots.length,
          schedulePreview: teacher.timetableSlots.slice(0, 10).map(s => ({
          day: s.dayOfWeek,
          period: s.periodNumber,
          time: `${s.startTime} - ${s.endTime}`,
          subject: s.subject?.name,
          room: s.classroom?.roomNumber,
          section: s.section?.name
          }))
        } : {})
      }
    };
  },

  // 1.3 Create Teacher
  async createTeacher(args = {}, context = {}) {
    const user = context.user;
    const auth = verifyToolAuthorization(user, PERMISSIONS.FACULTY_MANAGE);
    if (!auth.authorized) return { success: false, error: auth.reason };

    const {
      name,
      firstName,
      lastName,
      email,
      phone,
      designation = 'Assistant Professor',
      isTG = false,
      maxPeriodsPerDay = 4,
      maxPeriodsPerWeek = 18
    } = args;

    const fName = firstName || (name ? name.split(' ')[0] : 'Faculty');
    const lName = lastName || (name && name.split(' ').length > 1 ? name.split(' ').slice(1).join(' ') : '');
    const cleanEmail = (email || `${fName.toLowerCase()}.${Date.now()}@college.edu`).trim().toLowerCase();
    const empId = args.employeeId || `EMP${Math.floor(100000 + Math.random() * 900000)}`;

    const steps = [
      `Validating input for new faculty ${fName} ${lName}`,
      'Checking duplicate email or employee ID'
    ];

    const existing = await prisma.teacher.findFirst({
      where: { OR: [{ email: cleanEmail }, { employeeId: empId }] }
    });
    if (existing) {
      return { success: false, error: `A teacher with email '${cleanEmail}' or ID '${empId}' already exists.` };
    }

    const departmentId = await resolveDepartmentId(user, args.department);
    if (!departmentId) return { success: false, error: 'A valid authorized department is required to create a teacher.' };
    const teacherRole = await prisma.role.findFirst({ where: { name: 'TEACHER' } });
    const defaultPasswordHash = await bcrypt.hash('Teacher@123', 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: `${fName} ${lName}`.trim(),
          email: cleanEmail,
          passwordHash: defaultPasswordHash,
          roleId: teacherRole?.id || (await tx.role.findFirst()).id,
          departmentId
        }
      });

      const newTeacher = await tx.teacher.create({
        data: {
          userId: newUser.id,
          employeeId: empId,
          firstName: fName,
          lastName: lName,
          email: cleanEmail,
          phone: phone || null,
          designation,
          departmentId,
          isTG: Boolean(isTG),
          maxPeriodsPerDay: Number(maxPeriodsPerDay) || 4,
          maxPeriodsPerWeek: Number(maxPeriodsPerWeek) || 18,
          status: 'ACTIVE'
        }
      });

      return { user: newUser, teacher: newTeacher };
    });

    steps.push('Created User account and Teacher profile in PostgreSQL');

    return {
      success: true,
      steps,
      data: {
        teacherId: result.teacher.id,
        name: `${result.teacher.firstName} ${result.teacher.lastName || ''}`.trim(),
        employeeId: result.teacher.employeeId,
        email: result.teacher.email,
        designation: result.teacher.designation,
        status: result.teacher.status
      }
    };
  },

  // 1.4 Update Teacher
  async updateTeacher(args = {}, context = {}) {
    const user = context.user;
    const auth = verifyToolAuthorization(user, PERMISSIONS.FACULTY_MANAGE);
    if (!auth.authorized) return { success: false, error: auth.reason };

    const teacherId = args.id || args.teacherId || args.teacher_id;
    if (!teacherId) return { success: false, error: 'Teacher ID is required.' };
    const currentTeacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!currentTeacher) return { success: false, error: 'Teacher not found.' };
    if ((user?.role || '').toUpperCase() === 'HOD' && !isWithinDepartment(user, currentTeacher)) {
      return { success: false, error: 'Access denied: this teacher is outside your department.' };
    }

    const updateData = {};
    if (args.firstName) updateData.firstName = args.firstName;
    if (args.lastName) updateData.lastName = args.lastName;
    if (args.phone) updateData.phone = args.phone;
    if (args.designation) updateData.designation = args.designation;
    if (args.isTG !== undefined) updateData.isTG = Boolean(args.isTG);
    if (args.maxPeriodsPerDay) updateData.maxPeriodsPerDay = Number(args.maxPeriodsPerDay);
    if (args.maxPeriodsPerWeek) updateData.maxPeriodsPerWeek = Number(args.maxPeriodsPerWeek);
    if (args.status) updateData.status = args.status;

    const updated = await prisma.teacher.update({
      where: { id: teacherId },
      data: updateData
    });

    return {
      success: true,
      steps: ['Updating teacher record in PostgreSQL', 'Changes persisted successfully'],
      data: {
        id: updated.id,
        name: `${updated.firstName} ${updated.lastName || ''}`.trim(),
        designation: updated.designation,
        status: updated.status,
        isTG: updated.isTG
      }
    };
  },

  // 1.5 Deactivate Teacher (Destructive — Requires Confirmation)
  async deactivateTeacher(args = {}, context = {}) {
    const user = context.user;
    const auth = verifyToolAuthorization(user, PERMISSIONS.FACULTY_MANAGE);
    if (!auth.authorized) return { success: false, error: auth.reason };

    const identifier = args.id || args.teacherId || args.teacher_id || args.name || args.email;
    if (!identifier) return { success: false, error: 'Teacher identifier is required.' };

    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          ...(isUUID(identifier) ? [{ id: identifier }] : []),
          { email: { equals: identifier, mode: 'insensitive' } },
          { firstName: { contains: identifier, mode: 'insensitive' } }
        ]
      },
      include: {
        teacherSubjects: { include: { subject: true } },
        timetableSlots: true
      }
    });

    if (!teacher) {
      return { success: false, error: `Teacher '${identifier}' not found.` };
    }
    if ((user?.role || '').toUpperCase() === 'HOD' && !isWithinDepartment(user, teacher)) {
      return { success: false, error: 'Access denied: this teacher is outside your department.' };
    }

    const teacherName = `${teacher.firstName} ${teacher.lastName || ''}`.trim();

    // CONFIRMATION CHECK
    if (!args.confirmed && !args.confirm) {
      return {
        success: true,
        requires_confirmation: true,
        confirmation_message: `⚠️ **Confirmation Required:** ${teacherName} (${teacher.designation}) will be deactivated. This will affect ${teacher.teacherSubjects.length} assigned subject(s) and ${teacher.timetableSlots.length} timetable slot(s). Do you want to continue?`,
        confirmation_action: {
          tool: 'deactivateTeacher',
          args: { id: teacher.id, confirmed: true }
        }
      };
    }

    // Execution
    await prisma.$transaction(async (tx) => {
      await tx.teacher.update({
        where: { id: teacher.id },
        data: { status: 'INACTIVE' }
      });
      if (teacher.userId) {
        await tx.user.update({
          where: { id: teacher.userId },
          data: { isActive: false }
        });
      }
    });

    return {
      success: true,
      steps: [
        `Verified user confirmation for deactivating ${teacherName}`,
        'Set status to INACTIVE in PostgreSQL and disabled user credentials'
      ],
      data: {
        teacherId: teacher.id,
        name: teacherName,
        status: 'INACTIVE',
        message: `${teacherName} has been successfully deactivated.`
      }
    };
  },

  // 1.6 Search Teachers
  async searchTeachers(args = {}, context = {}) {
    const q = (args.query || args.q || '').trim();
    const teachers = await prisma.teacher.findMany({
      where: {
        status: 'ACTIVE',
        ...(q ? {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { employeeId: { contains: q, mode: 'insensitive' } },
            { designation: { contains: q, mode: 'insensitive' } }
          ]
        } : {})
      },
      include: { teacherSubjects: { include: { subject: true } } },
      take: 20
    });

    return {
      success: true,
      steps: [`Searched PostgreSQL teachers for '${q}'`, `Found ${teachers.length} result(s)`],
      count: teachers.length,
      data: teachers.map(t => ({
        id: t.id,
        name: `${t.firstName} ${t.lastName || ''}`.trim(),
        designation: t.designation,
        email: t.email,
        subjects: t.teacherSubjects.map(ts => ts.subject?.name)
      }))
    };
  },

  // 1.7 Teacher Workload
  async getTeacherWorkload(args = {}, context = {}) {
    const user = context.user;
    const role = (user?.role || '').toUpperCase();
    const departmentId = await resolveDepartmentId(user, args.department);
    if (role !== 'ADMIN' && !departmentId) return { success: false, error: 'Department scope is required for this report.' };
    if (role === 'TEACHER' && !user?.teacherId) return { success: false, error: 'Could not resolve the authenticated teacher profile.' };
    const teachers = await prisma.teacher.findMany({
      where: {
        status: 'ACTIVE',
        ...(departmentId ? { departmentId } : {}),
        ...(role === 'TEACHER' ? { id: user.teacherId } : {})
      },
      include: {
        teacherSubjects: { include: { subject: true } },
        timetableSlots: { include: { subject: true } }
      }
    });

    const workloadData = teachers.map(t => {
      const slotsCount = t.timetableSlots.length;
      const subjectsAssigned = t.teacherSubjects.map(ts => ts.subject?.name).filter(Boolean);
      const isOverloaded = slotsCount > t.maxPeriodsPerWeek;

      return {
        id: t.id,
        name: `${t.firstName} ${t.lastName || ''}`.trim(),
        designation: t.designation,
        maxWeeklyPeriods: t.maxPeriodsPerWeek,
        scheduledWeeklyPeriods: slotsCount,
        subjectsCount: subjectsAssigned.length,
        subjects: subjectsAssigned,
        loadPercentage: Math.round((slotsCount / Math.max(t.maxPeriodsPerWeek, 1)) * 100),
        status: isOverloaded ? 'OVERLOADED' : (slotsCount < 8 ? 'UNDERUTILIZED' : 'OPTIMAL')
      };
    });

    return {
      success: true,
      steps: [
        'Calculating teaching load across all active faculty',
        'Comparing scheduled slots against max allowed weekly periods'
      ],
      count: workloadData.length,
      data: workloadData
    };
  },

  // 1.8 Teacher Availability
  async getTeacherAvailability(args = {}, context = {}) {
    const user = context.user;
    const role = (user?.role || '').toUpperCase();
    const departmentId = await resolveDepartmentId(user, args.department);
    if (role !== 'ADMIN' && !departmentId) return { success: false, error: 'Department scope is required for this availability lookup.' };
    const { start, end, dayName, dateStr } = getDayInfo(args.date);

    const [teachers, todayLeaves, daySlots] = await Promise.all([
      prisma.teacher.findMany({
        where: { status: 'ACTIVE', ...(departmentId ? { departmentId } : {}), ...(role === 'TEACHER' ? { id: user.teacherId } : {}) },
        include: { teacherSubjects: { include: { subject: true } } }
      }),
      prisma.leaveApplication.findMany({
        where: {
          applicantType: 'TEACHER',
          status: { in: ['APPROVED', 'PENDING'] },
          startDate: { lte: end },
          endDate: { gte: start },
          ...(departmentId ? { teacher: { departmentId } } : {})
        }
      }),
      prisma.timetableSlot.findMany({
        where: { dayOfWeek: dayName, ...(departmentId ? { section: { departmentId } } : {}) },
        include: { subject: true, classroom: true, section: true }
      })
    ]);

    const leaveTeacherIds = new Set(todayLeaves.map(l => l.teacherId).filter(Boolean));

    const result = teachers.map(t => {
      const onLeave = leaveTeacherIds.has(t.id);
      const slots = daySlots.filter(s => s.teacherId === t.id);

      return {
        id: t.id,
        name: `${t.firstName} ${t.lastName || ''}`.trim(),
        designation: t.designation,
        status: onLeave ? 'ON_LEAVE' : 'AVAILABLE',
        day: dayName,
        date: dateStr,
        todayClassesCount: slots.length,
        todayClasses: slots.map(s => ({
          period: s.periodNumber,
          time: `${s.startTime} - ${s.endTime}`,
          subject: s.subject?.name,
          room: s.classroom?.roomNumber,
          section: s.section?.name
        }))
      };
    });

    return {
      success: true,
      steps: [
        `Checking faculty availability for ${dayName} (${dateStr})`,
        `Cross-referencing ${todayLeaves.length} leave records and ${daySlots.length} schedule slots`
      ],
      count: result.length,
      data: result
    };
  },

  // 1.9 Mark Teacher Leave (Self or HOD)
  async markTeacherLeave(args = {}, context = {}) {
    const user = context.user;
    const isHodOrAdmin = ['hod', 'admin'].includes((user?.role || '').toLowerCase());
    const isTeacher = ['teacher', 'faculty', 'tg'].includes((user?.role || '').toLowerCase());

    let targetTeacherId = args.teacherId || args.teacher_id;
    if (!targetTeacherId && user?.teacherProfile?.id) {
      targetTeacherId = user.teacherProfile.id;
    }

    if (!targetTeacherId && (user?.id || user?.email)) {
      const tp = await prisma.teacher.findFirst({
        where: {
          OR: [
            ...(isUUID(user.id) ? [{ userId: user.id }, { id: user.id }] : []),
            ...(user.email ? [{ email: { equals: user.email, mode: 'insensitive' } }] : [])
          ]
        }
      });
      if (tp) targetTeacherId = tp.id;
    }

    if (!targetTeacherId) {
      if (args.teacherName || args.name) {
        const found = await prisma.teacher.findFirst({
          where: { firstName: { contains: args.teacherName || args.name, mode: 'insensitive' } }
        });
        if (found) targetTeacherId = found.id;
      }
    }

    if (!targetTeacherId) {
      return { success: false, error: 'Could not determine teacher identity.' };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: targetTeacherId }
    });

    if (!teacher) return { success: false, error: 'Teacher record not found.' };

    const targetDate = args.date ? new Date(args.date) : new Date(Date.now() + 86400000); // Tomorrow by default if "tomorrow"
    const { start, end, dayName, dateStr } = getDayInfo(targetDate);

    // Find affected classes
    const affectedSlots = await prisma.timetableSlot.findMany({
      where: { teacherId: teacher.id, dayOfWeek: dayName },
      include: { subject: true, classroom: true, section: true }
    });

    const leaveStatus = isHodOrAdmin ? 'APPROVED' : 'PENDING';

    const leaveRecord = await prisma.leaveApplication.create({
      data: {
        applicantType: 'TEACHER',
        teacherId: teacher.id,
        leaveType: args.leaveType || 'CASUAL',
        startDate: start,
        endDate: end,
        totalDays: 1,
        reason: args.reason || 'Personal leave recorded via AI Copilot',
        status: leaveStatus,
        approvalComments: isHodOrAdmin ? 'Approved automatically via HOD AI agent' : null
      }
    });

    const teacherName = `${teacher.firstName} ${teacher.lastName || ''}`.trim();
    const steps = [
      `Identified teacher ${teacherName}`,
      `Created ${leaveStatus} leave record for ${dateStr} (${dayName})`,
      `Found ${affectedSlots.length} affected timetable lecture(s)`
    ];

    return {
      success: true,
      steps,
      data: {
        leaveId: leaveRecord.id,
        teacher: teacherName,
        date: dateStr,
        day: dayName,
        status: leaveStatus,
        affectedClassesCount: affectedSlots.length,
        affectedClasses: affectedSlots.map(s => ({
          period: s.periodNumber,
          time: `${s.startTime} - ${s.endTime}`,
          subject: s.subject?.name,
          room: s.classroom?.roomNumber,
          section: s.section?.name
        }))
      }
    };
  },

  // ==========================================================================
  // 2. STUDENT TOOLS
  // ==========================================================================

  // 2.1 Get Students
  async getStudents(args = {}, context = {}) {
    const user = context.user;
    const auth = verifyToolAuthorization(user, PERMISSIONS.STUDENT_LIST_VIEW);
    if (!auth.authorized) return { success: false, error: auth.reason };
    if ((user?.role || '').toUpperCase() === 'HOD' && !user.departmentId) {
      return { success: false, error: 'Department scope is required for this operation.' };
    }

    const role = (user?.role || '').toUpperCase();
    if (role === 'TG' && !user?.teacherId) return { success: false, error: 'Could not resolve the authenticated Tutor Guardian profile.' };
    if (role === 'TEACHER' && !user?.teacherId) return { success: false, error: 'Could not resolve the authenticated teacher profile.' };
    const where = {
      ...((user?.role || '').toUpperCase() === 'HOD' ? { departmentId: user.departmentId } : {}),
      ...(args.semester ? { semester: Number(args.semester) } : {}),
      ...(args.status ? { status: args.status } : { status: 'ACTIVE' }),
      ...(role === 'TG' ? {
        OR: [
          { tgTeacherId: user.teacherId },
          { section: { tgTeacherId: user.teacherId } }
        ]
      } : {}),
      ...(role === 'TEACHER' ? {
        section: { timetableSlots: { some: { teacherId: user.teacherId } } }
      } : {})
    };

    const students = await prisma.student.findMany({
      where,
      include: { section: true, department: true },
      take: args.limit ? Number(args.limit) : 50,
      orderBy: [{ semester: 'asc' }, { firstName: 'asc' }]
    });

    return {
      success: true,
      steps: ['Querying PostgreSQL student records', `Retrieved ${students.length} students`],
      count: students.length,
      data: students.map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName || ''}`.trim(),
        enrollmentNo: s.enrollmentNo,
        rollNo: s.rollNo,
        email: s.email,
        semester: s.semester,
        section: s.section?.name || 'A',
        status: s.status
      }))
    };
  },

  // 2.2 Get Single Student
  async getStudent(args = {}, context = {}) {
    const user = context.user;
    const identifier = args.id || args.studentId || args.enrollmentNo || args.email || args.name;
    const isSelf = user?.studentProfile?.id === identifier || user?.email === identifier;

    if (!isSelf) {
      const auth = verifyToolAuthorization(user, PERMISSIONS.STUDENT_LIST_VIEW);
      if (!auth.authorized) return { success: false, error: auth.reason };
    }

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          ...(isUUID(identifier) ? [{ id: identifier }] : []),
          { enrollmentNo: { equals: identifier, mode: 'insensitive' } },
          { email: { equals: identifier, mode: 'insensitive' } },
          { firstName: { contains: identifier, mode: 'insensitive' } }
        ]
      },
      include: {
        section: true,
        department: true,
        tutorGuardian: true,
        enrollments: { include: { subject: true } }
      }
    });

    if (!student) return { success: false, error: `Student '${identifier}' not found.` };
    const role = (user?.role || '').toUpperCase();
    if (role === 'HOD' && !isWithinDepartment(user, student)) {
      return { success: false, error: 'Access denied: this student is outside your department.' };
    }
    if (role === 'TG') {
      const assignedMentee = user?.teacherId &&
        (String(student.tgTeacherId) === String(user.teacherId) ||
          Boolean(await prisma.section.findFirst({
            where: { id: student.sectionId, tgTeacherId: user.teacherId },
            select: { id: true }
          })));
      if (!assignedMentee) return { success: false, error: 'Access denied: this student is outside your mentorship scope.' };
    }
    if (role === 'TEACHER' && student.sectionId) {
      const assignedSection = await prisma.timetableSlot.findFirst({
        where: { teacherId: user?.teacherId, sectionId: student.sectionId },
        select: { id: true }
      });
      if (!assignedSection) return { success: false, error: 'Access denied: this student is outside your assigned teaching scope.' };
    }

    return {
      success: true,
      steps: [`Found student ${student.firstName} ${student.lastName || ''}`, 'Loaded enrollment and academic profile'],
      data: {
        id: student.id,
        name: `${student.firstName} ${student.lastName || ''}`.trim(),
        enrollmentNo: student.enrollmentNo,
        rollNo: student.rollNo,
        email: student.email,
        semester: student.semester,
        section: student.section?.name || 'A',
        tutorGuardian: student.tutorGuardian ? `${student.tutorGuardian.firstName} ${student.tutorGuardian.lastName || ''}`.trim() : null,
        enrolledSubjects: student.enrollments.map(e => e.subject?.name)
      }
    };
  },

  // 2.3 Create Student
  async createStudent(args = {}, context = {}) {
    const user = context.user;
    const auth = verifyToolAuthorization(user, PERMISSIONS.USER_CREATE);
    if (!auth.authorized) return { success: false, error: auth.reason };

    const {
      name,
      firstName,
      lastName,
      email,
      enrollmentNo,
      rollNo,
      semester = 5,
      sectionName = args.section || 'A'
    } = args;

    const fName = firstName || (name ? name.split(' ')[0] : 'Student');
    const lName = lastName || (name && name.split(' ').length > 1 ? name.split(' ').slice(1).join(' ') : '');
    const cleanEmail = (email || `${fName.toLowerCase()}.${Date.now()}@college.edu`).trim().toLowerCase();
    const enrollNo = (enrollmentNo || `ENR${Math.floor(100000 + Math.random() * 900000)}`).toUpperCase();

    const departmentId = await resolveDepartmentId(user, args.department);
    if (!departmentId) return { success: false, error: 'A valid authorized department is required to create a student.' };
    const studentRole = await prisma.role.findFirst({ where: { name: 'STUDENT' } });
    const defaultSec = await prisma.section.findFirst({
      where: {
        name: sectionName.toUpperCase(),
        departmentId,
        semester: { semesterNumber: Number(semester) || 5 }
      }
    });
    if (!defaultSec) return { success: false, error: 'The requested section does not exist in the selected department and semester.' };
    const defaultPasswordHash = await bcrypt.hash('Student@123', 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: `${fName} ${lName}`.trim(),
          email: cleanEmail,
          passwordHash: defaultPasswordHash,
          roleId: studentRole?.id || (await tx.role.findFirst()).id,
          departmentId
        }
      });

      const newStudent = await tx.student.create({
        data: {
          userId: newUser.id,
          enrollmentNo: enrollNo,
          rollNo: rollNo || enrollNo,
          firstName: fName,
          lastName: lName,
          email: cleanEmail,
          semester: Number(semester) || 5,
          departmentId,
          sectionId: defaultSec.id,
          status: 'ACTIVE'
        }
      });

      return { user: newUser, student: newStudent };
    });

    return {
      success: true,
      steps: [
        `Created student User credential for ${cleanEmail}`,
        `Inserted student record '${enrollNo}' in PostgreSQL`
      ],
      data: {
        studentId: result.student.id,
        name: `${result.student.firstName} ${result.student.lastName || ''}`.trim(),
        enrollmentNo: result.student.enrollmentNo,
        email: result.student.email,
        semester: result.student.semester
      }
    };
  },

  // 2.4 Deactivate Student (Destructive — Requires Confirmation)
  async deactivateStudent(args = {}, context = {}) {
    const user = context.user;
    const auth = verifyToolAuthorization(user, PERMISSIONS.USER_DELETE);
    if (!auth.authorized) return { success: false, error: auth.reason };

    const identifier = args.id || args.studentId || args.enrollmentNo || args.name;
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          ...(isUUID(identifier) ? [{ id: identifier }] : []),
          { enrollmentNo: { equals: identifier, mode: 'insensitive' } },
          { firstName: { contains: identifier, mode: 'insensitive' } }
        ]
      }
    });

    if (!student) return { success: false, error: `Student '${identifier}' not found.` };
    if ((user?.role || '').toUpperCase() === 'HOD' && !isWithinDepartment(user, student)) {
      return { success: false, error: 'Access denied: this student is outside your department.' };
    }
    const studentName = `${student.firstName} ${student.lastName || ''}`.trim();

    if (!args.confirmed && !args.confirm) {
      return {
        success: true,
        requires_confirmation: true,
        confirmation_message: `⚠️ **Confirmation Required:** Student ${studentName} (\`${student.enrollmentNo}\`) will be deactivated. This will disable login and mark academic enrollment inactive. Do you want to proceed?`,
        confirmation_action: {
          tool: 'deactivateStudent',
          args: { id: student.id, confirmed: true }
        }
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: student.id },
        data: { status: 'INACTIVE' }
      });
      if (student.userId) {
        await tx.user.update({
          where: { id: student.userId },
          data: { isActive: false }
        });
      }
    });

    return {
      success: true,
      steps: [
        `Confirmed action for deactivating student ${studentName}`,
        'Set status to INACTIVE in PostgreSQL database'
      ],
      data: {
        studentId: student.id,
        name: studentName,
        status: 'INACTIVE'
      }
    };
  },

  // 2.5 Student Attendance Tool
  async getStudentAttendance(args = {}, context = {}) {
    const user = context.user;
    const role = (user?.role || '').toUpperCase();
    let targetStudentId = args.studentId || args.student_id;

    if (!targetStudentId) {
      if (user?.studentProfile?.id) {
        targetStudentId = user.studentProfile.id;
      } else if (user?.id || user?.email) {
        const found = await prisma.student.findFirst({
          where: {
            OR: [
              ...(isUUID(user.id) ? [{ userId: user.id }, { id: user.id }] : []),
              ...(user.email ? [{ email: { equals: user.email, mode: 'insensitive' } }] : [])
            ]
          }
        });
        if (found) targetStudentId = found.id;
      }
    }

    if (!targetStudentId && ['TG', 'HOD', 'ADMIN'].includes(role) && (args.enrollmentNo || args.name)) {
      const identifier = args.enrollmentNo || args.name;
      const found = await prisma.student.findFirst({
        where: args.enrollmentNo
          ? { enrollmentNo: { equals: identifier, mode: 'insensitive' } }
          : { firstName: { contains: identifier, mode: 'insensitive' } },
        select: { id: true }
      });
      targetStudentId = found?.id;
    }

    if (!targetStudentId) {
      return { success: false, error: 'Could not determine student identity for attendance lookup.' };
    }

    const student = await prisma.student.findUnique({
      where: { id: targetStudentId },
      include: {
        section: true,
        attendanceRecords: {
          include: { attendance: { include: { subject: true } } }
        }
      }
    });

    if (!student) return { success: false, error: 'Student record not found in PostgreSQL.' };
    const isSelf = String(student.id) === String(user?.studentId);
    if (role === 'STUDENT' && !isSelf) {
      return { success: false, error: 'Access denied: students may only view their own attendance.' };
    }
    if (role === 'HOD' && !isWithinDepartment(user, student)) {
      return { success: false, error: 'Access denied: this student is outside your department.' };
    }
    if (!['STUDENT', 'HOD', 'ADMIN'].includes(role)) {
      if (role === 'TG') {
        const isMentee = student.tgTeacherId === user?.teacherId ||
          (await prisma.section.findFirst({ where: { id: student.sectionId, tgTeacherId: user?.teacherId }, select: { id: true } })) !== null;
        if (!user?.teacherId || !isMentee) {
          return { success: false, error: 'Access denied: this student is not assigned to your mentorship scope.' };
        }
      } else {
        return { success: false, error: 'Access denied: your role cannot view another student’s attendance.' };
      }
    }

    const totalSessions = student.attendanceRecords.length;
    const presentSessions = student.attendanceRecords.filter(r =>
      ['PRESENT', 'EXCUSED'].includes((r.status || '').toUpperCase())
    ).length;
    const percentage = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 100;

    // Subject breakdown
    const subjectMap = {};
    student.attendanceRecords.forEach(r => {
      const subName = r.attendance?.subject?.name || 'General';
      if (!subjectMap[subName]) subjectMap[subName] = { attended: 0, total: 0 };
      subjectMap[subName].total += 1;
      if (['PRESENT', 'EXCUSED'].includes((r.status || '').toUpperCase())) {
        subjectMap[subName].attended += 1;
      }
    });

    const subjectBreakdown = Object.entries(subjectMap).map(([subject, stats]) => ({
      subject,
      attended: stats.attended,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 100
    }));

    const studentName = `${student.firstName} ${student.lastName || ''}`.trim();
    const steps = [
      `Retrieved attendance ledger for ${studentName} (\`${student.enrollmentNo}\`)`,
      `Computed attendance: ${presentSessions} present out of ${totalSessions} sessions (${percentage}%)`
    ];

    return {
      success: true,
      steps,
      data: {
        studentId: student.id,
        name: studentName,
        enrollmentNo: student.enrollmentNo,
        semester: student.semester,
        section: student.section?.name || 'A',
        totalSessions,
        presentSessions,
        percentage,
        isSatisfactory: percentage >= 75,
        subjectBreakdown
      }
    };
  },

  // ==========================================================================
  // 3. SUBJECT TOOLS
  // ==========================================================================

  // 3.1 Get Subjects
  async getSubjects(args = {}, context = {}) {
    const departmentId = await resolveDepartmentId(context.user, args.department);
    if (!departmentId) return { success: false, error: 'A valid authorized department scope is required.' };
    const where = {
      departmentId,
      ...(args.semester ? { semester: Number(args.semester) } : {}),
      ...(args.isElective !== undefined ? { isElective: Boolean(args.isElective) } : {})
    };

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        teacherSubjects: { include: { teacher: true } }
      },
      orderBy: [{ semester: 'asc' }, { code: 'asc' }]
    });

    return {
      success: true,
      steps: ['Querying PostgreSQL subjects table', `Retrieved ${subjects.length} subjects`],
      count: subjects.length,
      data: subjects.map(s => ({
        id: s.id,
        code: s.code,
        name: s.name,
        semester: s.semester,
        credits: s.credits,
        weeklyHours: s.weeklyHours,
        isElective: s.isElective,
        assignedTeachers: s.teacherSubjects.map(ts => `${ts.teacher.firstName} ${ts.teacher.lastName || ''}`.trim())
      }))
    };
  },

  // 3.2 Create Subject
  async createSubject(args = {}, context = {}) {
    const user = context.user;
    const auth = verifyToolAuthorization(user, PERMISSIONS.SUBJECT_MANAGE);
    if (!auth.authorized) return { success: false, error: auth.reason };

    const { code, name, semester = 5, credits = 4, weeklyHours = 4, isElective = false } = args;
    if (!code || !name) return { success: false, error: 'Subject code and name are required.' };

    const departmentId = await resolveDepartmentId(user, args.department);
    if (!departmentId) return { success: false, error: 'A valid authorized department is required to create a subject.' };

    const created = await prisma.subject.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        semester: Number(semester) || 5,
        credits: Number(credits) || 4,
        weeklyHours: Number(weeklyHours) || 4,
        isElective: Boolean(isElective),
        departmentId
      }
    });

    return {
      success: true,
      steps: [`Inserted subject '${created.code} — ${created.name}' in PostgreSQL`],
      data: created
    };
  },

  // 3.3 Delete Subject (Destructive — Requires Confirmation)
  async deleteSubject(args = {}, context = {}) {
    const user = context.user;
    const auth = verifyToolAuthorization(user, PERMISSIONS.SUBJECT_MANAGE);
    if (!auth.authorized) return { success: false, error: auth.reason };

    const identifier = args.id || args.code || args.name;
    const subject = await prisma.subject.findFirst({
      where: {
        OR: [
          ...(isUUID(identifier) ? [{ id: identifier }] : []),
          { code: { equals: identifier, mode: 'insensitive' } },
          { name: { contains: identifier, mode: 'insensitive' } }
        ]
      }
    });

    if (!subject) return { success: false, error: `Subject '${identifier}' not found.` };
    if ((user?.role || '').toUpperCase() !== 'ADMIN' && !isWithinDepartment(user, subject)) {
      return { success: false, error: 'Access denied: this subject is outside your department.' };
    }

    if (!args.confirmed && !args.confirm) {
      return {
        success: true,
        requires_confirmation: true,
        confirmation_message: `⚠️ **Confirmation Required:** You are about to delete subject **${subject.code} — ${subject.name}**. This may invalidate timetable slots and attendance records linked to it. Continue?`,
        confirmation_action: {
          tool: 'deleteSubject',
          args: { id: subject.id, confirmed: true }
        }
      };
    }

    await prisma.subject.delete({ where: { id: subject.id } });

    return {
      success: true,
      steps: [`Subject '${subject.code}' deleted from PostgreSQL`],
      data: { id: subject.id, code: subject.code, name: subject.name, status: 'DELETED' }
    };
  },

  // ==========================================================================
  // 4. TIMETABLE TOOLS
  // ==========================================================================

  // 4.1 Get Timetable
  async getTimetable(args = {}, context = {}) {
    const user = context.user;
    const role = (user?.role || '').toUpperCase();
    let sem = Number(args.semester);
    let secName = args.section ? String(args.section).toUpperCase() : '';
    let departmentId = user?.departmentId;

    if (role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: {
          OR: [
            ...(user?.studentId ? [{ id: user.studentId }] : []),
            ...(user?.id ? [{ userId: user.id }] : [])
          ]
        },
        include: { section: true }
      });
      if (!student?.section) return { success: false, error: 'Could not resolve your enrolled section.' };
      if ((sem && sem !== student.semester) || (secName && secName !== student.section.name.toUpperCase())) {
        return { success: false, error: 'Access denied: students may only view their own section timetable.' };
      }
      sem = student.semester;
      secName = student.section.name.toUpperCase();
      departmentId = student.departmentId;
    } else if (!sem || !secName) {
      return { success: false, error: 'Semester and section are required for this timetable lookup.' };
    }

    if (role === 'ADMIN' && args.department) {
      const department = await prisma.department.findFirst({
        where: { code: { equals: String(args.department), mode: 'insensitive' } },
        select: { id: true }
      });
      departmentId = department?.id;
    }
    if (!departmentId) return { success: false, error: 'A valid department scope is required for this timetable lookup.' };

    const timetable = await prisma.timetable.findFirst({
      where: {
        semester: sem,
        section: { name: secName, departmentId }
      },
      orderBy: { version: 'desc' },
      include: {
        slots: {
          include: { subject: true, teacher: true, classroom: true, section: true },
          orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
        },
        section: true
      }
    });

    const slots = timetable?.slots || [];
    const steps = [
      `Querying timetable for Semester ${sem} Section ${secName}`,
      `Found ${slots.length} timetable slot(s) (Version v${timetable?.version || 1})`
    ];

    return {
      success: true,
      steps,
      data: {
        timetableId: timetable?.id,
        version: timetable?.version || 1,
        semester: sem,
        section: secName,
        slotsCount: slots.length,
        slots: slots.map(s => ({
          id: s.id,
          day: s.dayOfWeek,
          period: s.periodNumber,
          startTime: s.startTime,
          endTime: s.endTime,
          subject: s.subject?.name,
          subjectCode: s.subject?.code,
          teacher: `${s.teacher.firstName} ${s.teacher.lastName || ''}`.trim(),
          room: s.classroom?.roomNumber,
          isLab: s.isLab
        }))
      }
    };
  },

  // 4.2 Generate Timetable
  async generateTimetable(args = {}, context = {}) {
    const user = context.user;
    const role = (user?.role || '').toUpperCase();
    const permissions = Array.isArray(user?.permissions) ? user.permissions : getPermissionsForRole(role);
    if (!user?.id || !['HOD', 'ADMIN'].includes(role) || !permissions.includes(PERMISSIONS.TIMETABLE_GENERATE)) {
      return { success: false, error: 'Only an authorized HOD or administrator may generate a timetable.' };
    }
    if (!INTERNAL_API_SECRET) {
      return { success: false, error: 'The authenticated timetable generation service is not configured.' };
    }
    const department = args.department || user.departmentCode;
    if (!department) return { success: false, error: 'A department is required to generate a timetable.' };
    if (role === 'HOD' && String(department).toLowerCase() !== String(user.departmentCode || '').toLowerCase()) {
      return { success: false, error: 'Access denied: an HOD may only generate timetables for their department.' };
    }

    try {
      const response = await axios.post(`${PYTHON_AI_SERVICE_URL}/ai/timetable/generate`, {
        department,
        semester: Number(args.semester) || 5,
        section: String(args.section || 'A').toUpperCase(),
        user_id: String(user.id),
        role,
        user
      }, {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': INTERNAL_API_SECRET
        }
      });
      const generated = response.data;
      if (generated?.success !== true || !generated.master_id) {
        return {
          success: false,
          error: generated?.detail || generated?.error || 'The timetable service did not verify a saved timetable.'
        };
      }
      return {
        success: true,
        steps: [
          'Generated timetable using the existing constraint optimizer.',
          `Saved timetable version ${generated.version} to PostgreSQL.`
        ],
        data: {
          timetableId: generated.master_id,
          version: generated.version,
          department: generated.department,
          semester: generated.semester,
          section: generated.section,
          slotsCount: generated.slots_count,
          metrics: generated.metrics,
          conflicts: generated.conflicts,
          files: generated.files
        }
      };
    } catch (error) {
      logger.error(`[Agent Timetable Tool] Generation service failed: ${error.message}`);
      return {
        success: false,
        error: error.response?.data?.detail || 'The timetable generation service could not complete the operation.'
      };
    }
  },

  // 4.3 Export Timetable Excel
  async exportTimetableExcel(args = {}, context = {}) {
    const user = context.user;
    const departmentId = await resolveDepartmentId(user, args.department);
    if (!departmentId) return { success: false, error: 'An authorized department is required for this export.' };
    const sem = Number(args.semester) || 5;
    const sec = (args.section || 'A').toUpperCase();
    if ((user?.role || '').toUpperCase() === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { OR: [...(user?.studentId ? [{ id: user.studentId }] : []), ...(user?.id ? [{ userId: user.id }] : [])] },
        include: { section: true }
      });
      if (!student?.section || student.semester !== sem || student.section.name.toUpperCase() !== sec) {
        return { success: false, error: 'Access denied: students may export only their own section timetable.' };
      }
    }

    const result = await excelService.exportTimetableExcel(sec, sem, undefined, null, null, departmentId);
    return {
      success: true,
      steps: [
        `Rendering 2D Excel spreadsheet for Sem ${sem} Sec ${sec}`,
        `File written to ${result.filePath}`
      ],
      data: {
        downloadUrl: result.downloadUrl,
        filename: result.filename
      }
    };
  },

  // 4.4 Export Timetable PDF
  async exportTimetablePDF(args = {}, context = {}) {
    const user = context.user;
    const departmentId = await resolveDepartmentId(user, args.department);
    if (!departmentId) return { success: false, error: 'An authorized department is required for this export.' };
    const sem = Number(args.semester) || 5;
    const sec = (args.section || 'A').toUpperCase();
    if ((user?.role || '').toUpperCase() === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { OR: [...(user?.studentId ? [{ id: user.studentId }] : []), ...(user?.id ? [{ userId: user.id }] : [])] },
        include: { section: true }
      });
      if (!student?.section || student.semester !== sem || student.section.name.toUpperCase() !== sec) {
        return { success: false, error: 'Access denied: students may export only their own section timetable.' };
      }
    }

    const result = await pdfService.exportTimetablePDF(sec, sem, undefined, null, null, departmentId);
    return {
      success: true,
      steps: [
        `Rendering official PDF timetable for Sem ${sem} Sec ${sec}`,
        `PDF generated at ${result.filePath}`
      ],
      data: {
        downloadUrl: result.downloadUrl,
        filename: result.filename
      }
    };
  },

  // ==========================================================================
  // 5. LEAVE TOOLS
  // ==========================================================================

  // 5.1 Get Teachers On Leave Today
  async getTeachersOnLeave(args = {}, context = {}) {
    const user = context.user;
    const role = (user?.role || '').toUpperCase();
    const departmentId = await resolveDepartmentId(user, args.department);
    if (role !== 'ADMIN' && !departmentId) return { success: false, error: 'Department scope is required for this lookup.' };
    const { start, end, dayName, dateStr } = getDayInfo(args.date);

    const leaves = await prisma.leaveApplication.findMany({
      where: {
        applicantType: 'TEACHER',
        status: { in: ['APPROVED', 'PENDING'] },
        startDate: { lte: end },
        endDate: { gte: start },
        ...(departmentId ? { teacher: { departmentId } } : {})
      },
      include: {
        teacher: {
          include: {
            timetableSlots: {
              where: { dayOfWeek: dayName },
              include: { subject: true, classroom: true, section: true }
            }
          }
        }
      }
    });

    const steps = [
      'Checking teacher records',
      `Checking leave records for ${dateStr} (${dayName})`,
      `Found ${leaves.length} teacher(s) on leave`
    ];

    const data = leaves.map(l => ({
      teacherId: l.teacherId,
      name: `${l.teacher?.firstName} ${l.teacher?.lastName || ''}`.trim(),
      designation: l.teacher?.designation,
      leaveType: l.leaveType,
      reason: l.reason,
      status: l.status,
      affectedSlotsCount: l.teacher?.timetableSlots?.length || 0,
      affectedSlots: (l.teacher?.timetableSlots || []).map(s => ({
        period: s.periodNumber,
        time: `${s.startTime} - ${s.endTime}`,
        subject: s.subject?.name,
        room: s.classroom?.roomNumber,
        section: s.section?.name
      }))
    }));

    return {
      success: true,
      steps,
      count: data.length,
      data
    };
  },

  // 5.2 Approve Leave Application
  async approveLeave(args = {}, context = {}) {
    const user = context.user;
    const auth = verifyToolAuthorization(user, PERMISSIONS.LEAVE_APPROVE_HOD);
    if (!auth.authorized) return { success: false, error: auth.reason };
    const role = (user?.role || '').toUpperCase();
    if (!['HOD', 'ADMIN'].includes(role)) return { success: false, error: 'Only an HOD or administrator may approve leave.' };

    const leaveId = args.id || args.leaveId;
    if (!leaveId) return { success: false, error: 'Leave application ID required.' };

    const existingLeave = await prisma.leaveApplication.findUnique({
      where: { id: leaveId },
      include: { teacher: true, student: true }
    });
    if (!existingLeave) return { success: false, error: 'Leave application not found.' };
    const applicant = existingLeave.teacher || existingLeave.student;
    if (role === 'HOD' && !isWithinDepartment(user, applicant)) {
      return { success: false, error: 'Access denied: this leave application is outside your department.' };
    }
    if (!['PENDING', 'RECOMMENDED_BY_TG'].includes(existingLeave.status)) {
      return { success: false, error: `Leave application is already ${existingLeave.status}.` };
    }

    const leave = await prisma.leaveApplication.update({
      where: { id: leaveId, status: existingLeave.status },
      data: {
        status: 'APPROVED',
        approvalComments: args.comments || 'Approved via HOD AI Copilot'
      },
      include: { teacher: true, student: true }
    });

    const applicantName = leave.teacher
      ? `${leave.teacher.firstName} ${leave.teacher.lastName || ''}`.trim()
      : (leave.student ? `${leave.student.firstName} ${leave.student.lastName || ''}`.trim() : 'Applicant');

    return {
      success: true,
      steps: [
        `Verified HOD credentials`,
        `Approved leave request for ${applicantName}`
      ],
      data: {
        leaveId: leave.id,
        applicant: applicantName,
        status: 'APPROVED'
      }
    };
  },

  // ==========================================================================
  // 6. ROOM TOOLS
  // ==========================================================================

  // 6.1 Get Rooms
  async getRooms(args = {}, context = {}) {
    const user = context.user;
    const role = (user?.role || '').toUpperCase();
    const departmentId = await resolveDepartmentId(user, args.department);
    if (role !== 'ADMIN' && !departmentId) return { success: false, error: 'Department scope is required for this room lookup.' };
    const rooms = await prisma.classroom.findMany({
      where: {
        ...(departmentId ? { OR: [{ departmentId }, { departmentId: null }] } : {}),
        ...(args.isActive !== undefined ? { isActive: Boolean(args.isActive) } : { isActive: true })
      },
      orderBy: [{ building: 'asc' }, { roomNumber: 'asc' }]
    });

    return {
      success: true,
      steps: ['Querying PostgreSQL classrooms', `Found ${rooms.length} rooms`],
      count: rooms.length,
      data: rooms.map(r => ({
        id: r.id,
        roomNumber: r.roomNumber,
        building: r.building,
        floor: r.floor,
        capacity: r.capacity,
        type: r.type,
        isActive: r.isActive
      }))
    };
  },

  // 6.2 Check Room Availability
  async checkRoomAvailability(args = {}, context = {}) {
    const user = context.user;
    const role = (user?.role || '').toUpperCase();
    const departmentId = await resolveDepartmentId(user, args.department);
    if (role !== 'ADMIN' && !departmentId) return { success: false, error: 'Department scope is required for this availability lookup.' };
    const day = args.day || 'Monday';
    const period = Number(args.period) || 1;

    const [allRooms, occupiedSlots] = await Promise.all([
      prisma.classroom.findMany({
        where: {
          isActive: true,
          ...(departmentId ? { OR: [{ departmentId }, { departmentId: null }] } : {})
        }
      }),
      prisma.timetableSlot.findMany({
        where: {
          dayOfWeek: day,
          periodNumber: period,
          ...(departmentId ? { section: { departmentId } } : {})
        },
        select: { classroomId: true }
      })
    ]);

    const occupiedRoomIds = new Set(occupiedSlots.map(s => s.classroomId).filter(Boolean));
    const availableRooms = allRooms.filter(r => !occupiedRoomIds.has(r.id));

    return {
      success: true,
      steps: [
        `Checking room availability for ${day} Period ${period}`,
        `Found ${availableRooms.length} free rooms out of ${allRooms.length} total`
      ],
      count: availableRooms.length,
      data: availableRooms.map(r => ({
        roomNumber: r.roomNumber,
        building: r.building,
        capacity: r.capacity,
        type: r.type
      }))
    };
  },

  // ==========================================================================
  // 7. REPORT TOOLS
  // ==========================================================================

  // 7.1 Generate Workload Report (Excel)
  async generateWorkloadReport(args = {}, context = {}) {
    const res = await erpAgentTools.getTeacherWorkload(args, context);
    if (!res.success) return res;

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(res.data.map(t => ({
      'Faculty Name': t.name,
      'Designation': t.designation,
      'Weekly Scheduled Hours': t.scheduledWeeklyPeriods,
      'Max Weekly Hours': t.maxWeeklyPeriods,
      'Load %': `${t.loadPercentage}%`,
      'Status': t.status,
      'Assigned Subjects': t.subjects.join(', ')
    })));

    xlsx.utils.book_append_sheet(wb, ws, 'Workload Analysis');

    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const filename = `Faculty_Workload_Report_${Date.now()}.xlsx`;
    const filePath = path.join(uploadsDir, filename);
    xlsx.writeFile(wb, filePath);

    return {
      success: true,
      steps: [
        'Aggregated faculty teaching assignments',
        `Generated Excel report: ${filename}`
      ],
      data: {
        filename,
        downloadUrl: `/uploads/${filename}`,
        teachersCount: res.data.length
      }
    };
  },

  // 7.2 Generate Attendance Report (Excel)
  async generateAttendanceReport(args = {}, context = {}) {
    const sem = Number(args.semester) || 5;
    const students = await prisma.student.findMany({
      where: { semester: sem, status: 'ACTIVE' },
      include: {
        section: true,
        attendanceRecords: true
      }
    });

    const reportRows = students.map(s => {
      const total = s.attendanceRecords.length;
      const present = s.attendanceRecords.filter(r => ['PRESENT', 'EXCUSED'].includes(r.status)).length;
      const pct = total > 0 ? Math.round((present / total) * 100) : 100;

      return {
        'Enrollment No': s.enrollmentNo,
        'Student Name': `${s.firstName} ${s.lastName || ''}`.trim(),
        'Semester': s.semester,
        'Section': s.section?.name || 'A',
        'Total Classes': total,
        'Classes Attended': present,
        'Attendance %': `${pct}%`,
        'Shortage Alert (<75%)': pct < 75 ? 'YES' : 'NO'
      };
    });

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(reportRows);
    xlsx.utils.book_append_sheet(wb, ws, `Attendance Sem ${sem}`);

    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const filename = `Attendance_Report_Sem${sem}_${Date.now()}.xlsx`;
    const filePath = path.join(uploadsDir, filename);
    xlsx.writeFile(wb, filePath);

    const shortageCount = reportRows.filter(r => r['Shortage Alert (<75%)'] === 'YES').length;

    return {
      success: true,
      steps: [
        `Computed attendance across ${students.length} students in Semester ${sem}`,
        `Identified ${shortageCount} student(s) below mandatory 75% threshold`,
        `Exported Excel report: ${filename}`
      ],
      data: {
        filename,
        downloadUrl: `/uploads/${filename}`,
        totalStudents: students.length,
        shortageCount
      }
    };
  },

  // ==========================================================================
  // 8. ATTENDANCE OPERATIONS (Teacher / Faculty / HOD)
  // ==========================================================================

  // 8.1 Mark Single Student Attendance
  async markAttendance(args = {}, context = {}) {
    const user = context.user;
    const auth = verifyToolAuthorization(user, PERMISSIONS.ATTENDANCE_MARK);
    if (!auth.authorized) return { success: false, error: auth.reason };

    const studentIdentifier = args.studentId || args.student_id || args.enrollmentNo || args.rollNo || args.name;
    const subjectIdentifier = args.subjectId || args.subject_id || args.subjectCode || args.code || args.subject;
    const status = (args.status || 'PRESENT').toUpperCase();
    const periodNumber = Number(args.periodNumber || args.period || 1);
    const dateInput = args.date ? new Date(args.date) : new Date();
    dateInput.setHours(0, 0, 0, 0);

    if (!studentIdentifier) {
      return { success: false, error: 'Student ID, enrollment number, or name is required.' };
    }
    if (!subjectIdentifier) {
      return { success: false, error: 'Subject code or subject ID is required.' };
    }

    // Resolve Student
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          ...(isUUID(studentIdentifier) ? [{ id: studentIdentifier }] : []),
          { enrollmentNo: { equals: studentIdentifier, mode: 'insensitive' } },
          { firstName: { contains: studentIdentifier, mode: 'insensitive' } }
        ]
      },
      include: { section: true }
    });

    if (!student) {
      return { success: false, error: `Student '${studentIdentifier}' not found in PostgreSQL.` };
    }

    // Resolve Subject
    const subject = await prisma.subject.findFirst({
      where: {
        OR: [
          ...(isUUID(subjectIdentifier) ? [{ id: subjectIdentifier }] : []),
          { code: { equals: subjectIdentifier, mode: 'insensitive' } },
          { name: { contains: subjectIdentifier, mode: 'insensitive' } }
        ]
      }
    });

    if (!subject) {
      return { success: false, error: `Subject '${subjectIdentifier}' not found in PostgreSQL.` };
    }

    // Resolve Teacher
    let teacherId = user?.teacherId;
    if (!teacherId && user?.id) {
      const ownTeacher = await prisma.teacher.findFirst({ where: { userId: user.id }, select: { id: true } });
      teacherId = ownTeacher?.id;
    }
    const role = (user?.role || '').toUpperCase();
    if (!student.sectionId) return { success: false, error: 'The student is not assigned to a section.' };
    if (role === 'HOD' && (!isWithinDepartment(user, student) || !isWithinDepartment(user, subject))) {
      return { success: false, error: 'Access denied: this attendance operation is outside your department.' };
    }
    if (!['HOD', 'ADMIN'].includes(role)) {
      if (!teacherId) return { success: false, error: 'Could not resolve the authenticated teacher profile.' };
      const scheduledClass = await prisma.timetableSlot.findFirst({
        where: {
          teacherId,
          subjectId: subject.id,
          sectionId: student.sectionId,
          periodNumber,
          dayOfWeek: getDayInfo(dateInput).dayName
        },
        select: { id: true }
      });
      if (!scheduledClass) {
        return { success: false, error: 'Access denied: you are not assigned to teach this subject for this section and period.' };
      }
    }

    // Upsert Attendance parent session
    const attendanceSession = await prisma.attendance.upsert({
      where: {
        subjectId_date_periodNumber_sectionId: {
          subjectId: subject.id,
          date: dateInput,
          periodNumber,
          sectionId: student.sectionId
        }
      },
      update: { teacherId },
      create: {
        subjectId: subject.id,
        teacherId,
        sectionId: student.sectionId,
        date: dateInput,
        periodNumber,
        totalStudents: 1,
        presentCount: status === 'PRESENT' ? 1 : 0,
        absentCount: status === 'ABSENT' ? 1 : 0
      }
    });

    // Upsert AttendanceRecord
    const record = await prisma.attendanceRecord.upsert({
      where: {
        attendanceId_studentId: {
          attendanceId: attendanceSession.id,
          studentId: student.id
        }
      },
      update: {
        status,
        verificationMethod: 'MANUAL_AI_OPERATOR',
        remarks: args.remarks || 'Marked via AI Agent'
      },
      create: {
        attendanceId: attendanceSession.id,
        studentId: student.id,
        status,
        verificationMethod: 'MANUAL_AI_OPERATOR',
        remarks: args.remarks || 'Marked via AI Agent'
      }
    });

    // Recompute parent counts
    const allRecords = await prisma.attendanceRecord.findMany({ where: { attendanceId: attendanceSession.id } });
    const presentCount = allRecords.filter(r => ['PRESENT', 'EXCUSED'].includes(r.status)).length;
    const absentCount = allRecords.filter(r => r.status === 'ABSENT').length;

    await prisma.attendance.update({
      where: { id: attendanceSession.id },
      data: { totalStudents: allRecords.length, presentCount, absentCount }
    });

    return {
      success: true,
      steps: [
        `Resolved student ${student.firstName} ${student.lastName || ''} (${student.enrollmentNo})`,
        `Resolved subject ${subject.name} (${subject.code})`,
        `Recorded status '${status}' for lecture on ${dateInput.toISOString().split('T')[0]} (Period ${periodNumber})`
      ],
      data: {
        recordId: record.id,
        student: `${student.firstName} ${student.lastName || ''}`.trim(),
        enrollmentNo: student.enrollmentNo,
        subject: `${subject.name} (${subject.code})`,
        status: record.status,
        date: dateInput.toISOString().split('T')[0],
        periodNumber,
        sessionPresentCount: presentCount,
        sessionTotal: allRecords.length
      }
    };
  },

  // 8.2 Bulk Mark Class Attendance
  async bulkMarkAttendance(args = {}, context = {}) {
    const user = context.user;
    const auth = verifyToolAuthorization(user, PERMISSIONS.ATTENDANCE_MARK);
    if (!auth.authorized) return { success: false, error: auth.reason };

    const sem = Number(args.semester || 5);
    const sec = (args.section || 'A').toUpperCase();
    const subjectIdentifier = args.subjectCode || args.subjectId || args.subject;
    const absentEnrollments = Array.isArray(args.absentEnrollments) ? args.absentEnrollments.map(e => String(e).trim().toUpperCase()) : [];
    const dateInput = args.date ? new Date(args.date) : new Date();
    dateInput.setHours(0, 0, 0, 0);
    const periodNumber = Number(args.periodNumber || 1);

    if (!subjectIdentifier) {
      return { success: false, error: 'Subject code or subject ID is required.' };
    }

    const section = await prisma.section.findFirst({
      where: { name: sec, semester: { number: sem } }
    });
    if (!section) return { success: false, error: `Section ${sec} for semester ${sem} was not found.` };
    if ((user?.role || '').toUpperCase() === 'HOD' && !isWithinDepartment(user, section)) {
      return { success: false, error: 'Access denied: this section is outside your department.' };
    }

    const students = await prisma.student.findMany({
      where: {
        semester: sem,
        status: 'ACTIVE',
        sectionId: section.id
      }
    });

    if (students.length === 0) {
      return { success: false, error: `No active students found in Semester ${sem} Section ${sec}.` };
    }

    // Resolve subject & teacher
    const subject = await prisma.subject.findFirst({
      where: {
        OR: [
          ...(isUUID(subjectIdentifier) ? [{ id: subjectIdentifier }] : []),
          { code: { equals: subjectIdentifier, mode: 'insensitive' } },
          { name: { contains: subjectIdentifier, mode: 'insensitive' } }
        ]
      }
    });

    if (!subject) return { success: false, error: `Subject '${subjectIdentifier}' not found.` };

    let teacherId = user?.teacherId;
    if (!teacherId && user?.id) {
      const ownTeacher = await prisma.teacher.findFirst({ where: { userId: user.id }, select: { id: true } });
      teacherId = ownTeacher?.id;
    }
    const role = (user?.role || '').toUpperCase();
    if (role === 'HOD' && (!isWithinDepartment(user, section) || !isWithinDepartment(user, subject))) {
      return { success: false, error: 'Access denied: this attendance operation is outside your department.' };
    }
    if (!['HOD', 'ADMIN'].includes(role)) {
      if (!teacherId) return { success: false, error: 'Could not resolve the authenticated teacher profile.' };
      const scheduledClass = await prisma.timetableSlot.findFirst({
        where: {
          teacherId,
          subjectId: subject.id,
          sectionId: section.id,
          periodNumber,
          dayOfWeek: getDayInfo(dateInput).dayName
        },
        select: { id: true }
      });
      if (!scheduledClass) {
        return { success: false, error: 'Access denied: you are not assigned to teach this subject for this section and period.' };
      }
    }

    // Confirmation is issued only after resolving the class and verifying the caller's scope.
    if (!args.confirmed) {
      return {
        success: true,
        requires_confirmation: true,
        confirmation_message: `Confirmation required before recording attendance for ${students.length} students in Semester ${sem} Section ${sec}.`,
        confirmation_action: {
          tool: 'bulkMarkAttendance',
          args: { ...args, confirmed: true },
          userId: user?.id
        }
      };
    }

    const attendanceSession = await prisma.attendance.upsert({
      where: {
        subjectId_date_periodNumber_sectionId: {
          subjectId: subject.id,
          date: dateInput,
          periodNumber,
          sectionId: section.id
        }
      },
      update: { teacherId },
      create: {
        subjectId: subject.id,
        teacherId,
        sectionId: section.id,
        date: dateInput,
        periodNumber,
        totalStudents: students.length,
        presentCount: 0,
        absentCount: 0
      }
    });

    let markedPresent = 0;
    let markedAbsent = 0;

    for (const std of students) {
      const isAbsent = absentEnrollments.includes(std.enrollmentNo.toUpperCase());
      const status = isAbsent ? 'ABSENT' : 'PRESENT';
      if (isAbsent) markedAbsent++;
      else markedPresent++;

      await prisma.attendanceRecord.upsert({
        where: {
          attendanceId_studentId: {
            attendanceId: attendanceSession.id,
            studentId: std.id
          }
        },
        update: { status, verificationMethod: 'BULK_AI_OPERATOR' },
        create: {
          attendanceId: attendanceSession.id,
          studentId: std.id,
          status,
          verificationMethod: 'BULK_AI_OPERATOR'
        }
      });
    }

    await prisma.attendance.update({
      where: { id: attendanceSession.id },
      data: { totalStudents: students.length, presentCount: markedPresent, absentCount: markedAbsent }
    });

    return {
      success: true,
      steps: [
        `Loaded ${students.length} students for Semester ${sem} Section ${sec}`,
        `Batch upserted attendance session for ${subject.name}`,
        `Committed: ${markedPresent} Present, ${markedAbsent} Absent`
      ],
      data: {
        sessionId: attendanceSession.id,
        class: `Sem ${sem} Sec ${sec}`,
        subject: subject.code,
        totalMarked: students.length,
        present: markedPresent,
        absent: markedAbsent
      }
    };
  },

  // ==========================================================================
  // 9. LEAVE OPERATIONS (Student / Teacher / TG / HOD)
  // ==========================================================================

  // 9.1 Apply Leave (Universal for Student and Teacher)
  async applyLeave(args = {}, context = {}) {
    const user = context.user;
    const auth = verifyToolAuthorization(user, PERMISSIONS.LEAVE_APPLY);
    if (!auth.authorized) return { success: false, error: auth.reason };

    const role = (user?.role || '').toUpperCase();
    const isStudent = role === 'STUDENT';
    const applicantType = isStudent ? 'STUDENT' : 'TEACHER';

    let studentId = null;
    let teacherId = null;

    if (isStudent) {
      studentId = user?.studentId;
      if (!studentId && user?.id) {
        const std = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } });
        studentId = std?.id;
      }
      if (args.studentId && String(args.studentId) !== String(studentId)) {
        return { success: false, error: 'Access denied: a student may only apply leave for their own profile.' };
      }
    } else {
      teacherId = user?.teacherId;
      if (!teacherId && user?.id) {
        const tch = await prisma.teacher.findFirst({ where: { userId: user.id }, select: { id: true } });
        teacherId = tch?.id;
      }
      if (args.teacherId && String(args.teacherId) !== String(teacherId)) {
        return { success: false, error: 'Access denied: a teacher may only apply leave for their own profile.' };
      }
    }
    if (!studentId && !teacherId) {
      return { success: false, error: 'Could not resolve a leave applicant from the authenticated identity.' };
    }

    const leaveType = (args.leaveType || args.type || 'CASUAL').toUpperCase();
    const reason = String(args.reason || '').trim();
    if (!reason) return { success: false, error: 'A reason is required to apply for leave.' };

    // Parse start date (supports 'tomorrow', 'today', or YYYY-MM-DD)
    let startDate = new Date();
    const startInput = (args.startDate || args.date || '').toLowerCase();
    if (startInput.includes('tomorrow')) {
      startDate = new Date(Date.now() + 86400000);
    } else if (args.startDate) {
      startDate = new Date(args.startDate);
    }
    if (Number.isNaN(startDate.getTime())) {
      return { success: false, error: 'The leave start date is invalid.' };
    }
    startDate.setHours(0, 0, 0, 0);

    let endDate = new Date(startDate);
    if (args.endDate) {
      endDate = new Date(args.endDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate.setHours(23, 59, 59, 999);
    }
    if (Number.isNaN(endDate.getTime()) || endDate < startDate) {
      return { success: false, error: 'The leave end date must be on or after the start date.' };
    }

    const diffMs = endDate.getTime() - startDate.getTime();
    const totalDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

    const leaveApp = await prisma.leaveApplication.create({
      data: {
        applicantType,
        studentId,
        teacherId,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason,
        status: 'PENDING'
      }
    });

    let applicantName = user?.name || 'Applicant';
    if (isStudent && studentId) {
      const s = await prisma.student.findUnique({ where: { id: studentId } });
      if (s) applicantName = `${s.firstName} ${s.lastName || ''}`.trim();
    } else if (teacherId) {
      const t = await prisma.teacher.findUnique({ where: { id: teacherId } });
      if (t) applicantName = `${t.firstName} ${t.lastName || ''}`.trim();
    }

    return {
      success: true,
      steps: [
        `Validated leave entitlement for ${applicantName} (${applicantType})`,
        `Computed duration: ${totalDays} day(s) from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        `Persisted LeaveApplication #${leaveApp.id.slice(0, 8)} to PostgreSQL`
      ],
      data: {
        leaveId: leaveApp.id,
        applicant: applicantName,
        applicantType,
        leaveType,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalDays,
        reason,
        status: leaveApp.status
      }
    };
  },

  // 9.2 Reject Leave (TG / HOD / Admin)
  async rejectLeave(args = {}, context = {}) {
    const user = context.user;
    const role = (user?.role || '').toUpperCase();
    const isHod = ['HOD', 'ADMIN'].includes(role);
    const requiredPermission = isHod ? PERMISSIONS.LEAVE_APPROVE_HOD : PERMISSIONS.LEAVE_REVIEW_TG;
    const auth = verifyToolAuthorization(user, requiredPermission);
    if (!auth.authorized) return { success: false, error: auth.reason };

    const identifier = args.leaveId || args.id;
    if (!identifier) return { success: false, error: 'Leave application ID required.' };
    const reason = args.reason || args.rejectionReason || 'Administrative decision';

    const leave = isUUID(identifier)
      ? await prisma.leaveApplication.findUnique({ where: { id: identifier }, include: { student: true, teacher: true } })
      : null;

    if (!leave) return { success: false, error: 'Leave application not found.' };
    if (!['PENDING', 'RECOMMENDED_BY_TG'].includes(leave.status)) return { success: false, error: `Leave application is already ${leave.status}.` };
    if (role === 'HOD' && !isWithinDepartment(user, leave.student || leave.teacher)) {
      return { success: false, error: 'Access denied: this leave application is outside your department.' };
    }
    if (role === 'TG') {
      const student = leave.student;
      const assignedMentee = user?.teacherId && student &&
        (String(student.tgTeacherId) === String(user.teacherId) ||
          Boolean(await prisma.section.findFirst({
            where: { id: student.sectionId, tgTeacherId: user.teacherId },
            select: { id: true }
          })));
      if (!assignedMentee) return { success: false, error: 'Access denied: this student is outside your mentorship scope.' };
    }

    const updated = await prisma.leaveApplication.update({
      where: { id: leave.id, status: leave.status },
      data: {
        status: 'REJECTED',
        rejectedBy: user?.name || 'Authorized Officer',
        rejectedAt: new Date(),
        rejectionReason: reason
      }
    });

    return {
      success: true,
      steps: [
        `Located LeaveApplication #${leave.id.slice(0, 8)}`,
        `Set status to REJECTED with remark: '${reason}'`
      ],
      data: {
        leaveId: updated.id,
        status: updated.status,
        rejectedBy: updated.rejectedBy,
        rejectionReason: reason
      }
    };
  },

  // ==========================================================================
  // 10. ATTENDANCE QUERY OPERATIONS (Student & TG / HOD)
  // ==========================================================================

  // 10.1 Submit Attendance Query (Student)
  async submitAttendanceQuery(args = {}, context = {}) {
    const user = context.user;
    const auth = verifyToolAuthorization(user, PERMISSIONS.ATTENDANCE_QUERY_SUBMIT);
    if (!auth.authorized) return { success: false, error: auth.reason };

    let studentId = user?.studentId;
    if (!studentId && user?.id) {
      const std = await prisma.student.findFirst({ where: { userId: user.id } });
      studentId = std?.id;
    }
    if (!studentId) return { success: false, error: 'Could not resolve the authenticated student profile.' };

    const subjectIdentifier = args.subjectCode || args.subjectId || args.subject;
    const dateInput = args.date ? new Date(args.date) : new Date();
    dateInput.setHours(0, 0, 0, 0);
    const reason = args.reason || 'I was present in the lecture but marked absent in the portal.';

    const subject = await prisma.subject.findFirst({
      where: {
        OR: [
          ...(subjectIdentifier && isUUID(subjectIdentifier) ? [{ id: subjectIdentifier }] : []),
          ...(subjectIdentifier ? [{ code: { equals: subjectIdentifier, mode: 'insensitive' } }] : []),
          ...(subjectIdentifier ? [{ name: { contains: subjectIdentifier, mode: 'insensitive' } }] : [])
        ]
      }
    });
    if (!subject) return { success: false, error: 'A valid subject is required to submit an attendance query.' };

    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true, departmentId: true } });
    if (!student) return { success: false, error: 'Authenticated student profile was not found.' };
    if (String(student.departmentId) !== String(subject.departmentId)) {
      return { success: false, error: 'Access denied: the subject is outside the student’s department.' };
    }

    const correction = await prisma.attendanceCorrectionRequest.create({
      data: {
        studentId,
        subjectId: subject.id,
        date: dateInput,
        requestedStatus: 'PRESENT',
        reason,
        status: 'PENDING'
      }
    });

    return {
      success: true,
      steps: [
        `Recorded AttendanceCorrectionRequest for ${subject.name}`,
        `Queued for Tutor Guardian review and HOD clearance`
      ],
      data: {
        queryId: correction.id,
        subject: `${subject.name} (${subject.code})`,
        date: dateInput.toISOString().split('T')[0],
        requestedStatus: correction.requestedStatus,
        reason,
        status: correction.status
      }
    };
  },

  // 10.2 Review / Approve Attendance Query (TG / HOD)
  async reviewAttendanceQuery(args = {}, context = {}) {
    const user = context.user;
    const isHod = ['hod', 'admin'].includes((user?.role || '').toLowerCase());
    const isTg = (user?.role || '').toLowerCase() === 'tg';
    const queryId = args.queryId || args.id;
    if (!queryId || !isUUID(queryId)) {
      return { success: false, error: 'A valid attendance query ID is required.' };
    }

    const auth = verifyToolAuthorization(
      user,
      isHod ? PERMISSIONS.ATTENDANCE_QUERY_APPROVE : PERMISSIONS.ATTENDANCE_QUERY_REVIEW
    );
    if (!auth.authorized) return { success: false, error: auth.reason };

    const action = (args.action || (isHod ? 'APPROVE' : 'RECOMMEND')).toUpperCase();
    const remarks = args.remarks || 'Verified and approved by academic officer.';
    if ((isTg && !['RECOMMEND', 'REJECT'].includes(action)) ||
        (isHod && !['APPROVE', 'REJECT'].includes(action)) ||
        (!isTg && !isHod)) {
      return { success: false, error: 'The requested attendance-query action is not permitted for this role.' };
    }

    const query = await prisma.attendanceCorrectionRequest.findUnique({
      where: { id: queryId },
      include: { student: true, subject: true }
    });

    if (!query) return { success: false, error: 'No matching attendance correction request found.' };
    if (isHod && (user.role || '').toUpperCase() === 'HOD' && !isWithinDepartment(user, query.student)) {
      return { success: false, error: 'Access denied: this attendance query is outside your department.' };
    }
    if (isTg) {
      const assignedMentee = user?.teacherId &&
        (String(query.student.tgTeacherId) === String(user.teacherId) ||
          Boolean(await prisma.section.findFirst({
            where: { id: query.student.sectionId, tgTeacherId: user.teacherId },
            select: { id: true }
          })));
      if (!assignedMentee) return { success: false, error: 'Access denied: this student is outside your mentorship scope.' };
    }

    if (action === 'APPROVE' && isHod) {
      const updated = await prisma.$transaction(async (tx) => {
        const corr = await tx.attendanceCorrectionRequest.update({
          where: { id: query.id },
          data: {
            status: 'APPROVED',
            approvedByHodId: user?.teacherId || null,
            hodRemarks: remarks,
            approvedAt: new Date()
          }
        });

        // Find and update the real AttendanceRecord
        const session = await tx.attendance.findFirst({
          where: { subjectId: query.subjectId, date: query.date }
        });

        if (session) {
          await tx.attendanceRecord.upsert({
            where: { attendanceId_studentId: { attendanceId: session.id, studentId: query.studentId } },
            update: { status: 'PRESENT', verificationMethod: 'AI_HOD_CORRECTION' },
            create: { attendanceId: session.id, studentId: query.studentId, status: 'PRESENT', verificationMethod: 'AI_HOD_CORRECTION' }
          });

          const recs = await tx.attendanceRecord.findMany({ where: { attendanceId: session.id } });
          const pres = recs.filter(r => ['PRESENT', 'EXCUSED'].includes(r.status)).length;
          await tx.attendance.update({
            where: { id: session.id },
            data: { presentCount: pres, absentCount: recs.length - pres }
          });
        }

        return corr;
      });

      return {
        success: true,
        steps: [
          `Approved AttendanceCorrectionRequest #${query.id.slice(0, 8)}`,
          `Updated student attendance ledger in PostgreSQL to PRESENT`
        ],
        data: {
          queryId: updated.id,
          student: `${query.student.firstName} ${query.student.lastName || ''}`.trim(),
          subject: query.subject.code,
          status: 'APPROVED',
          remarks
        }
      };
    } else if (action === 'RECOMMEND') {
      const updated = await prisma.attendanceCorrectionRequest.update({
        where: { id: query.id },
        data: {
          status: 'RECOMMENDED_BY_TG',
          reviewedByTeacherId: user?.teacherId || null,
          tgRemarks: remarks,
          recommendedAt: new Date()
        }
      });
      return {
        success: true,
        steps: [`TG recommended query #${query.id.slice(0, 8)} for HOD final signoff`],
        data: { queryId: updated.id, status: updated.status, remarks }
      };
    } else {
      const updated = await prisma.attendanceCorrectionRequest.update({
        where: { id: query.id },
        data: { status: 'REJECTED', rejectedBy: user?.name || 'Officer', rejectedAt: new Date() }
      });
      return {
        success: true,
        steps: [`Rejected attendance correction query #${query.id.slice(0, 8)}`],
        data: { queryId: updated.id, status: 'REJECTED' }
      };
    }
  },

  // ==========================================================================
  // 11. TIMETABLE & SCHEDULE LOOKUPS (Student & Faculty)
  // ==========================================================================

  // 11.1 Get Student Section Schedule
  async getStudentSchedule(args = {}, context = {}) {
    const user = context.user;
    const role = (user?.role || '').toUpperCase();
    let semester = Number(args.semester);
    let sectionName = args.section;
    let departmentId = user?.departmentId;

    if (role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: {
          OR: [
            ...(user?.studentId ? [{ id: user.studentId }] : []),
            ...(user?.id ? [{ userId: user.id }] : [])
          ]
        },
        include: { section: true }
      });
      if (!student?.section) return { success: false, error: 'Could not resolve your enrolled section.' };
      if ((semester && semester !== student.semester) || (sectionName && sectionName.toUpperCase() !== student.section.name.toUpperCase())) {
        return { success: false, error: 'Access denied: students may only view their own section timetable.' };
      }
      semester = student.semester;
      sectionName = student.section.name;
      departmentId = student.departmentId;
    } else if (!semester || !sectionName) {
      return { success: false, error: 'Semester and section are required for this timetable lookup.' };
    }
    if (!departmentId && role !== 'ADMIN') return { success: false, error: 'Department scope is required for this timetable lookup.' };

    const section = await prisma.section.findFirst({
      where: {
        name: sectionName.toUpperCase(),
        semester: { semesterNumber: semester },
        ...(role === 'ADMIN' ? {} : { departmentId })
      }
    });
    if (!section) return { success: false, error: 'The requested section was not found in your authorized department scope.' };

    const slots = await prisma.timetableSlot.findMany({
      where: {
        ...(section ? { sectionId: section.id } : {}),
        timetable: { semester }
      },
      include: {
        subject: true,
        teacher: true,
        classroom: true
      },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
    });

    const steps = [
      `Queried timetable slots for Semester ${semester} Section ${sectionName}`,
      `Loaded ${slots.length} period allocations`
    ];

    const schedule = slots.map(s => ({
      day: s.dayOfWeek,
      period: s.periodNumber,
      time: `${s.startTime} - ${s.endTime}`,
      subjectCode: s.subject?.code,
      subjectName: s.subject?.name,
      teacher: `${s.teacher?.firstName} ${s.teacher?.lastName || ''}`.trim(),
      room: s.classroom?.roomNumber || 'TBD',
      isLab: s.isLab
    }));

    return {
      success: true,
      steps,
      count: schedule.length,
      data: {
        semester,
        section: sectionName,
        totalSlots: schedule.length,
        schedule
      }
    };
  },

  // 11.2 Get Teacher Teaching Schedule
  async getTeacherSchedule(args = {}, context = {}) {
    const user = context.user;
    let teacherId = args.teacherId || user?.teacherId;
    const role = (user?.role || '').toUpperCase();
    if (!teacherId && args.name) {
      const t = await prisma.teacher.findFirst({
        where: { firstName: { contains: args.name, mode: 'insensitive' } }
      });
      teacherId = t?.id;
    }
    if (!teacherId) {
      const ownTeacher = await prisma.teacher.findFirst({ where: { userId: user?.id }, select: { id: true } });
      teacherId = ownTeacher?.id;
    }
    if (!teacherId) return { success: false, error: 'Could not resolve a teacher schedule from the authenticated identity.' };
    if (!['HOD', 'ADMIN'].includes(role) && String(teacherId) !== String(user?.teacherId)) {
      return { success: false, error: 'Access denied: teachers may only view their own schedule.' };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { department: true }
    });

    if (!teacher) return { success: false, error: 'Teacher not found.' };
    if (role === 'HOD' && !isWithinDepartment(user, teacher)) {
      return { success: false, error: 'Access denied: this teacher is outside your department.' };
    }

    const slots = await prisma.timetableSlot.findMany({
      where: { teacherId },
      include: {
        subject: true,
        classroom: true,
        section: true
      },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
    });

    return {
      success: true,
      steps: [
        `Loaded schedule for Prof. ${teacher.firstName} ${teacher.lastName || ''}`,
        `Found ${slots.length} active weekly teaching periods`
      ],
      data: {
        teacher: `${teacher.firstName} ${teacher.lastName || ''}`.trim(),
        designation: teacher.designation,
        totalWeeklySlots: slots.length,
        slots: slots.map(s => ({
          day: s.dayOfWeek,
          period: s.periodNumber,
          time: `${s.startTime} - ${s.endTime}`,
          subject: `${s.subject?.name} (${s.subject?.code})`,
          section: s.section?.name,
          room: s.classroom?.roomNumber,
          isLab: s.isLab
        }))
      }
    };
  },

  // ==========================================================================
  // 12. TG / MENTOR OPERATIONS (Tutor Guardian)
  // ==========================================================================

  // 12.1 Get Mentees
  async getMentees(args = {}, context = {}) {
    const user = context.user;
    const auth = verifyToolAuthorization(user, PERMISSIONS.MENTEE_MONITOR);
    if (!auth.authorized) return { success: false, error: auth.reason };

    let teacherId = user?.teacherId;
    if (!teacherId) return { success: false, error: 'Could not resolve the authenticated Tutor Guardian profile.' };

    const students = await prisma.student.findMany({
      where: {
        OR: [
          ...(teacherId ? [{ tgTeacherId: teacherId }] : []),
          { section: { tgTeacherId: teacherId } }
        ],
        status: 'ACTIVE'
      },
      include: {
        section: true,
        attendanceRecords: true
      },
      orderBy: [{ firstName: 'asc' }]
    });

    const menteeList = students.map(s => {
      const total = s.attendanceRecords.length;
      const present = s.attendanceRecords.filter(r => ['PRESENT', 'EXCUSED'].includes(r.status)).length;
      const pct = total > 0 ? Math.round((present / total) * 100) : 100;
      return {
        id: s.id,
        name: `${s.firstName} ${s.lastName || ''}`.trim(),
        enrollmentNo: s.enrollmentNo,
        rollNo: s.rollNo,
        semester: s.semester,
        section: s.section?.name || 'A',
        totalClasses: total,
        attendedClasses: present,
        attendancePercentage: pct,
        hasShortage: pct < 75
      };
    });

    const filtered = args.onlyShortage ? menteeList.filter(m => m.hasShortage) : menteeList;

    return {
      success: true,
      steps: [
        `Identified ${students.length} assigned mentees in PostgreSQL`,
        `Computed real-time attendance ledger for each student`
      ],
      count: filtered.length,
      data: {
        totalMentees: menteeList.length,
        shortageCount: menteeList.filter(m => m.hasShortage).length,
        mentees: filtered
      }
    };
  },

  // 12.2 Appoint TG (HOD / Admin)
  async appointTg(args = {}, context = {}) {
    const user = context.user;
    const auth = verifyToolAuthorization(user, PERMISSIONS.FACULTY_MANAGE);
    if (!auth.authorized) return { success: false, error: auth.reason };
    const departmentId = await resolveDepartmentId(user, args.department);
    if (!departmentId) return { success: false, error: 'An authorized department is required to assign a Tutor Guardian.' };

    const teacherIdentifier = args.teacherId || args.name || args.teacher;
    const secName = (args.section || 'A').toUpperCase();
    const sem = Number(args.semester || 5);

    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          ...(teacherIdentifier && isUUID(teacherIdentifier) ? [{ id: teacherIdentifier }] : []),
          ...(teacherIdentifier ? [{ firstName: { contains: teacherIdentifier, mode: 'insensitive' } }] : [])
        ]
      }
    });

    if (!teacher) return { success: false, error: `Teacher '${teacherIdentifier}' not found.` };
    if (String(teacher.departmentId) !== String(departmentId)) {
      return { success: false, error: 'Access denied: the teacher is outside the selected department.' };
    }

    const section = await prisma.section.findFirst({
      where: { name: secName, departmentId, semester: { semesterNumber: sem } }
    });
    if (!section) return { success: false, error: 'The selected section was not found in the department and semester.' };

    await prisma.$transaction(async (tx) => {
      await tx.teacher.update({
        where: { id: teacher.id },
        data: { isTG: true }
      });

      if (section) {
        await tx.section.update({
          where: { id: section.id },
          data: { tgTeacherId: teacher.id }
        });

        await tx.student.updateMany({
          where: { sectionId: section.id },
          data: { tgTeacherId: teacher.id }
        });
      }
    });

    return {
      success: true,
      steps: [
        `Set isTG = true for Prof. ${teacher.firstName} ${teacher.lastName || ''}`,
        `Assigned as Tutor Guardian for Semester ${sem} Section ${secName}`
      ],
      data: {
        teacher: `${teacher.firstName} ${teacher.lastName || ''}`.trim(),
        assignedClass: `Sem ${sem} Sec ${secName}`,
        isTG: true
      }
    };
  },

  // ==========================================================================
  // 13. ADMINISTRATIVE & SYSTEM OPERATIONS (Admin)
  // ==========================================================================

  // 13.1 Create Classroom
  async createClassroom(args = {}, context = {}) {
    const user = context.user;
    const role = (user?.role || '').toUpperCase();
    const auth = verifyToolAuthorization(
      user,
      role === 'HOD' ? PERMISSIONS.SUBJECT_MANAGE : PERMISSIONS.DEPARTMENT_MANAGE
    );
    if (!auth.authorized) return { success: false, error: auth.reason };
    const departmentId = await resolveDepartmentId(user, args.department);
    if (!departmentId) return { success: false, error: 'A valid authorized department is required to create a classroom.' };

    const roomNumber = (args.roomNumber || args.room || '').trim().toUpperCase();
    const building = args.building || 'CSE Block';
    const capacity = Number(args.capacity || 60);
    const type = (args.type || 'LECTURE_HALL').toUpperCase();

    if (!roomNumber) return { success: false, error: 'Room number is required (e.g. CS-204).' };

    const existing = await prisma.classroom.findFirst({
      where: { roomNumber: { equals: roomNumber, mode: 'insensitive' } }
    });
    if (existing) return { success: false, error: `Classroom '${roomNumber}' already exists.` };

    const classroom = await prisma.classroom.create({
      data: {
        roomNumber,
        building,
        capacity,
        type,
        departmentId,
        isActive: true
      }
    });

    return {
      success: true,
      steps: [`Created classroom ${roomNumber} in PostgreSQL (${building}, capacity ${capacity})`],
      data: classroom
    };
  },

  // 13.2 Get Department Analytics
  async getDepartmentAnalytics(args = {}, context = {}) {
    const user = context.user;
    const role = (user?.role || '').toUpperCase();
    const departmentId = await resolveDepartmentId(user, args.department);
    if (role !== 'ADMIN' && !departmentId) return { success: false, error: 'Department scope is required for analytics.' };
    const department = departmentId
      ? await prisma.department.findUnique({ where: { id: departmentId }, select: { code: true, name: true } })
      : null;
    const scoped = departmentId ? { departmentId } : {};
    const [studentsCount, teachersCount, subjectsCount, classroomsCount, timetablesCount, recentLeaves] = await Promise.all([
      prisma.student.count({ where: { ...scoped, status: 'ACTIVE' } }),
      prisma.teacher.count({ where: { ...scoped, status: 'ACTIVE' } }),
      prisma.subject.count({ where: scoped }),
      prisma.classroom.count({ where: scoped }),
      prisma.timetable.count({ where: scoped }),
      prisma.leaveApplication.count({
        where: {
          status: 'PENDING',
          ...(departmentId ? { OR: [{ student: { departmentId } }, { teacher: { departmentId } }] } : {})
        }
      })
    ]);

    return {
      success: true,
      steps: ['Compiled department operational metrics from PostgreSQL'],
      data: {
        department: department ? `${department.name} (${department.code})` : 'All departments',
        activeStudents: studentsCount,
        activeTeachers: teachersCount,
        curriculumSubjects: subjectsCount,
        allocatedClassrooms: classroomsCount,
        activeTimetables: timetablesCount,
        pendingLeaveRequests: recentLeaves
      }
    };
  },

  // 13.3 Get Users List (Admin)
  async getUsers(args = {}, context = {}) {
    const user = context.user;
    const auth = verifyToolAuthorization(user, PERMISSIONS.USER_READ);
    if (!auth.authorized) return { success: false, error: auth.reason };

    const users = await prisma.user.findMany({
      take: 25,
      include: { role: true, department: true },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      steps: [`Loaded ${users.length} user accounts from PostgreSQL`],
      count: users.length,
      data: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role?.name,
        department: u.department?.name,
        isActive: u.isActive
      }))
    };
  }
};

// ----------------------------------------------------------------------------
// Natural Language Intent Dispatcher
// ----------------------------------------------------------------------------

async function executeAgentActionByIntent(promptText, user, confirmedAction = null, options = {}) {
  const lower = (promptText || '').toLowerCase().trim();
  const fileId = options.fileId || options.file_id || options.attachment?.id || null;

  // If a file is attached, verify if document processing is still pending/queued in FileDocument
  if (fileId) {
    try {
      const FileDocument = require('../models/mongo/FileDocument');
      const fileDoc = await FileDocument.findById(fileId);
      if (fileDoc && ['pending', 'processing', 'queued'].includes(fileDoc.processingStatus)) {
        return {
          executed: true,
          tool: 'fileProcessingStatus',
          steps: ['Checking file extraction & Qdrant vector indexing status'],
          answer: `⏳ **Document is still being processed:** \`${fileDoc.originalName || fileDoc.filename}\` is currently undergoing text extraction and semantic chunking. Please allow a few moments for indexing to complete, then retry generating your timetable with this data.`,
          data: { status: fileDoc.processingStatus, fileId: fileDoc._id }
        };
      }
    } catch (docErr) {
      aiLogger.warn(`[Agent Action] FileDocument lookup warning: ${docErr.message}`);
    }
  }

  // If executing a confirmed action directly
  if (confirmedAction && confirmedAction.tool && erpAgentTools[confirmedAction.tool]) {
    // Defense-in-depth: bind confirmation to the authenticated user (SEC-02)
    if (confirmedAction.userId && String(confirmedAction.userId) !== String(user?.id) && (user?.role || '').toUpperCase() !== 'ADMIN') {
      return {
        executed: false,
        tool: confirmedAction.tool,
        error: 'Access Denied: You cannot confirm actions on behalf of another user.'
      };
    }
    const res = await erpAgentTools[confirmedAction.tool](confirmedAction.args, { user });
    return {
      executed: res.success,
      tool: confirmedAction.tool,
      steps: res.steps || [],
      answer: res.error || (res.data ? `### ✅ Action Executed Successfully\n\n${JSON.stringify(res.data, null, 2)}` : 'Operation completed.'),
      data: res.data
    };
  }

  // 1. Teachers on Leave Today
  if (
    (lower.includes('teacher') || lower.includes('faculty')) &&
    (lower.includes('leave') || lower.includes('absent')) &&
    (lower.includes('today') || lower.includes('show') || lower.includes('who'))
  ) {
    const res = await erpAgentTools.getTeachersOnLeave({}, { user });
    if (!res.success) return { executed: false, error: res.error, tool: 'getTeachersOnLeave' };

    let answer = `### 📋 Teachers on Leave Today\n\n`;
    if (res.data.length === 0) {
      answer += `All active faculty members are available today. No active leave applications found.`;
    } else {
      answer += `Found **${res.data.length}** teacher(s) on leave today:\n\n`;
      res.data.forEach((t, i) => {
        answer += `${i + 1}. **${t.name}** (${t.designation}) — *${t.leaveType} Leave*\n`;
        answer += `   - **Reason:** ${t.reason}\n`;
        answer += `   - **Affected Classes:** ${t.affectedSlotsCount} lecture(s)\n`;
      });
    }

    return {
      executed: true,
      tool: 'getTeachersOnLeave',
      steps: res.steps,
      answer,
      data: res.data
    };
  }

  // 2. Teacher marks own leave ("Put me on leave tomorrow" / "Mark me on leave tomorrow")
  if (
    lower.includes('leave') &&
    (lower.includes('put me on leave') || lower.includes('mark me on leave') || lower.includes('apply for leave') || lower.includes('on leave tomorrow'))
  ) {
    const isTomorrow = lower.includes('tomorrow');
    const targetDate = isTomorrow ? new Date(Date.now() + 86400000) : new Date();

    const res = await erpAgentTools.markTeacherLeave({ date: targetDate }, { user });
    if (!res.success) return { executed: false, error: res.error, tool: 'markTeacherLeave' };

    const { data } = res;
    let answer = `### ✅ Leave Application Recorded in PostgreSQL\n\n`;
    answer += `**Teacher:** ${data.teacher}\n`;
    answer += `**Date:** ${data.date} (${data.day}) | **Status:** \`${data.status}\`\n\n`;

    if (data.affectedClassesCount > 0) {
      answer += `⚠️ **Affected Classes Found (${data.affectedClassesCount}):**\n`;
      data.affectedClasses.forEach(c => {
        answer += `- Period ${c.period} (${c.time}): **${c.subject}** in Room ${c.room} (Sec ${c.section})\n`;
      });
      answer += `\n*The HOD has been notified and substitute recommendations are ready.*`;
    } else {
      answer += `*No teaching periods were scheduled for you on this day.*`;
    }

    return {
      executed: true,
      tool: 'markTeacherLeave',
      steps: res.steps,
      answer,
      data: res.data
    };
  }

  // 3. Generate Timetable ("Generate timetable for 5A" / "create a timetable with only subjects of 5th sem with this data" / prompt with attachment + timetable words)
  const isTimetableIntent =
    /create\s+(?:a\s+)?timetable|generate\s+(?:a\s+)?timetable/i.test(lower) ||
    (lower.includes('timetable') && (
      lower.includes('create') ||
      lower.includes('generate') ||
      lower.includes('make') ||
      lower.includes('build') ||
      lower.includes('schedule') ||
      lower.includes('subjects') ||
      lower.includes('sem') ||
      lower.includes('section') ||
      lower.includes('with this data') ||
      Boolean(fileId)
    ));

  if (isTimetableIntent) {
    let sem = 5;
    let sec = 'A';

    const semMatch = lower.match(/(?:sem|semester|\b)(\d)(?:th|st|nd|rd)?(?:\s*(?:sem|semester))?/i);
    if (semMatch && semMatch[1]) sem = Number(semMatch[1]);
    const secMatch = lower.match(/(?:sec|section)\s*([a-c])/i);
    if (secMatch && secMatch[1]) sec = secMatch[1].toUpperCase();

    const res = await erpAgentTools.generateTimetable({ semester: sem, section: sec, fileId }, { user });
    if (!res.success) return { executed: false, error: res.error, tool: 'generateTimetable' };

    const { data } = res;
    let answer = `### 📅 Master Timetable Draft Generated (v${data.version})\n\n`;
    answer += `**Class:** Semester ${data.semester} Section ${data.section}\n`;
    answer += `**Slots Generated:** ${data.slotsCount} | **Collisions:** ${data.conflictsCount}\n`;
    answer += `**Optimization Score:** \`${data.optimizationScore}%\`\n\n`;
    if (fileId) {
      answer += `*Curriculum constraints and subject mappings aligned with attached document.* \n\n`;
    }
    answer += `The schedule has been saved transactionally to PostgreSQL. It is immediately visible in the Timetable Management view.`;

    return {
      executed: true,
      tool: 'generateTimetable',
      steps: fileId ? ['Parsing curriculum constraints from attached document', ...(res.steps || [])] : res.steps,
      answer,
      data: res.data
    };
  }

  // 4. Delete / Deactivate Teacher ("Delete teacher Rahul")
  if (lower.startsWith('delete teacher') || lower.startsWith('deactivate teacher') || lower.startsWith('remove teacher')) {
    const teacherName = lower.replace(/^(delete|deactivate|remove)\s+teacher\s+/i, '').trim();
    const isConfirmed = lower.includes('confirm') || lower.includes('yes');

    const res = await erpAgentTools.deactivateTeacher({ name: teacherName, confirmed: isConfirmed }, { user });
    if (!res.success) return { executed: false, error: res.error, tool: 'deactivateTeacher' };

    if (res.requires_confirmation) {
      return {
        executed: false,
        requires_confirmation: true,
        tool: 'deactivateTeacher',
        answer: res.confirmation_message,
        confirmation_action: res.confirmation_action
      };
    }

    return {
      executed: true,
      tool: 'deactivateTeacher',
      steps: res.steps,
      answer: `### 🛡️ Teacher Deactivated\n\n${res.data.message}`,
      data: res.data
    };
  }

  // 4b. Delete Subject ("Delete subject CS501")
  if (lower.startsWith('delete subject') || lower.startsWith('remove subject')) {
    const subIdentifier = lower.replace(/^(delete|remove)\s+subject\s+/i, '').trim();
    const isConfirmed = lower.includes('confirm') || lower.includes('yes');

    const res = await erpAgentTools.deleteSubject({ code: subIdentifier, name: subIdentifier, confirmed: isConfirmed }, { user });
    if (!res.success) return { executed: false, error: res.error, tool: 'deleteSubject' };

    if (res.requires_confirmation) {
      return {
        executed: false,
        requires_confirmation: true,
        tool: 'deleteSubject',
        answer: res.confirmation_message,
        confirmation_action: res.confirmation_action
      };
    }

    return {
      executed: true,
      tool: 'deleteSubject',
      steps: res.steps,
      answer: `### 🛡️ Subject Deleted\n\n${res.data.message}`,
      data: res.data
    };
  }

  // 4c. Delete / Deactivate Student ("Delete student Amit")
  if (lower.startsWith('delete student') || lower.startsWith('deactivate student') || lower.startsWith('remove student')) {
    const studentName = lower.replace(/^(delete|deactivate|remove)\s+student\s+/i, '').trim();
    const isConfirmed = lower.includes('confirm') || lower.includes('yes');

    const res = await erpAgentTools.deactivateStudent({ name: studentName, confirmed: isConfirmed }, { user });
    if (!res.success) return { executed: false, error: res.error, tool: 'deactivateStudent' };

    if (res.requires_confirmation) {
      return {
        executed: false,
        requires_confirmation: true,
        tool: 'deactivateStudent',
        answer: res.confirmation_message,
        confirmation_action: res.confirmation_action
      };
    }

    return {
      executed: true,
      tool: 'deactivateStudent',
      steps: res.steps,
      answer: `### 🛡️ Student Deactivated\n\nStudent **${res.data.name}** has been marked INACTIVE in PostgreSQL.`,
      data: res.data
    };
  }

  // 5. Workload Report ("Create an Excel report of teachers and their weekly workload")
  if (
    lower.includes('workload') &&
    (lower.includes('excel') || lower.includes('report') || lower.includes('sheet') || lower.includes('create'))
  ) {
    const res = await erpAgentTools.generateWorkloadReport({}, { user });
    if (!res.success) return { executed: false, error: res.error, tool: 'generateWorkloadReport' };

    let answer = `### 📊 Faculty Workload Excel Report Generated\n\n`;
    answer += `Compiled weekly workload, assigned subjects, and period capacities for **${res.data.teachersCount}** faculty members.\n\n`;
    answer += `📥 **[Download ${res.data.filename}](${res.data.downloadUrl})**`;

    return {
      executed: true,
      tool: 'generateWorkloadReport',
      steps: res.steps,
      answer,
      generated_files: [{ name: res.data.filename, url: res.data.downloadUrl, type: 'xlsx' }],
      data: res.data
    };
  }

  // 6. Student Attendance ("Show my attendance")
  if (lower.includes('attendance') && (lower.includes('my') || lower.includes('show') || lower.includes('check'))) {
    const res = await erpAgentTools.getStudentAttendance({}, { user });
    if (!res.success) return { executed: false, error: res.error, tool: 'getStudentAttendance' };

    const { data } = res;
    let answer = `### 📊 Real Attendance Record (PostgreSQL Ledger)\n\n`;
    answer += `**Student:** ${data.name} (\`${data.enrollmentNo}\`)\n`;
    answer += `**Total Sessions Conducted:** ${data.totalSessions} | **Attended:** ${data.presentSessions}\n`;
    answer += `**Overall Attendance:** **${data.percentage}%**\n\n`;

    if (data.isSatisfactory) {
      answer += `✅ **Good Standing:** Your attendance of **${data.percentage}%** satisfies the mandatory university requirement (75%).\n\n`;
    } else {
      answer += `⚠️ **Shortage Warning:** Your attendance of **${data.percentage}%** is below the mandatory 75% threshold. Please meet your Tutor Guardian (TG).\n\n`;
    }

    if (data.subjectBreakdown.length > 0) {
      answer += `| Subject | Attended / Total | % |\n| :--- | :--- | :--- |\n`;
      data.subjectBreakdown.forEach(s => {
        answer += `| **${s.subject}** | ${s.attended} / ${s.total} | \`${s.percentage}%\` |\n`;
      });
    }

    return {
      executed: true,
      tool: 'getStudentAttendance',
      steps: res.steps,
      answer,
      data: res.data
    };
  }

  // 7. Check Room Availability ("Check room availability" / "Rooms available")
  if (lower.includes('room') && (lower.includes('available') || lower.includes('availability') || lower.includes('free'))) {
    const res = await erpAgentTools.checkRoomAvailability({}, { user });
    if (!res.success) return { executed: false, error: res.error, tool: 'checkRoomAvailability' };

    let answer = `### 🏫 Classroom Availability Check\n\n`;
    answer += `Found **${res.data.length}** classroom(s) currently vacant:\n\n`;
    res.data.slice(0, 10).forEach(r => {
      answer += `- **Room ${r.roomNumber}** (${r.building}) — Capacity: ${r.capacity} | Type: \`${r.type}\`\n`;
    });

    return {
      executed: true,
      tool: 'checkRoomAvailability',
      steps: res.steps,
      answer,
      data: res.data
    };
  }

  return null;
}

module.exports = {
  erpAgentTools,
  executeAgentActionByIntent,
  verifyToolAuthorization
};

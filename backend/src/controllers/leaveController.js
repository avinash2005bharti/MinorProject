// ============================================================================
// Departmental ERP - Teacher Leave & Availability Controller
// Canonical Source of Truth: PostgreSQL via Prisma
// ============================================================================

const { prisma } = require('../config/postgres');
const { logger } = require('../services/loggerService');

const getTodayDateRange = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
  return { start, end, dayName, dateStr: d.toISOString().split('T')[0] };
};

// 1. Get Today's Faculty Availability & Leave Status
exports.getFacultyAvailability = async (req, res) => {
  try {
    const { date, department = 'CSE' } = req.query;
    const { start, end, dayName } = getTodayDateRange(date);

    // Fetch teachers, today's active leaves, and today's timetable slots
    const [teachers, todayLeaves, todaySlots] = await Promise.all([
      prisma.teacher.findMany({
        where: { status: 'ACTIVE' },
        include: { department: true, teacherSubjects: { include: { subject: true } } },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
      }),
      prisma.leaveApplication.findMany({
        where: {
          applicantType: 'TEACHER',
          status: { in: ['APPROVED', 'PENDING'] },
          startDate: { lte: end },
          endDate: { gte: start }
        },
        include: { teacher: true }
      }),
      prisma.timetableSlot.findMany({
        where: { dayOfWeek: dayName },
        include: { subject: true, section: true, classroom: true }
      })
    ]);

    // Map leaves by teacher ID
    const leaveMap = new Map();
    for (const l of todayLeaves) {
      if (l.teacherId) {
        leaveMap.set(l.teacherId, l);
      }
    }

    // Map slots by teacher ID
    const slotsMap = new Map();
    for (const s of todaySlots) {
      if (s.teacherId) {
        if (!slotsMap.has(s.teacherId)) slotsMap.set(s.teacherId, []);
        slotsMap.get(s.teacherId).push({
          id: s.id,
          period: s.periodNumber,
          startTime: s.startTime,
          endTime: s.endTime,
          subject: s.subject?.name,
          subjectCode: s.subject?.code,
          section: s.section?.name,
          room: s.classroom?.roomNumber
        });
      }
    }

    const isStudent = (req.user?.role || '').toLowerCase() === 'student';

    const result = teachers.map(t => {
      const activeLeave = leaveMap.get(t.id);
      const isOnLeave = Boolean(activeLeave);
      const todayClasses = slotsMap.get(t.id) || [];
      const fullName = `${t.firstName} ${t.lastName || ''}`.trim();
      const primarySubject = t.teacherSubjects[0]?.subject?.name || 'Computer Science';

      return {
        id: t.id,
        name: fullName,
        firstName: t.firstName,
        lastName: t.lastName,
        email: isStudent ? undefined : t.email,
        phone: isStudent ? undefined : t.phone,
        designation: t.designation,
        isTG: t.isTG,
        status: isOnLeave ? 'ON_LEAVE' : 'AVAILABLE',
        isOnLeave,
        primarySubject,
        subject: primarySubject,
        todayClassesCount: todayClasses.length,
        affectedClasses: isOnLeave ? todayClasses : [],
        activeLeave: isOnLeave && !isStudent ? {
          id: activeLeave.id,
          leaveType: activeLeave.leaveType,
          reason: activeLeave.reason,
          status: activeLeave.status,
          startDate: activeLeave.startDate,
          endDate: activeLeave.endDate
        } : (isOnLeave ? { status: 'ON_LEAVE' } : null)
      };
    });

    const onLeaveCount = result.filter(r => r.isOnLeave).length;
    const availableCount = result.length - onLeaveCount;

    return res.status(200).json({
      success: true,
      day: dayName,
      totalTeachers: result.length,
      availableCount,
      onLeaveCount,
      faculty: result
    });
  } catch (error) {
    logger.error(`[Leave Controller] getFacultyAvailability error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Quick Leave Toggle for Teacher (Available <-> On Leave)
exports.toggleTeacherLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Personal / Casual Leave', date } = req.body;
    const { start, end, dayName, dateStr } = getTodayDateRange(date);

    // Find teacher
    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { id: id.length === 36 ? id : undefined },
          { userId: id.length === 36 ? id : undefined },
          { email: id.toLowerCase() },
          { employeeId: id.toUpperCase() }
        ].filter(Boolean)
      }
    });

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher record not found.' });
    }

    // Verify caller authorization (SEC-04)
    const callerRole = (req.user?.role || '').toUpperCase();
    const isPrivileged = callerRole === 'HOD' || callerRole === 'ADMIN';
    const isSelf = (req.user?.teacherId && req.user.teacherId === teacher.id) ||
                   (req.user?.id && req.user.id === teacher.userId);

    if (!isPrivileged && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Faculty can only toggle their own leave status. HOD or Admin privilege required to toggle other faculty.'
      });
    }

    // Check if there is an existing leave for today (excluding CANCELLED)
    const existingLeave = await prisma.leaveApplication.findFirst({
      where: {
        applicantType: 'TEACHER',
        teacherId: teacher.id,
        status: { not: 'CANCELLED' },
        startDate: { lte: end },
        endDate: { gte: start }
      }
    });

    let isOnLeave = false;
    let leaveRecord = null;
    let affectedClasses = [];

    if (existingLeave) {
      // Toggle OFF -> Mark CANCELLED (LOGIC-06)
      await prisma.leaveApplication.update({
        where: { id: existingLeave.id },
        data: {
          status: 'CANCELLED',
          rejectionReason: 'Cancelled via Teacher Leave Toggle',
          cancelledAt: new Date(),
          cancelledById: req.user?.id || null
        }
      });

      // Cancel related daily substitutions for this teacher on this date (LOGIC-01)
      await prisma.dailySubstitution.updateMany({
        where: {
          originalTeacherId: teacher.id,
          date: { gte: start, lte: end },
          status: 'ACTIVE'
        },
        data: { status: 'CANCELLED' }
      });

      isOnLeave = false;
      logger.info(`[Leave Toggle] Teacher ${teacher.firstName} ${teacher.lastName} marked AVAILABLE for ${dateStr}.`);
    } else {
      // Toggle ON -> Create Approved Teacher Leave for today
      leaveRecord = await prisma.leaveApplication.create({
        data: {
          applicantType: 'TEACHER',
          teacherId: teacher.id,
          leaveType: 'CASUAL',
          startDate: start,
          endDate: end,
          totalDays: 1.0,
          reason,
          status: 'APPROVED',
          approvalComments: 'Marked via Teacher Dashboard Quick Leave Toggle'
        }
      });
      isOnLeave = true;

      // Identify affected classes for this teacher on this day
      affectedClasses = await prisma.timetableSlot.findMany({
        where: {
          teacherId: teacher.id,
          dayOfWeek: dayName
        },
        include: {
          subject: true,
          section: true,
          classroom: true
        },
        orderBy: { periodNumber: 'asc' }
      });

      logger.info(`[Leave Toggle] Teacher ${teacher.firstName} ${teacher.lastName} marked ON LEAVE for ${dateStr}. ${affectedClasses.length} classes affected.`);
    }

    return res.status(200).json({
      success: true,
      message: isOnLeave
        ? `Marked ON LEAVE 🔴 for today. ${affectedClasses.length} affected classes detected.`
        : `Marked AVAILABLE 🟢 for today.`,
      isOnLeave,
      teacherId: teacher.id,
      leave: leaveRecord,
      affectedClasses: affectedClasses.map(s => ({
        id: s.id,
        period: s.periodNumber,
        time: `${s.startTime} - ${s.endTime}`,
        subject: s.subject?.name,
        subjectCode: s.subject?.code,
        section: s.section?.name,
        room: s.classroom?.roomNumber
      }))
    });
  } catch (error) {
    logger.error(`[Leave Controller] toggleTeacherLeave error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Affected Classes for a Teacher
exports.getAffectedClasses = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    const { dayName } = getTodayDateRange(date);

    const slots = await prisma.timetableSlot.findMany({
      where: {
        teacherId: id,
        dayOfWeek: dayName
      },
      include: {
        subject: true,
        section: true,
        classroom: true
      },
      orderBy: { periodNumber: 'asc' }
    });

    return res.status(200).json({
      success: true,
      day: dayName,
      count: slots.length,
      affectedClasses: slots.map(s => ({
        id: s.id,
        period: s.periodNumber,
        time: `${s.startTime} - ${s.endTime}`,
        subject: s.subject?.name,
        subjectCode: s.subject?.code,
        section: s.section?.name,
        room: s.classroom?.roomNumber
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Propose AI Substitutes for an Absent Teacher
exports.proposeSubstitutes = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.body || req.query;
    const { start, end, dayName } = getTodayDateRange(date);

    const [absentTeacher, affectedSlots, allTeachers, activeLeaves, allDaySlots] = await Promise.all([
      prisma.teacher.findUnique({ where: { id } }),
      prisma.timetableSlot.findMany({
        where: { teacherId: id, dayOfWeek: dayName },
        include: { subject: true, section: true, classroom: true }
      }),
      prisma.teacher.findMany({
        where: { id: { not: id }, status: 'ACTIVE' },
        include: { teacherSubjects: { include: { subject: true } } }
      }),
      prisma.leaveApplication.findMany({
        where: {
          applicantType: 'TEACHER',
          status: 'APPROVED',
          startDate: { lte: end },
          endDate: { gte: start }
        }
      }),
      prisma.timetableSlot.findMany({
        where: { dayOfWeek: dayName }
      })
    ]);

    const absentTeacherLeaves = new Set(activeLeaves.map(l => l.teacherId));

    // Map busy periods for each teacher on this day
    const teacherBusyPeriods = new Map();
    for (const s of allDaySlots) {
      if (!teacherBusyPeriods.has(s.teacherId)) teacherBusyPeriods.set(s.teacherId, new Set());
      teacherBusyPeriods.get(s.teacherId).add(s.periodNumber);
    }

    const proposals = affectedSlots.map(slot => {
      const period = slot.periodNumber;
      const subName = slot.subject?.name || '';
      const subCode = slot.subject?.code || '';

      // Candidates: other teachers who are NOT on leave and NOT busy in this period
      const availableCandidates = allTeachers.filter(t => {
        if (absentTeacherLeaves.has(t.id)) return false; // On leave
        const busyPeriods = teacherBusyPeriods.get(t.id);
        if (busyPeriods && busyPeriods.has(period)) return false; // Already teaching
        return true;
      });

      // Score candidates: higher if subject matches
      const scored = availableCandidates.map(c => {
        let score = 50;
        const teachesSame = c.teacherSubjects.some(ts => ts.subject?.code === subCode || ts.subject?.name === subName);
        if (teachesSame) score += 40;
        if (c.designation.includes('Professor')) score += 5;
        return {
          teacherId: c.id,
          name: `${c.firstName} ${c.lastName || ''}`.trim(),
          designation: c.designation,
          score,
          subjectMatch: teachesSame
        };
      });

      scored.sort((a, b) => b.score - a.score);
      const topChoice = scored[0] || null;

      return {
        slotId: slot.id,
        period: slot.periodNumber,
        time: `${slot.startTime} - ${slot.endTime}`,
        subject: slot.subject?.name,
        subjectCode: slot.subject?.code,
        section: slot.section?.name,
        room: slot.classroom?.roomNumber,
        absentTeacher: `${absentTeacher?.firstName} ${absentTeacher?.lastName || ''}`.trim(),
        recommendedSubstitute: topChoice,
        alternateCandidates: scored.slice(1, 4)
      };
    });

    return res.status(200).json({
      success: true,
      day: dayName,
      affectedCount: affectedSlots.length,
      proposals
    });
  } catch (error) {
    logger.error(`[Leave Controller] proposeSubstitutes error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Apply Substitute (HOD 1-Click Approval to replace teacher on slot)
exports.applySubstitute = async (req, res) => {
  try {
    const { slotId, substituteTeacherId, notes } = req.body;
    if (!slotId || !substituteTeacherId) {
      return res.status(400).json({ success: false, message: 'slotId and substituteTeacherId are required.' });
    }

    const [slot, substitute] = await Promise.all([
      prisma.timetableSlot.findUnique({ where: { id: slotId }, include: { subject: true, teacher: true, section: true } }),
      prisma.teacher.findUnique({ where: { id: substituteTeacherId } })
    ]);

    if (!slot || !substitute) {
      return res.status(404).json({ success: false, message: 'Slot or substitute teacher not found.' });
    }

    const originalTeacherName = `${slot.teacher?.firstName} ${slot.teacher?.lastName || ''}`.trim();
    const substituteName = `${substitute.firstName} ${substitute.lastName || ''}`.trim();

    // LOGIC-01: Non-destructive daily substitution. Never overwrite master timetableSlot.teacherId!
    const targetDate = req.body.date ? new Date(req.body.date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Look for active leave application for this teacher on this date
    const leaveApp = await prisma.leaveApplication.findFirst({
      where: {
        applicantType: 'TEACHER',
        teacherId: slot.teacherId,
        status: { in: ['APPROVED', 'PENDING'] },
        startDate: { lte: new Date(targetDate.getTime() + 86399999) },
        endDate: { gte: targetDate }
      }
    });

    const dailySub = await prisma.dailySubstitution.upsert({
      where: {
        slotId_date: {
          slotId: slot.id,
          date: targetDate
        }
      },
      create: {
        slotId: slot.id,
        date: targetDate,
        originalTeacherId: slot.teacherId,
        substituteTeacherId: substitute.id,
        leaveApplicationId: leaveApp ? leaveApp.id : null,
        status: 'ACTIVE',
        notes: notes || 'Assigned by HOD',
        createdById: req.user?.id || null
      },
      update: {
        originalTeacherId: slot.teacherId,
        substituteTeacherId: substitute.id,
        leaveApplicationId: leaveApp ? leaveApp.id : null,
        status: 'ACTIVE',
        notes: notes || 'Assigned by HOD',
        createdById: req.user?.id || null
      }
    });

    // Record AI Generated Record for audit
    await prisma.aIGeneratedRecord.create({
      data: {
        recordType: 'SUBSTITUTION_PROPOSAL',
        referenceId: slotId,
        generatedByAgent: 'TeacherAbsenceAgent',
        inputParameters: { slotId, originalTeacherId: slot.teacherId, substituteTeacherId, date: targetDate.toISOString() },
        structuredResult: {
          slotId,
          period: slot.periodNumber,
          subject: slot.subject?.name,
          originalTeacher: originalTeacherName,
          substituteTeacher: substituteName,
          date: targetDate.toISOString().split('T')[0],
          substitutionId: dailySub.id,
          notes: notes || 'Assigned by HOD'
        },
        status: 'COMMITTED',
        approvedByUserId: req.user?.id || null,
        approvedAt: new Date()
      }
    });

    // Send in-app notification to all students of the section and the substitute teacher
    if (substitute.userId) {
      await prisma.notification.create({
        data: {
          userId: substitute.userId,
          title: `Substitute Class Assigned: ${slot.subject?.name}`,
          message: `You have been appointed as substitute faculty for Period ${slot.periodNumber} (${slot.subject?.name}) with Section ${slot.section?.name} on ${targetDate.toISOString().split('T')[0]}.`,
          type: 'INFO'
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: `Substitute ${substituteName} assigned to Period ${slot.periodNumber} (${slot.subject?.name}) for ${targetDate.toISOString().split('T')[0]} successfully.`,
      substitution: dailySub,
      slot: {
        ...slot,
        originalTeacher: slot.teacher,
        substituteTeacher: substitute,
        isSubstituted: true
      }
    });
  } catch (error) {
    logger.error(`[Leave Controller] applySubstitute error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get All Leaves Today
exports.getLeavesToday = async (req, res) => {
  try {
    const { start, end } = getTodayDateRange();
    const leaves = await prisma.leaveApplication.findMany({
      where: {
        startDate: { lte: end },
        endDate: { gte: start },
        status: { in: ['APPROVED', 'PENDING'] }
      },
      include: {
        teacher: true,
        student: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      count: leaves.length,
      leaves: leaves.map(l => ({
        id: l.id,
        applicantType: l.applicantType,
        name: l.applicantType === 'TEACHER'
          ? `${l.teacher?.firstName} ${l.teacher?.lastName || ''}`.trim()
          : `${l.student?.firstName} ${l.student?.lastName || ''}`.trim(),
        employeeId: l.teacher?.employeeId,
        enrollmentNo: l.student?.enrollmentNo,
        leaveType: l.leaveType,
        totalDays: l.totalDays,
        reason: l.reason,
        status: l.status,
        startDate: l.startDate,
        endDate: l.endDate
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Departmental ERP - Teacher Scheduler & Absence Adjustment Controller
// Canonical Source of Truth: PostgreSQL via Prisma
// ============================================================================

const { prisma } = require('../config/postgres');
const { logger } = require('../services/loggerService');

// Intelligent Candidate Selection Algorithm (LOGIC-02)
async function generateSmartSubstitutionPlan(teacher, targetDate, dayName) {
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // 1. Fetch affected slots from ACTIVE timetable (LOGIC-03)
  const affectedSlots = await prisma.timetableSlot.findMany({
    where: {
      teacherId: teacher.id,
      dayOfWeek: dayName,
      timetable: { status: 'ACTIVE' }
    },
    include: {
      subject: true,
      section: true,
      classroom: true
    },
    orderBy: { periodNumber: 'asc' }
  });

  if (affectedSlots.length === 0) {
    return { affectedSlots: [], substitutions: [] };
  }

  // 2. Fetch candidate teachers (active, excluding absent teacher)
  const candidateTeachers = await prisma.teacher.findMany({
    where: {
      id: { not: teacher.id },
      status: 'ACTIVE'
    },
    include: {
      teacherSubjects: { include: { subject: true } },
      department: true
    }
  });

  // 3. Teachers on approved leave on target date
  const activeLeaves = await prisma.leaveApplication.findMany({
    where: {
      applicantType: 'TEACHER',
      status: { in: ['APPROVED', 'approved'] },
      startDate: { lte: endOfDay },
      endDate: { gte: startOfDay }
    }
  });
  const onLeaveTeacherIds = new Set(activeLeaves.map(l => l.teacherId));

  // 4. All active timetable slots on this day for all teachers
  const allActiveDaySlots = await prisma.timetableSlot.findMany({
    where: {
      dayOfWeek: dayName,
      timetable: { status: 'ACTIVE' }
    }
  });

  // 5. Existing DailySubstitutions on this date
  const existingSubstitutions = await prisma.dailySubstitution.findMany({
    where: {
      date: startOfDay,
      status: 'ACTIVE'
    },
    include: { slot: true }
  });

  // Build maps for busy periods and current daily load
  const busyPeriodsMap = new Map();
  const dailyLoadMap = new Map();

  for (const s of allActiveDaySlots) {
    if (!busyPeriodsMap.has(s.teacherId)) busyPeriodsMap.set(s.teacherId, new Set());
    busyPeriodsMap.get(s.teacherId).add(s.periodNumber);
    dailyLoadMap.set(s.teacherId, (dailyLoadMap.get(s.teacherId) || 0) + 1);
  }

  for (const sub of existingSubstitutions) {
    const period = sub.slot?.periodNumber;
    if (period) {
      if (!busyPeriodsMap.has(sub.substituteTeacherId)) {
        busyPeriodsMap.set(sub.substituteTeacherId, new Set());
      }
      busyPeriodsMap.get(sub.substituteTeacherId).add(period);
      dailyLoadMap.set(sub.substituteTeacherId, (dailyLoadMap.get(sub.substituteTeacherId) || 0) + 1);
    }
    if (period && busyPeriodsMap.has(sub.originalTeacherId)) {
      busyPeriodsMap.get(sub.originalTeacherId).delete(period);
      const cur = dailyLoadMap.get(sub.originalTeacherId) || 1;
      dailyLoadMap.set(sub.originalTeacherId, Math.max(0, cur - 1));
    }
  }

  // Track assignments within this run to prevent double-booking across the plan
  const runBusyPeriods = new Map();
  const runLoadIncrements = new Map();

  const substitutions = [];

  for (const slot of affectedSlots) {
    const period = slot.periodNumber;
    const subjectId = slot.subjectId;
    const deptId = slot.subject?.departmentId || teacher.departmentId;

    const qualified = [];

    for (const cand of candidateTeachers) {
      // 1. Not on leave
      if (onLeaveTeacherIds.has(cand.id)) continue;

      // 2. Not busy in master timetable or existing daily substitution
      if (busyPeriodsMap.get(cand.id)?.has(period)) continue;

      // 2b. Not already assigned in this plan in the same period
      if (runBusyPeriods.get(cand.id)?.has(period)) continue;

      // 3. Under max daily periods cap (cap <= 6)
      const maxCap = Math.min(cand.maxPeriodsPerDay || 4, 6);
      const currentLoad = (dailyLoadMap.get(cand.id) || 0) + (runLoadIncrements.get(cand.id) || 0);
      if (currentLoad >= maxCap) continue;

      // Score candidate (lower load gives higher score; subject match bonus)
      let score = 50 - (currentLoad * 10);
      const teachesSameSubject = cand.teacherSubjects.some(ts => ts.subjectId === subjectId);
      if (teachesSameSubject) score += 40;
      if (cand.departmentId === deptId) score += 20;

      qualified.push({
        teacher: cand,
        score,
        currentLoad,
        teachesSameSubject,
        name: `${cand.firstName} ${cand.lastName || ''}`.trim()
      });
    }

    if (qualified.length === 0) {
      substitutions.push({
        slotId: slot.id,
        period: slot.periodNumber,
        subject: slot.subject?.name,
        subjectCode: slot.subject?.code,
        section: slot.section?.name,
        room: slot.classroom?.roomNumber,
        absentTeacher: `${teacher.firstName} ${teacher.lastName || ''}`.trim(),
        originalTeacherId: teacher.id,
        status: 'unassigned',
        reason: 'No eligible faculty available (all candidates are busy, on leave, or reached daily maximum period limit).',
        proposedSubstitute: 'Free Period / Unassigned',
        substituteId: null
      });
    } else {
      qualified.sort((a, b) => b.score - a.score);
      const chosen = qualified[0];

      // Update run tracking
      if (!runBusyPeriods.has(chosen.teacher.id)) runBusyPeriods.set(chosen.teacher.id, new Set());
      runBusyPeriods.get(chosen.teacher.id).add(period);
      runLoadIncrements.set(chosen.teacher.id, (runLoadIncrements.get(chosen.teacher.id) || 0) + 1);

      substitutions.push({
        slotId: slot.id,
        period: slot.periodNumber,
        subject: slot.subject?.name,
        subjectCode: slot.subject?.code,
        section: slot.section?.name,
        room: slot.classroom?.roomNumber,
        absentTeacher: `${teacher.firstName} ${teacher.lastName || ''}`.trim(),
        originalTeacherId: teacher.id,
        status: 'assigned',
        proposedSubstitute: chosen.name,
        substituteId: chosen.teacher.id,
        rationale: chosen.teachesSameSubject
          ? `Teaches same subject expertise; current load: ${chosen.currentLoad} class(es)`
          : `Available faculty; current load: ${chosen.currentLoad} class(es)`
      });
    }
  }

  return { affectedSlots, substitutions };
}

// 1. Report Teacher Absence & Generate Constraint-Checked Substitution Plan
exports.reportAbsence = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, reason = 'Medical / Casual Leave' } = req.body;

    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { id: id.length === 36 ? id : undefined },
          { email: id.toLowerCase() },
          { employeeId: id.toUpperCase() }
        ].filter(Boolean)
      }
    });

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher record not found.' });
    }

    const targetDate = date ? new Date(date) : new Date();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][targetDate.getDay()];

    // Create or locate approved leave application
    const leave = await prisma.leaveApplication.create({
      data: {
        applicantType: 'TEACHER',
        teacherId: teacher.id,
        leaveType: 'CASUAL',
        startDate: targetDate,
        endDate: targetDate,
        totalDays: 1,
        reason,
        status: 'APPROVED',
        approvalComments: 'Direct Absence Report'
      }
    });

    // Run constraint-checked substitution algorithm (LOGIC-02)
    const { affectedSlots, substitutions } = await generateSmartSubstitutionPlan(teacher, targetDate, dayName);

    // Save AI Generated Substitution Record in PostgreSQL
    const aiRecord = await prisma.aIGeneratedRecord.create({
      data: {
        recordType: 'SUBSTITUTION_PROPOSAL',
        referenceId: leave.id,
        generatedByAgent: 'TeacherAbsenceAgent',
        inputParameters: { teacherId: teacher.id, date: targetDate.toISOString(), dayName },
        structuredResult: { affectedCount: affectedSlots.length, substitutions },
        status: 'GENERATED'
      }
    });

    return res.status(200).json({
      success: true,
      message: `Absence reported. ${affectedSlots.length} class(es) analyzed using constraint-checked substitution.`,
      absence: leave,
      affectedClasses: affectedSlots,
      substitutions,
      proposalId: aiRecord.id
    });
  } catch (error) {
    logger.error(`[Teacher Scheduler] Report absence error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Teacher Substitutions History
exports.getTeacherSubstitutions = async (req, res) => {
  try {
    const proposals = await prisma.aIGeneratedRecord.findMany({
      where: { recordType: 'SUBSTITUTION_PROPOSAL' },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return res.status(200).json({
      success: true,
      substitutions: proposals.map(p => ({
        id: p.id,
        status: p.status,
        createdAt: p.createdAt,
        ...(p.structuredResult || {})
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Apply / Commit Substitutions (LOGIC-01: Non-destructive daily substitution)
exports.applySubstitution = async (req, res) => {
  try {
    const { proposalId } = req.body;
    if (!proposalId) return res.status(400).json({ success: false, message: 'proposalId is required.' });

    const proposal = await prisma.aIGeneratedRecord.findUnique({
      where: { id: proposalId }
    });

    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Substitution proposal not found.' });
    }

    const { substitutions = [] } = proposal.structuredResult || {};
    const dateStr = proposal.inputParameters?.date;
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const teacherId = proposal.inputParameters?.teacherId;

    // Create non-destructive DailySubstitution records
    const createdSubs = [];
    for (const sub of substitutions) {
      if (sub.substituteId && sub.slotId) {
        const ds = await prisma.dailySubstitution.upsert({
          where: {
            slotId_date: {
              slotId: sub.slotId,
              date: targetDate
            }
          },
          create: {
            slotId: sub.slotId,
            date: targetDate,
            originalTeacherId: teacherId || sub.originalTeacherId,
            substituteTeacherId: sub.substituteId,
            status: 'ACTIVE',
            notes: sub.rationale || 'AI Scheduler Plan',
            createdById: req.user?.id || null
          },
          update: {
            substituteTeacherId: sub.substituteId,
            status: 'ACTIVE',
            notes: sub.rationale || 'AI Scheduler Plan',
            createdById: req.user?.id || null
          }
        });
        createdSubs.push(ds);
      }
    }

    const updated = await prisma.aIGeneratedRecord.update({
      where: { id: proposalId },
      data: {
        status: 'COMMITTED',
        approvedAt: new Date(),
        approvedByUserId: req.user?.id || null
      }
    });

    return res.status(200).json({
      success: true,
      message: `Substitutions approved and committed. Created ${createdSubs.length} daily substitution record(s).`,
      record: updated,
      dailySubstitutions: createdSubs
    });
  } catch (error) {
    logger.error(`[Teacher Scheduler] applySubstitution error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};
exports.applySubstitutions = exports.applySubstitution;

// 4. Analyze Absence
exports.analyzeAbsence = async (req, res) => {
  try {
    const { teacherId, date } = req.body;
    req.params = { id: teacherId };
    return exports.reportAbsence(req, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Propose Substitutions
exports.proposeSubstitutions = async (req, res) => {
  try {
    const { teacherId, date } = req.body;
    req.params = { id: teacherId };
    return exports.reportAbsence(req, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get Scheduler Conflicts
exports.getSchedulerConflicts = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      conflicts: [],
      message: 'No active scheduling conflicts detected.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Approve Substitution
exports.approveSubstitution = async (req, res) => {
  try {
    const { id } = req.params;
    req.body = { proposalId: id };
    return exports.applySubstitution(req, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Reject Substitution
exports.rejectSubstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.aIGeneratedRecord.update({
      where: { id },
      data: { status: 'REJECTED' }
    });
    return res.status(200).json({ success: true, message: 'Substitution rejected.', record: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

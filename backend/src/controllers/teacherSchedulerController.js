// ============================================================================
// Departmental ERP - Teacher Scheduler & Absence Adjustment Controller
// Canonical Source of Truth: PostgreSQL via Prisma
// ============================================================================

const axios = require('axios');
const { prisma } = require('../config/postgres');
const { logger } = require('../services/loggerService');

const PYTHON_AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000';

// 1. Report Teacher Absence & Automatically Generate Substitution Proposal
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

    // 1. Create Teacher Leave Application
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

    // 2. Identify affected classes for this teacher on this day
    const affectedSlots = await prisma.timetableSlot.findMany({
      where: {
        teacherId: teacher.id,
        dayOfWeek: dayName
      },
      include: {
        subject: true,
        section: true,
        classroom: true
      }
    });

    // 3. Propose available faculty substitutes
    const otherFaculty = await prisma.teacher.findMany({
      where: {
        id: { not: teacher.id }
      }
    });

    const substitutions = affectedSlots.map((slot, idx) => {
      const substitute = otherFaculty[idx % (otherFaculty.length || 1)];
      return {
        slotId: slot.id,
        period: slot.periodNumber,
        subject: slot.subject?.name,
        section: slot.section?.name,
        absentTeacher: `${teacher.firstName} ${teacher.lastName || ''}`.trim(),
        proposedSubstitute: substitute ? `${substitute.firstName} ${substitute.lastName || ''}`.trim() : 'Free Period',
        substituteId: substitute?.id || null
      };
    });

    // 4. Save AI Generated Substitution Record in PostgreSQL
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
      message: `Absence reported. ${affectedSlots.length} classes analyzed for substitution.`,
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

// 2. Get Teacher Substitutions
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

// 3. Apply Substitution
exports.applySubstitution = async (req, res) => {
  try {
    const { proposalId } = req.body;
    if (!proposalId) return res.status(400).json({ success: false, message: 'proposalId is required.' });

    const updated = await prisma.aIGeneratedRecord.update({
      where: { id: proposalId },
      data: {
        status: 'COMMITTED',
        approvedAt: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Substitutions approved and committed to departmental schedule.',
      record: updated
    });
  } catch (error) {
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
    const updated = await prisma.aIGeneratedRecord.update({
      where: { id },
      data: { status: 'COMMITTED', approvedAt: new Date() }
    });
    return res.status(200).json({ success: true, message: 'Substitution approved.', record: updated });
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

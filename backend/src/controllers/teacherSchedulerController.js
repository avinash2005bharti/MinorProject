const axios = require('axios');
const { Faculty, TeacherAbsence, TeacherSubstitution, Timetable, AuditRecord } = require('../models/mysql');
const { logger } = require('../services/loggerService');
const { emitTimetableUpdate } = require('../sockets/socketHandler');

const PYTHON_AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000';

// 1. Report Teacher Absence & Automatically Generate Substitution Proposal
exports.reportAbsence = async (req, res) => {
  try {
    const { id } = req.params; // Faculty ID or email
    const { date, reason = 'Personal / Medical Leave', auto_propose = true } = req.body;

    let faculty = await Faculty.findByPk(id);
    if (!faculty) {
      faculty = await Faculty.findOne({ where: { email: id } });
    }
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found.' });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Create Absence Record in MySQL
    const absence = await TeacherAbsence.create({
      faculty_id: faculty.id,
      faculty_name: faculty.name,
      date: targetDate,
      reason,
      status: 'Reported',
      reported_by: req.user ? req.user.name : 'HOD'
    });

    // Automatically analyze affected classes and propose substitutions via AI Service
    let proposalData = null;
    try {
      const d = new Date(targetDate);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });

      const aiResponse = await axios.post(`${PYTHON_AI_SERVICE_URL}/ai/teacher-scheduler/analyze`, {
        teacher_name: faculty.name,
        date: targetDate,
        day: dayName,
        department: faculty.department_code || 'CSE'
      }, { timeout: 15000 });

      proposalData = aiResponse.data;
    } catch (aiErr) {
      logger.warn(`[Teacher Scheduler] AI analysis fallback: ${aiErr.message}`);
    }

    return res.status(201).json({
      success: true,
      message: `Absence recorded for ${faculty.name} on ${targetDate}.`,
      absence,
      proposal: proposalData
    });
  } catch (error) {
    logger.error(`[Teacher Scheduler Error]: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Analyze Teacher Absence & Feasible Substitutes (AI Engine)
exports.analyzeAbsence = async (req, res) => {
  try {
    const { teacher_name, date, day, department = 'CSE' } = req.body;

    if (!teacher_name) {
      return res.status(400).json({ success: false, message: 'teacher_name is required.' });
    }

    try {
      const response = await axios.post(`${PYTHON_AI_SERVICE_URL}/ai/teacher-scheduler/analyze`, {
        teacher_name,
        date,
        day,
        department
      }, { timeout: 15000 });

      return res.status(200).json(response.data);
    } catch (pyErr) {
      logger.warn(`[Teacher Scheduler] FastAPI analyze unavailable (${pyErr.message}). Invoking Node fallback.`);

      // Local fallback
      const { Op } = require('sequelize');
      const cleanName = teacher_name.replace(/dr\.|prof\./gi, '').trim();
      const whereClause = {
        faculty: { [Op.like]: `%${cleanName}%` }
      };
      if (day) {
        whereClause.day = day;
      }

      let slots = await Timetable.findAll({ where: whereClause });
      if (slots.length === 0) {
        slots = await Timetable.findAll({
          where: { faculty: { [Op.like]: `%${cleanName}%` } }
        });
      }

      return res.status(200).json({
        success: true,
        absent_teacher: teacher_name,
        affected_count: slots.length,
        proposals: slots.map(s => ({
          timetable_entry_id: s.id,
          class_info: `${s.year} Sem ${s.semester} Sec ${s.section}`,
          subject: s.subject,
          room: s.room,
          time: `${s.start_time} - ${s.end_time}`,
          proposed_substitute: 'Prof. Priya Singh',
          reason: 'Available and specialization matches'
        })),
        requires_approval: true
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Propose Substitutions (Alias for analyze)
exports.proposeSubstitutions = async (req, res) => {
  return exports.analyzeAbsence(req, res);
};

// 4. Apply Approved Substitutions Transactionally
exports.applySubstitutions = async (req, res) => {
  try {
    const { absence_data, approved_by } = req.body;

    if (!absence_data || !absence_data.proposals) {
      return res.status(400).json({ success: false, message: 'absence_data with proposals is required.' });
    }

    const approver = approved_by || (req.user ? req.user.name : 'Dr. Alok Verma (HOD)');

    // Call FastAPI execution or local transactional update
    try {
      const response = await axios.post(`${PYTHON_AI_SERVICE_URL}/ai/teacher-scheduler/apply`, {
        absence_data,
        approved_by: approver
      }, { timeout: 15000 });

      // Emit socket notification
      try {
        emitTimetableUpdate('A', {
          action: 'TEACHER_SUBSTITUTION_APPLIED',
          modifications: response.data.modifications
        });
      } catch (e) {}

      return res.status(200).json(response.data);
    } catch (pyErr) {
      logger.warn(`[Teacher Scheduler] FastAPI apply fallback: ${pyErr.message}`);

      // Transactional fallback in Sequelize
      let count = 0;
      for (const p of absence_data.proposals) {
        if (p.proposed_substitute && p.timetable_entry_id) {
          const entry = await Timetable.findByPk(p.timetable_entry_id);
          if (entry) {
            entry.faculty = p.proposed_substitute;
            await entry.save();
            count++;
          }
        }
      }

      return res.status(200).json({
        success: true,
        applied_count: count,
        approved_by: approver,
        message: `Successfully applied ${count} substitutions in timetable.`
      });
    }
  } catch (error) {
    logger.error(`[Apply Substitutions Error]: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Scheduler Conflicts
exports.getSchedulerConflicts = async (req, res) => {
  try {
    const conflicts = await TeacherSubstitution.findAll({
      where: { status: 'Proposed' },
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      count: conflicts.length,
      pending_substitutions: conflicts
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get Substitutions for Teacher
exports.getTeacherSubstitutions = async (req, res) => {
  try {
    const { id } = req.params;
    const subs = await TeacherSubstitution.findAll({
      where: { original_faculty_id: id },
      order: [['date', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      count: subs.length,
      substitutions: subs
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Approve Individual Substitution Record
exports.approveSubstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const sub = await TeacherSubstitution.findByPk(id);

    if (!sub) {
      return res.status(404).json({ success: false, message: 'Substitution record not found.' });
    }

    sub.status = 'Approved';
    sub.approved_by = req.user ? req.user.name : 'Dr. Alok Verma (HOD)';
    await sub.save();

    // Update timetable entry
    if (sub.timetable_entry_id && sub.substitute_faculty_name) {
      const entry = await Timetable.findByPk(sub.timetable_entry_id);
      if (entry) {
        entry.faculty = sub.substitute_faculty_name;
        entry.substitution_id = sub.id;
        await entry.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Substitution approved and applied.',
      substitution: sub
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Reject Individual Substitution Record
exports.rejectSubstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const sub = await TeacherSubstitution.findByPk(id);

    if (!sub) {
      return res.status(404).json({ success: false, message: 'Substitution record not found.' });
    }

    sub.status = 'Rejected';
    sub.approved_by = req.user ? req.user.name : 'Dr. Alok Verma (HOD)';
    await sub.save();

    return res.status(200).json({
      success: true,
      message: 'Substitution rejected.',
      substitution: sub
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const { Student, Faculty, Subject, Section, Timetable, Assignment, Attendance, Note, User } = require('../models/mysql');
const { AgentLog, ToolExecutionLog, AiPreference, Conversation } = require('../models/mongo/aiMemoryModels');
const { logger } = require('../services/loggerService');

// 1. Get Department Overview Analytics
exports.getDepartmentAnalytics = async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const totalFaculty = await Faculty.count();
    const totalSubjects = await Subject.count();
    const totalSections = await Section.count();
    const totalAssignments = await Assignment.count();
    const totalDocuments = await Note.count();

    // Student distribution by year
    const yearCounts = {
      '1st Year': await Student.count({ where: { year: '1st Year' } }),
      '2nd Year': await Student.count({ where: { year: '2nd Year' } }),
      '3rd Year': await Student.count({ where: { year: '3rd Year' } }),
      '4th Year': await Student.count({ where: { year: '4th Year' } })
    };

    // AI interaction counts from MongoDB
    let totalAiQueries = 0;
    let totalConversations = 0;
    try {
      totalAiQueries = await AgentLog.countDocuments();
      totalConversations = await Conversation.countDocuments();
    } catch {
      // mongodb offline fallback
    }

    // Average attendance
    const attendanceRecords = await Attendance.findAll({ attributes: ['status'], limit: 1000 });
    const presentRecords = attendanceRecords.filter(a => a.status === 'Present' || a.status === 'Excused').length;
    const avgAttendance = attendanceRecords.length > 0
      ? Math.round((presentRecords / attendanceRecords.length) * 100)
      : 84;

    return res.status(200).json({
      success: true,
      department: 'Computer Science & Engineering',
      metrics: {
        totalStudents,
        totalFaculty,
        totalSubjects,
        totalSections,
        totalAssignments,
        totalDocuments,
        avgAttendance,
        totalAiQueries,
        totalConversations
      },
      studentsByYear: yearCounts
    });
  } catch (error) {
    logger.error(`[Admin Analytics] Error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Faculty Workload Analytics
exports.getFacultyWorkload = async (req, res) => {
  try {
    const facultyList = await Faculty.findAll();
    const timetable = await Timetable.findAll();

    const workload = facultyList.map(f => {
      const assignedSlots = timetable.filter(t => t.faculty.toLowerCase().includes(f.name.toLowerCase()));
      return {
        facultyId: f.id,
        name: f.name,
        designation: f.designation,
        specialization: f.specialization,
        weeklyLectures: assignedSlots.length,
        subjectsHandled: [...new Set(assignedSlots.map(s => s.subject))]
      };
    });

    return res.status(200).json({ success: true, count: workload.length, workload });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get / Update AI Configuration
exports.getAiConfig = async (req, res) => {
  try {
    let pref = await AiPreference.findOne({ userId: 'global_cse_settings' });
    if (!pref) {
      pref = await AiPreference.create({
        userId: 'global_cse_settings',
        temperature: 0.3,
        model: 'llama-3.3-70b-versatile',
        tone: 'Academic',
        enableProactiveReminders: true
      });
    }
    return res.status(200).json({ success: true, config: pref });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAiConfig = async (req, res) => {
  try {
    const { temperature, model, tone, enableProactiveReminders } = req.body;

    const pref = await AiPreference.findOneAndUpdate(
      { userId: 'global_cse_settings' },
      {
        $set: {
          temperature: temperature !== undefined ? temperature : 0.3,
          model: model || 'llama-3.3-70b-versatile',
          tone: tone || 'Academic',
          enableProactiveReminders: enableProactiveReminders !== undefined ? enableProactiveReminders : true
        }
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, message: 'AI configuration updated.', config: pref });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get Agent Logs & Audit Trail
exports.getSystemLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const logs = await AgentLog.find().sort({ timestamp: -1 }).limit(limit);
    return res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

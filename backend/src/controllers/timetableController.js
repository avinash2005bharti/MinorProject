const { Timetable, Student } = require('../models/mysql');
const { logger } = require('../services/loggerService');

// 1. Get Timetable Slots with Filters
exports.getTimetable = async (req, res) => {
  try {
    const { year, semester, section, day } = req.query;
    const where = {};

    if (year) where.year = year;
    if (semester) where.semester = parseInt(semester, 10);
    if (section) where.section = section.toUpperCase();
    if (day) where.day = day;

    const slots = await Timetable.findAll({
      where,
      order: [
        ['day', 'ASC'],
        ['start_time', 'ASC']
      ]
    });

    return res.status(200).json({
      success: true,
      count: slots.length,
      timetable: slots
    });
  } catch (error) {
    logger.error(`[Timetable Controller] Error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Timetable for Current Logged-in Student
exports.getMyTimetable = async (req, res) => {
  try {
    if (!req.user || !req.user.studentProfile) {
      return res.status(400).json({
        success: false,
        message: 'No student profile associated with this account.'
      });
    }

    const { year, semester, section } = req.user.studentProfile;
    const { day } = req.query;

    const where = {
      year,
      semester,
      section
    };
    if (day) where.day = day;

    const slots = await Timetable.findAll({
      where,
      order: [
        ['day', 'ASC'],
        ['start_time', 'ASC']
      ]
    });

    return res.status(200).json({
      success: true,
      studentClass: { year, semester, section },
      timetable: slots
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Create Timetable Entry (Admin / HOD)
exports.createTimetableEntry = async (req, res) => {
  try {
    const { year, semester, section, day, start_time, end_time, subject, faculty, room } = req.body;

    if (!year || !semester || !section || !day || !start_time || !end_time || !subject || !faculty) {
      return res.status(400).json({
        success: false,
        message: 'year, semester, section, day, start_time, end_time, subject, and faculty are required.'
      });
    }

    const entry = await Timetable.create({
      year,
      semester: parseInt(semester, 10),
      section: section.toUpperCase(),
      day,
      start_time,
      end_time,
      subject,
      faculty,
      room: room || 'CSE Room 204'
    });

    return res.status(201).json({
      success: true,
      message: 'Timetable entry added successfully.',
      entry
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update Timetable Entry
exports.updateTimetableEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Timetable.findByPk(id);

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Timetable slot not found.' });
    }

    await entry.update(req.body);
    return res.status(200).json({
      success: true,
      message: 'Timetable entry updated successfully.',
      entry
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Delete Timetable Entry
exports.deleteTimetableEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Timetable.findByPk(id);

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Timetable slot not found.' });
    }

    await entry.destroy();
    return res.status(200).json({
      success: true,
      message: 'Timetable entry deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

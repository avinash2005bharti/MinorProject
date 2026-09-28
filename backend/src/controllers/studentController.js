const { Op } = require('sequelize');
const { Student, User, Attendance } = require('../models/mysql');
const { logger } = require('../services/loggerService');

// 1. Get All Students with Search, Year/Sem/Section filter, and Pagination
exports.getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const { search, year, semester, section, batch, status } = req.query;

    const where = {};

    if (year) where.year = year;
    if (semester) where.semester = parseInt(semester, 10);
    if (section) where.section = section.toUpperCase();
    if (batch) where.batch = batch;
    if (status) where.status = status;

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { enrollment_no: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Student.findAndCountAll({
      where,
      limit,
      offset,
      order: [['enrollment_no', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      students: rows
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

    const student = await Student.findOne({
      where: isNaN(id) ? { enrollment_no: id } : { id },
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'role'] }]
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found in CSE records.' });
    }

    return res.status(200).json({ success: true, student });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Create Student
exports.createStudent = async (req, res) => {
  try {
    const { enrollment_no, name, email, phone, year, semester, section, batch, status } = req.body;

    if (!enrollment_no || !name || !email || !year || !semester || !section) {
      return res.status(400).json({
        success: false,
        message: 'Missing required student details (enrollment_no, name, email, year, semester, section).'
      });
    }

    const existing = await Student.findOne({
      where: {
        [Op.or]: [{ enrollment_no }, { email }]
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Student with this enrollment number or email already exists.'
      });
    }

    const student = await Student.create({
      enrollment_no,
      name,
      email,
      phone,
      year,
      semester: parseInt(semester, 10),
      section: section.toUpperCase(),
      batch: batch || '2022-2026',
      status: status || 'Active'
    });

    return res.status(201).json({
      success: true,
      message: 'Student created successfully.',
      student
    });
  } catch (error) {
    logger.error(`[Student Controller] Create error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update Student
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const { name, phone, year, semester, section, batch, status } = req.body;

    await student.update({
      name: name || student.name,
      phone: phone !== undefined ? phone : student.phone,
      year: year || student.year,
      semester: semester ? parseInt(semester, 10) : student.semester,
      section: section ? section.toUpperCase() : student.section,
      batch: batch || student.batch,
      status: status || student.status
    });

    return res.status(200).json({
      success: true,
      message: 'Student record updated successfully.',
      student
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Delete Student
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    await student.destroy();
    return res.status(200).json({
      success: true,
      message: 'Student record deleted successfully from CSE department.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const { Op } = require('sequelize');
const { Faculty, User } = require('../models/mysql');
const { logger } = require('../services/loggerService');

// 1. Get All Faculty
exports.getFaculty = async (req, res) => {
  try {
    const { search, designation, specialization } = req.query;
    const where = {};

    if (designation) where.designation = designation;
    if (specialization) where.specialization = { [Op.like]: `%${specialization}%` };

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { specialization: { [Op.like]: `%${search}%` } }
      ];
    }

    const facultyList = await Faculty.findAll({
      where,
      order: [['name', 'ASC']],
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'role'] }]
    });

    return res.status(200).json({
      success: true,
      count: facultyList.length,
      faculty: facultyList
    });
  } catch (error) {
    logger.error(`[Faculty Controller] Error fetching faculty: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Single Faculty
exports.getFacultyById = async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await Faculty.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'role'] }]
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found.' });
    }

    return res.status(200).json({ success: true, faculty });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Create Faculty
exports.createFaculty = async (req, res) => {
  try {
    const { name, email, designation, specialization, phone } = req.body;

    if (!name || !email || !designation || !specialization) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, designation, and specialization are required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await Faculty.findOne({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Faculty with this email already exists.' });
    }

    const faculty = await Faculty.create({
      name,
      email: cleanEmail,
      designation,
      specialization,
      phone
    });

    return res.status(201).json({
      success: true,
      message: 'Faculty member registered successfully in CSE Department.',
      faculty
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update Faculty
exports.updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await Faculty.findByPk(id);

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found.' });
    }

    const { name, designation, specialization, phone } = req.body;

    await faculty.update({
      name: name || faculty.name,
      designation: designation || faculty.designation,
      specialization: specialization || faculty.specialization,
      phone: phone !== undefined ? phone : faculty.phone
    });

    return res.status(200).json({
      success: true,
      message: 'Faculty details updated successfully.',
      faculty
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Delete Faculty
exports.deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await Faculty.findByPk(id);

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found.' });
    }

    await faculty.destroy();
    return res.status(200).json({
      success: true,
      message: 'Faculty removed successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

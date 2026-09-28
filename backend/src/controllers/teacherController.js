const Teacher = require('../models/Teacher');

// Get all faculty in CSE department
exports.getDepartmentFaculty = async (req, res, next) => {
  try {
    const faculty = await Teacher.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: faculty.length,
      data: faculty
    });
  } catch (error) {
    next(error);
  }
};

// Get teacher profile by ID or current logged-in faculty
exports.getTeacherProfile = async (req, res, next) => {
  try {
    const id = req.params.id;
    let teacher;
    if (id && id !== 'me') {
      teacher = await Teacher.findById(id);
    } else if (req.user) {
      teacher = await Teacher.findOne({ user: req.user._id });
    }

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found.' });
    }

    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    next(error);
  }
};

// Update teacher status / workload (HOD/Admin)
exports.updateTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Teacher profile updated successfully.',
      data: teacher
    });
  } catch (error) {
    next(error);
  }
};

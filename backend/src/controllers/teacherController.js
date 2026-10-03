// ============================================================================
// Departmental ERP - Teacher Controller (Forwarder to authoritative facultyController)
// ============================================================================

const facultyController = require('./facultyController');

module.exports = {
  getDepartmentFaculty: facultyController.getFaculty,
  getTeacherProfile: facultyController.getFacultyById,
  updateTeacher: facultyController.updateFaculty
};

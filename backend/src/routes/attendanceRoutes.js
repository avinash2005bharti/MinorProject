const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.post('/mark', verifyToken, checkRole('faculty', 'admin'), attendanceController.markAttendance);
router.post('/bulk', verifyToken, checkRole('faculty', 'admin'), attendanceController.bulkMarkAttendance);
router.get('/stats', verifyToken, attendanceController.getStudentAttendanceStats);
router.get('/stats/:studentId', verifyToken, attendanceController.getStudentAttendanceStats);
router.get('/report', verifyToken, checkRole('faculty', 'admin'), attendanceController.getClassAttendanceReport);

module.exports = router;

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, checkRole, optionalAuth } = require('../middleware/auth');

router.post('/mark', verifyToken, checkRole('faculty', 'admin', 'hod'), attendanceController.markAttendance);
router.post('/bulk', verifyToken, checkRole('faculty', 'admin', 'hod'), attendanceController.bulkMarkAttendance);
router.get('/stats', optionalAuth, attendanceController.getStudentAttendanceStats);
router.get('/stats/:studentId', optionalAuth, attendanceController.getStudentAttendanceStats);
router.get('/student', optionalAuth, attendanceController.getStudentAttendanceStats);
router.get('/student/:studentId', optionalAuth, attendanceController.getStudentAttendanceStats);
router.get('/report', verifyToken, checkRole('faculty', 'admin', 'hod'), attendanceController.getClassAttendanceReport);

// Manual Override (HOD / Admin / Faculty)
router.post('/override', verifyToken, checkRole('faculty', 'admin', 'hod'), attendanceController.overrideAttendance);

// QR Attendance
router.post('/qr/generate', verifyToken, checkRole('faculty', 'admin', 'hod'), attendanceController.generateQrSession);
router.post('/qr/scan', optionalAuth, attendanceController.scanQrSession);

module.exports = router;


const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const upload = require('../middleware/upload');
const auditLogger = require('../middleware/audit');
const { verifyToken, checkRole } = require('../middleware/auth');

// All request operations require authentication
router.use(verifyToken);

// Overall list
router.get('/', requestController.getAllRequests);

// Attendance Consideration
router.post('/attendance/consideration', upload.single('supportingDoc'), auditLogger('Request', 'Submit Attendance Consideration'), requestController.submitAttendanceConsideration);
router.put('/attendance/consideration/:id/tg-review', checkRole('TG', 'TEACHER', 'HOD'), auditLogger('Request', 'TG Review Attendance Consideration'), requestController.tgReviewAttendanceConsideration);
router.put('/attendance/consideration/:id/tg-reject', checkRole('TG', 'TEACHER', 'HOD'), auditLogger('Request', 'TG Reject Attendance Consideration'), requestController.tgRejectAttendanceConsideration);
router.put('/attendance/consideration/:id/hod-approve', checkRole('HOD'), auditLogger('Request', 'HOD Approve Attendance Consideration'), requestController.hodApproveAttendanceConsideration);
router.put('/attendance/consideration/:id/hod-reject', checkRole('HOD'), auditLogger('Request', 'HOD Reject Attendance Consideration'), requestController.hodRejectAttendanceConsideration);

// Attendance Query (Wrong Attendance Dispute)
router.post('/attendance/query', upload.single('supportingDoc'), auditLogger('Request', 'Submit Attendance Query'), requestController.submitAttendanceQuery);
router.put('/attendance/query/:id/tg-review', checkRole('TG', 'TEACHER', 'HOD'), auditLogger('Request', 'TG Review Attendance Query'), requestController.tgReviewAttendanceQuery);
router.put('/attendance/query/:id/tg-reject', checkRole('TG', 'TEACHER', 'HOD'), auditLogger('Request', 'TG Reject Attendance Query'), requestController.tgRejectAttendanceQuery);
router.put('/attendance/query/:id/hod-approve', checkRole('HOD'), auditLogger('Request', 'HOD Approve Attendance Query'), requestController.hodApproveAttendanceQuery);
router.put('/attendance/query/:id/hod-reject', checkRole('HOD'), auditLogger('Request', 'HOD Reject Attendance Query'), requestController.hodRejectAttendanceQuery);

// Leave Management
router.post('/leave', upload.single('supportingDoc'), auditLogger('Leave', 'Submit Leave Request'), requestController.applyLeave);
router.put('/leave/:id/tg-review', checkRole('TG', 'TEACHER', 'HOD'), auditLogger('Leave', 'TG Review Leave'), requestController.tgReviewLeave);
router.put('/leave/:id/tg-reject', checkRole('TG', 'TEACHER', 'HOD'), auditLogger('Leave', 'TG Reject Leave'), requestController.tgRejectLeave);
router.put('/leave/:id/hod-approve', checkRole('HOD'), auditLogger('Leave', 'HOD Approve Leave'), requestController.hodApproveLeave);
router.put('/leave/:id/hod-reject', checkRole('HOD'), auditLogger('Leave', 'HOD Reject Leave'), requestController.hodRejectLeave);

// Google Sheet Live Sync & Real-time Integration (HOD Approval Dashboard & Read-Only for Faculty)
router.get('/google-sheet/config', checkRole('HOD', 'ADMIN', 'TEACHER', 'TG'), requestController.getGoogleSheetConfig);
router.post('/google-sheet/config', checkRole('HOD', 'ADMIN'), auditLogger('Request', 'Update Google Sheet Config'), requestController.saveGoogleSheetConfig);
router.post('/google-sheet/sync-all', checkRole('HOD', 'ADMIN'), auditLogger('Request', 'Batch Sync to Google Sheet'), requestController.syncAllToGoogleSheet);
router.post('/google-sheet/test', checkRole('HOD', 'ADMIN'), requestController.testGoogleSheetConnection);

module.exports = router;

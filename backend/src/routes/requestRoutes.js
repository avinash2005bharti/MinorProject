const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const upload = require('../middleware/upload');
const auditLogger = require('../middleware/audit');

// Overall list
router.get('/', requestController.getAllRequests);

// Attendance Consideration
router.post('/attendance/consideration', upload.single('supportingDoc'), auditLogger('Request', 'Submit Attendance Consideration'), requestController.submitAttendanceConsideration);
router.put('/attendance/consideration/:id/tg-review', auditLogger('Request', 'TG Review Attendance Consideration'), requestController.tgReviewAttendanceConsideration);
router.put('/attendance/consideration/:id/hod-approve', auditLogger('Request', 'HOD Approve Attendance Consideration'), requestController.hodApproveAttendanceConsideration);

// Attendance Query (Wrong Attendance Dispute)
router.post('/attendance/query', upload.single('supportingDoc'), auditLogger('Request', 'Submit Attendance Query'), requestController.submitAttendanceQuery);
router.put('/attendance/query/:id/tg-review', auditLogger('Request', 'TG Review Attendance Query'), requestController.tgReviewAttendanceQuery);
router.put('/attendance/query/:id/hod-approve', auditLogger('Request', 'HOD Approve Attendance Query'), requestController.hodApproveAttendanceQuery);

// Leave Management
router.post('/leave', upload.single('supportingDoc'), auditLogger('Leave', 'Submit Leave Request'), requestController.applyLeave);
router.put('/leave/:id/tg-review', auditLogger('Leave', 'TG Review Leave'), requestController.tgReviewLeave);
router.put('/leave/:id/hod-approve', auditLogger('Leave', 'HOD Approve Leave'), requestController.hodApproveLeave);

module.exports = router;

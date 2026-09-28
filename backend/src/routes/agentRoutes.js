const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const auditLogger = require('../middleware/audit');

router.post('/attendance', auditLogger('Agent', 'Run Attendance Agent'), agentController.runAttendanceAgent);
router.post('/leave', auditLogger('Agent', 'Run Leave Agent'), agentController.runLeaveAgent);
router.post('/timetable', auditLogger('Agent', 'Run Timetable Agent'), agentController.runTimetableAgent);
router.get('/status', agentController.getAgentsStatus);

module.exports = router;

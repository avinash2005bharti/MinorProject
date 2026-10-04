const express = require('express');
const router = express.Router();
const teacherSchedulerController = require('../controllers/teacherSchedulerController');
const { verifyToken, checkRole, optionalAuth } = require('../middleware/auth');

// Require verified authentication for all teacher scheduler operations
router.use(verifyToken);

// 1. Teacher Absence Reporting
router.post('/teachers/:id/absence', teacherSchedulerController.reportAbsence);

// 2. AI Scheduling Analysis & Proposals
router.post('/analyze', teacherSchedulerController.analyzeAbsence);
router.post('/propose', teacherSchedulerController.proposeSubstitutions);

// 3. Approval & Transactional Application
router.post('/apply', checkRole('admin', 'hod'), teacherSchedulerController.applySubstitutions);
router.get('/conflicts', teacherSchedulerController.getSchedulerConflicts);

// 4. Substitutions History & Action
router.get('/teachers/:id/substitutions', teacherSchedulerController.getTeacherSubstitutions);
router.post('/substitutions/:id/approve', checkRole('admin', 'hod'), teacherSchedulerController.approveSubstitution);
router.post('/substitutions/:id/reject', checkRole('admin', 'hod'), teacherSchedulerController.rejectSubstitution);

module.exports = router;

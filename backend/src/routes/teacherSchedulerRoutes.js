const express = require('express');
const router = express.Router();
const teacherSchedulerController = require('../controllers/teacherSchedulerController');
const { verifyToken, checkRole, optionalAuth } = require('../middleware/auth');

// 1. Teacher Absence Reporting
router.post('/teachers/:id/absence', optionalAuth, teacherSchedulerController.reportAbsence);

// 2. AI Scheduling Analysis & Proposals
router.post('/analyze', optionalAuth, teacherSchedulerController.analyzeAbsence);
router.post('/propose', optionalAuth, teacherSchedulerController.proposeSubstitutions);

// 3. Approval & Transactional Application
router.post('/apply', optionalAuth, teacherSchedulerController.applySubstitutions);
router.get('/conflicts', optionalAuth, teacherSchedulerController.getSchedulerConflicts);

// 4. Substitutions History & Action
router.get('/teachers/:id/substitutions', optionalAuth, teacherSchedulerController.getTeacherSubstitutions);
router.post('/substitutions/:id/approve', optionalAuth, teacherSchedulerController.approveSubstitution);
router.post('/substitutions/:id/reject', optionalAuth, teacherSchedulerController.rejectSubstitution);

module.exports = router;

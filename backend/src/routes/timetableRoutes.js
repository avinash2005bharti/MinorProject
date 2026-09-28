const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { verifyToken, checkRole, optionalAuth } = require('../middleware/auth');

// 1. Core Timetable Querying
router.get('/', optionalAuth, timetableController.getTimetable);
router.get('/my', verifyToken, timetableController.getMyTimetable);
router.get('/conflicts', optionalAuth, timetableController.getConflicts);

// 2. AI Autonomous Timetable Generation & Regeneration
router.post('/generate', optionalAuth, timetableController.generateTimetable);

// 3. Export Endpoints (PDF & Excel)
router.get('/export/pdf', optionalAuth, timetableController.exportTimetablePDF);
router.get('/export/excel', optionalAuth, timetableController.exportTimetableExcel);
router.post('/export/pdf', optionalAuth, timetableController.exportTimetablePDF);
router.post('/export/excel', optionalAuth, timetableController.exportTimetableExcel);

// 4. Timetable Versions & Lifecycle Management
router.get('/:id/versions', optionalAuth, timetableController.getTimetableVersions);
router.post('/:id/regenerate', optionalAuth, timetableController.regenerateTimetable);
router.post('/:id/approve', optionalAuth, timetableController.approveTimetable);
router.post('/:id/publish', optionalAuth, timetableController.publishTimetable);
router.get('/:id/conflicts', optionalAuth, timetableController.getConflicts);
router.post('/:id/export/pdf', optionalAuth, timetableController.exportTimetablePDF);
router.post('/:id/export/excel', optionalAuth, timetableController.exportTimetableExcel);
router.get('/:id', optionalAuth, timetableController.getTimetableById);

// 5. CRUD Endpoints
router.post('/', verifyToken, checkRole('admin', 'faculty', 'hod'), timetableController.createTimetableEntry);
router.put('/:id', verifyToken, checkRole('admin', 'faculty', 'hod'), timetableController.updateTimetableEntry);
router.delete('/:id', verifyToken, checkRole('admin', 'hod'), timetableController.deleteTimetableEntry);

module.exports = router;

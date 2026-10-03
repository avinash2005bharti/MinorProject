const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { verifyToken, checkRole, optionalAuth } = require('../middleware/auth');
const cacheService = require('../services/cacheService');

// Invalidate timetable caches on any timetable generation, approval, or CRUD mutations
router.use(cacheService.invalidateOnMutation(['/timetable', '/dashboard']));

// 1. Core Timetable Querying (Cached 45s)
router.get('/', optionalAuth, cacheService.middleware(45), timetableController.getTimetable);
router.get('/my', verifyToken, cacheService.middleware(45, true), timetableController.getMyTimetable);
router.get('/conflicts', optionalAuth, cacheService.middleware(45), timetableController.getConflicts);

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
router.delete('/:id', verifyToken, checkRole('admin', 'faculty', 'hod'), timetableController.deleteTimetableEntry);

module.exports = router;

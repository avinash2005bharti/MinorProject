const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const leaveController = require('../controllers/leaveController');
const masterDataController = require('../controllers/masterDataController');
const { verifyToken, checkRole, optionalAuth } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const cacheService = require('../services/cacheService');

// Invalidate faculty, availability, and dashboard cache on mutations
router.use(cacheService.invalidateOnMutation(['/faculty', '/teachers', '/availability', '/dashboard', '/leaves']));

// 1. Availability & Status (Must be before /:id) - Cached 15s
router.get('/availability', optionalAuth, cacheService.middleware(15), leaveController.getFacultyAvailability);
router.get('/availability/today', optionalAuth, cacheService.middleware(15), leaveController.getFacultyAvailability);

// 2. Master Data Import & Export (Must be before /:id)
router.post('/import', upload.single('file'), masterDataController.importTeachers);
router.get('/export', masterDataController.exportTeachers);

// 3. Core Faculty CRUD - Cached 30s
router.get('/', optionalAuth, cacheService.middleware(30), facultyController.getFaculty);
router.get('/:id', optionalAuth, facultyController.getFacultyById);
router.post('/', verifyToken, checkRole('admin'), facultyController.createFaculty);
router.put('/:id', verifyToken, checkRole('admin', 'hod'), facultyController.updateFaculty);
router.delete('/:id', verifyToken, checkRole('admin'), facultyController.deleteFaculty);

// 4. Leave & Availability Actions
router.post('/:id/leave-toggle', optionalAuth, leaveController.toggleTeacherLeave);
router.post('/:id/toggle-leave', optionalAuth, leaveController.toggleTeacherLeave);
router.get('/:id/affected-classes', optionalAuth, leaveController.getAffectedClasses);
router.post('/:id/propose-substitutes', optionalAuth, leaveController.proposeSubstitutes);

// 5. TG Appointment
router.post('/:id/appoint-tg', verifyToken, checkRole('admin', 'hod'), facultyController.appointTg);
router.put('/:id/appoint-tg', verifyToken, checkRole('admin', 'hod'), facultyController.appointTg);
router.post('/:id/revoke-tg', verifyToken, checkRole('admin', 'hod'), facultyController.revokeTg);

module.exports = router;

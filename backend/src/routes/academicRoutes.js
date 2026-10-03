const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const masterDataController = require('../controllers/masterDataController');
const { verifyToken, checkRole } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const cacheService = require('../services/cacheService');

// Invalidate academic cache on mutations
router.use(cacheService.invalidateOnMutation(['/academic', '/dashboard']));

// CSE Hierarchy: 1st-4th Year -> Semesters 1-8 -> Sections (Cached 5 minutes)
router.get('/hierarchy', cacheService.middleware(300), academicController.getCseHierarchy);

// Subject Import & Export (Must precede /:id)
router.post('/subjects/import', upload.single('file'), masterDataController.importSubjects);
router.get('/subjects/export', masterDataController.exportSubjects);

// Subjects CRUD (Cached 3 minutes)
router.get('/subjects', cacheService.middleware(180), academicController.getSubjects);
router.post('/subjects', verifyToken, checkRole('admin', 'hod'), academicController.createSubject);
router.put('/subjects/:id', verifyToken, checkRole('admin', 'hod'), academicController.updateSubject);
router.delete('/subjects/:id', verifyToken, checkRole('admin', 'hod'), academicController.deleteSubject);

// Sections (Cached 3 minutes)
router.get('/sections', cacheService.middleware(180), academicController.getSections);
router.post('/sections', verifyToken, checkRole('admin', 'hod'), academicController.createSection);
router.delete('/sections/:id', verifyToken, checkRole('admin', 'hod'), academicController.deleteSection);

module.exports = router;

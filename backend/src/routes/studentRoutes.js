const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const masterDataController = require('../controllers/masterDataController');
const { verifyToken, checkRole, optionalAuth } = require('../middleware/auth');
const cacheService = require('../services/cacheService');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Invalidate student & dashboard cache on mutations
router.use(cacheService.invalidateOnMutation(['/students', '/dashboard']));

// Import & Export (Must precede /:id)
router.post('/import', upload.single('file'), masterDataController.importStudents);
router.get('/export', masterDataController.exportStudents);

// Core Student CRUD (Cached 30s)
router.get('/', optionalAuth, cacheService.middleware(30), studentController.getStudents);
router.get('/:id', optionalAuth, studentController.getStudentById);
router.post('/', verifyToken, checkRole('admin', 'faculty', 'hod'), studentController.createStudent);
router.put('/:id', verifyToken, checkRole('admin', 'faculty', 'hod'), studentController.updateStudent);
router.delete('/:id', verifyToken, checkRole('admin', 'hod'), studentController.deleteStudent);

module.exports = router;

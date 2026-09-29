const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { verifyToken, checkRole, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, facultyController.getFaculty);
router.get('/:id', optionalAuth, facultyController.getFacultyById);
router.post('/', verifyToken, checkRole('admin'), facultyController.createFaculty);
router.put('/:id', verifyToken, checkRole('admin'), facultyController.updateFaculty);
router.delete('/:id', verifyToken, checkRole('admin'), facultyController.deleteFaculty);

module.exports = router;

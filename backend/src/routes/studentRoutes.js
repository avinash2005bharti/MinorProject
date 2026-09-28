const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/', verifyToken, studentController.getStudents);
router.get('/:id', verifyToken, studentController.getStudentById);
router.post('/', verifyToken, checkRole('admin', 'faculty'), studentController.createStudent);
router.put('/:id', verifyToken, checkRole('admin', 'faculty'), studentController.updateStudent);
router.delete('/:id', verifyToken, checkRole('admin'), studentController.deleteStudent);

module.exports = router;

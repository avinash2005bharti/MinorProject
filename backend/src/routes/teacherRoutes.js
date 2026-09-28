const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

router.get('/', teacherController.getDepartmentFaculty);
router.get('/:id', teacherController.getTeacherProfile);
router.put('/:id', teacherController.updateTeacher);

module.exports = router;

const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroomController');
const { verifyToken, checkRole, optionalAuth } = require('../middleware/auth');

const cacheService = require('../services/cacheService');

router.use(cacheService.invalidateOnMutation(['/classrooms', '/timetable']));

router.get('/', optionalAuth, cacheService.middleware(180), classroomController.getClassrooms);
router.get('/:id', optionalAuth, cacheService.middleware(180), classroomController.getClassroomById);
router.post('/', verifyToken, checkRole('admin', 'hod'), classroomController.createClassroom);
router.put('/:id', verifyToken, checkRole('admin', 'hod'), classroomController.updateClassroom);
router.delete('/:id', verifyToken, checkRole('admin', 'hod'), classroomController.deleteClassroom);

module.exports = router;

const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/', verifyToken, timetableController.getTimetable);
router.get('/my', verifyToken, timetableController.getMyTimetable);
router.post('/', verifyToken, checkRole('admin', 'faculty'), timetableController.createTimetableEntry);
router.put('/:id', verifyToken, checkRole('admin', 'faculty'), timetableController.updateTimetableEntry);
router.delete('/:id', verifyToken, checkRole('admin'), timetableController.deleteTimetableEntry);

module.exports = router;

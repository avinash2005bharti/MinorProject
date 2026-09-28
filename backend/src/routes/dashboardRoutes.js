const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/student', dashboardController.getStudentDashboard);
router.get('/teacher', dashboardController.getTeacherDashboard);
router.get('/tg', dashboardController.getTgDashboard);
router.get('/hod', dashboardController.getHodDashboard);
router.get('/admin', dashboardController.getAdminDashboard);

module.exports = router;

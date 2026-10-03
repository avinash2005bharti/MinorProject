const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, checkRole } = require('../middleware/auth');
const cacheService = require('../services/cacheService');

// Role-protected real dashboard endpoints (Cached with 20s TTL for blazing fast subsequent loads)
router.get('/student', verifyToken, checkRole('student'), cacheService.middleware(20, true), dashboardController.getStudentDashboard);
router.get('/teacher', verifyToken, checkRole('faculty', 'teacher', 'tg'), cacheService.middleware(20, true), dashboardController.getTeacherDashboard);
router.get('/faculty', verifyToken, checkRole('faculty', 'teacher', 'tg'), cacheService.middleware(20, true), dashboardController.getTeacherDashboard);
router.get('/tg', verifyToken, checkRole('tg', 'faculty', 'teacher'), cacheService.middleware(20, true), dashboardController.getTgDashboard);
router.get('/hod', verifyToken, checkRole('hod'), cacheService.middleware(20, false), dashboardController.getHodDashboard);
router.get('/admin', verifyToken, checkRole('admin'), cacheService.middleware(20, false), dashboardController.getAdminDashboard);

module.exports = router;

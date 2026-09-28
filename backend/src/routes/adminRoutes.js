const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/analytics', verifyToken, checkRole('admin'), adminController.getDepartmentAnalytics);
router.get('/faculty-workload', verifyToken, checkRole('admin'), adminController.getFacultyWorkload);
router.get('/ai-config', verifyToken, checkRole('admin'), adminController.getAiConfig);
router.put('/ai-config', verifyToken, checkRole('admin'), adminController.updateAiConfig);
router.get('/logs', verifyToken, checkRole('admin'), adminController.getSystemLogs);

module.exports = router;

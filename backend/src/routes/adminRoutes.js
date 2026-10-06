const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Analytics & Workload (Strictly Admin Protected)
router.get('/analytics', verifyToken, checkRole('admin'), adminController.getDepartmentAnalytics);
router.get('/faculty-workload', verifyToken, checkRole('admin'), adminController.getFacultyWorkload);

// User Accounts & Identity Management
router.get('/users', verifyToken, checkRole('admin', 'hod'), adminController.getUsers);
router.post('/users', verifyToken, checkRole('admin', 'hod'), adminController.createUser);
router.get('/users/:id', verifyToken, checkRole('admin', 'hod'), adminController.getUserById);
router.put('/users/:id', verifyToken, checkRole('admin', 'hod'), adminController.updateUser);
router.patch('/users/:id/status', verifyToken, checkRole('admin', 'hod'), adminController.updateUserStatus);
router.post('/users/:id/reset-password', verifyToken, checkRole('admin'), adminController.resetUserPassword);

// HOD Designation Management
router.post('/hod/assign', verifyToken, checkRole('admin'), adminController.assignHod);
router.post('/hod/remove', verifyToken, checkRole('admin'), adminController.removeHod);

// AI & System Configuration
router.get('/ai-config', verifyToken, checkRole('admin'), adminController.getAiConfig);
router.put('/ai-config', verifyToken, checkRole('admin'), adminController.updateAiConfig);
router.get('/logs', verifyToken, checkRole('admin'), adminController.getSystemLogs);

module.exports = router;

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/', verifyToken, notificationController.getNotifications);
router.get('/:role', verifyToken, notificationController.getNotifications);
router.post('/', verifyToken, checkRole('admin', 'hod', 'teacher', 'tg'), notificationController.createNotification);
router.put('/:id/read', verifyToken, notificationController.markAsRead);
router.put('/clear/all', verifyToken, notificationController.clearAllNotifications);

module.exports = router;

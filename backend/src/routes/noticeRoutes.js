const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const auditLogger = require('../middleware/audit');
const upload = require('../middleware/fileUpload');
const { verifyToken, checkRole, optionalAuth } = require('../middleware/auth');
const cacheService = require('../services/cacheService');

router.use(cacheService.invalidateOnMutation(['/notices', '/dashboard']));

router.get('/', cacheService.middleware(30), noticeController.getNotices);
router.post(
  '/',
  verifyToken,
  checkRole('admin', 'hod', 'teacher', 'tg'),
  upload.single('attachment'),
  auditLogger('Notice', 'Broadcast Notice'),
  noticeController.createNotice
);
router.put('/:id/read', noticeController.markRead);
router.put('/:id/unread', noticeController.markUnread);
router.delete('/:id', verifyToken, checkRole('admin', 'hod'), auditLogger('Notice', 'Delete Notice'), noticeController.deleteNotice);

module.exports = router;

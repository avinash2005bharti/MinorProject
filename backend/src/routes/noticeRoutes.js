const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const auditLogger = require('../middleware/audit');
const upload = require('../middleware/fileUpload');
const { verifyToken, checkRole } = require('../middleware/auth');
const cacheService = require('../services/cacheService');

router.use(cacheService.invalidateOnMutation(['/notices', '/dashboard']));

router.get('/', verifyToken, noticeController.getNotices);
router.post(
  '/',
  verifyToken,
  checkRole('admin', 'hod', 'teacher', 'tg'),
  upload.single('attachment'),
  auditLogger('Notice', 'Broadcast Notice'),
  noticeController.createNotice
);
router.put('/:id/read', verifyToken, noticeController.markRead);
router.put('/:id/unread', verifyToken, noticeController.markUnread);
router.delete('/:id', verifyToken, checkRole('admin', 'hod'), auditLogger('Notice', 'Delete Notice'), noticeController.deleteNotice);

module.exports = router;

const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const auditLogger = require('../middleware/audit');

router.get('/', noticeController.getNotices);
router.post('/', auditLogger('Notice', 'Broadcast Notice'), noticeController.createNotice);

module.exports = router;

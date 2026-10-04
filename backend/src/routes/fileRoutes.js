const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { verifyToken } = require('../middleware/auth');
const { internalAuth } = require('../middleware/internalAuth');
const upload = require('../middleware/fileUpload');

// Authenticated file upload
router.post('/upload', verifyToken, upload.single('file'), fileController.uploadFile);

// File history (user's files)
router.get('/', verifyToken, fileController.getFiles);

// Single file metadata
router.get('/:id', verifyToken, fileController.getFileById);

// File processing status
router.get('/:id/status', verifyToken, fileController.getFileStatus);

// Update processing status (internal — SEC-09: protected by internalAuth)
router.patch('/:id/status', internalAuth, fileController.updateFileStatus);

// Delete file
router.delete('/:id', verifyToken, fileController.deleteFile);

// Agent-generated file registration (internal — SEC-09: protected by internalAuth)
router.post('/agent-upload', internalAuth, fileController.agentUploadFile);

module.exports = router;

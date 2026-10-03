const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/fileUpload');

// Authenticated file upload
router.post('/upload', verifyToken, upload.single('file'), fileController.uploadFile);

// File history (user's files)
router.get('/', verifyToken, fileController.getFiles);

// Single file metadata
router.get('/:id', verifyToken, fileController.getFileById);

// File processing status
router.get('/:id/status', verifyToken, fileController.getFileStatus);

// Update processing status (internal — called by FastAPI)
router.patch('/:id/status', optionalAuth, fileController.updateFileStatus);

// Delete file
router.delete('/:id', verifyToken, fileController.deleteFile);

// Agent-generated file registration (internal — called by FastAPI)
router.post('/agent-upload', optionalAuth, fileController.agentUploadFile);

module.exports = router;

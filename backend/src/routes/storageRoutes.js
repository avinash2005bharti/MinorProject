const express = require('express');
const router = express.Router();
const storageController = require('../controllers/storageController');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/fileUpload');

// Storage status
router.get('/status', storageController.getStorageStatus);

// ImageKit client-side auth endpoint
router.get('/auth', optionalAuth, storageController.getImageKitAuth);
router.get('/imagekit-auth', optionalAuth, storageController.getImageKitAuth);

// Direct file upload
router.post('/upload', optionalAuth, upload.single('file'), storageController.uploadFile);

module.exports = router;

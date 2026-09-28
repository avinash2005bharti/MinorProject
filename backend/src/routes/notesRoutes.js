const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const { verifyToken, checkRole } = require('../middleware/auth');
const upload = require('../middleware/fileUpload');

router.get('/', verifyToken, notesController.getNotes);
router.post('/upload', verifyToken, checkRole('faculty', 'admin'), upload.single('file'), notesController.uploadNote);
router.get('/download/:id', verifyToken, notesController.downloadNote);
router.delete('/:id', verifyToken, checkRole('faculty', 'admin'), notesController.deleteNote);

module.exports = router;

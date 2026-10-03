const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const { verifyToken, checkRole } = require('../middleware/auth');
const upload = require('../middleware/fileUpload');

router.get('/', verifyToken, notesController.getNotes);
router.post('/upload', verifyToken, checkRole('faculty', 'admin', 'hod'), upload.single('file'), notesController.uploadNote);
router.get('/download/:id', verifyToken, notesController.downloadNote);
router.get('/status/:id', verifyToken, notesController.getNoteStatus);
router.delete('/:id', verifyToken, checkRole('faculty', 'admin', 'hod'), notesController.deleteNote);

module.exports = router;


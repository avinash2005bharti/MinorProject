const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { verifyToken, checkRole } = require('../middleware/auth');
const upload = require('../middleware/fileUpload');

router.get('/', verifyToken, assignmentController.getAssignments);
router.post('/', verifyToken, checkRole('faculty', 'admin'), upload.single('file'), assignmentController.createAssignment);
router.post('/submit', verifyToken, checkRole('student'), upload.single('file'), assignmentController.submitAssignment);
router.put('/evaluate/:submission_id', verifyToken, checkRole('faculty', 'admin'), assignmentController.evaluateSubmission);

module.exports = router;

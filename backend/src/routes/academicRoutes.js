const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const { verifyToken, checkRole } = require('../middleware/auth');

// CSE Hierarchy: 1st-4th Year -> Semesters 1-8 -> Sections
router.get('/hierarchy', academicController.getCseHierarchy);

// Subjects
router.get('/subjects', academicController.getSubjects);
router.post('/subjects', verifyToken, checkRole('admin'), academicController.createSubject);
router.put('/subjects/:id', verifyToken, checkRole('admin'), academicController.updateSubject);
router.delete('/subjects/:id', verifyToken, checkRole('admin'), academicController.deleteSubject);

// Sections
router.get('/sections', academicController.getSections);
router.post('/sections', verifyToken, checkRole('admin'), academicController.createSection);
router.delete('/sections/:id', verifyToken, checkRole('admin'), academicController.deleteSection);

module.exports = router;

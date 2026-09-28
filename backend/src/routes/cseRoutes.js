const express = require('express');
const router = express.Router();
const cseStructureController = require('../controllers/cseStructureController');
const auditLogger = require('../middleware/audit');

router.get('/years', cseStructureController.getCseYears);
router.get('/semesters', cseStructureController.getCseSemesters);
router.get('/sections', cseStructureController.getCseSections);
router.post('/sections', auditLogger('AcademicStructure', 'Add Section'), cseStructureController.addSection);

module.exports = router;

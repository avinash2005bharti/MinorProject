const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { verifyToken, checkRole, optionalAuth } = require('../middleware/auth');

const cacheService = require('../services/cacheService');

// Invalidate on mutations
router.use(cacheService.invalidateOnMutation(['/leaves', '/teachers', '/availability', '/dashboard']));

// Today's Leaves & Availability (Cached 15s)
router.get('/today', optionalAuth, cacheService.middleware(15), leaveController.getLeavesToday);
router.get('/availability', optionalAuth, cacheService.middleware(15), leaveController.getFacultyAvailability);
router.get('/availability/today', optionalAuth, cacheService.middleware(15), leaveController.getFacultyAvailability);

// Teacher Leave Toggle (Available <-> On Leave) - requires verified user
router.post('/teachers/:id/toggle', verifyToken, leaveController.toggleTeacherLeave);
router.post('/teachers/:id/leave-toggle', verifyToken, leaveController.toggleTeacherLeave);

// Affected Classes & Substitutions
router.get('/teachers/:id/affected-classes', verifyToken, leaveController.getAffectedClasses);
router.post('/teachers/:id/propose-substitutes', verifyToken, checkRole('HOD', 'ADMIN', 'TEACHER', 'TG'), leaveController.proposeSubstitutes);
router.post('/apply-substitute', verifyToken, checkRole('HOD', 'ADMIN'), leaveController.applySubstitute);

module.exports = router;

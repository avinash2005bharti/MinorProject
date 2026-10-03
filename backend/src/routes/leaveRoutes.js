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

// Teacher Leave Toggle (Available <-> On Leave)
router.post('/teachers/:id/toggle', optionalAuth, leaveController.toggleTeacherLeave);
router.post('/teachers/:id/leave-toggle', optionalAuth, leaveController.toggleTeacherLeave);

// Affected Classes & Substitutions
router.get('/teachers/:id/affected-classes', optionalAuth, leaveController.getAffectedClasses);
router.post('/teachers/:id/propose-substitutes', optionalAuth, leaveController.proposeSubstitutes);
router.post('/apply-substitute', optionalAuth, leaveController.applySubstitute);

module.exports = router;

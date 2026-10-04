const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Rate limiters for authentication security (SEC-01)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  keyGenerator: (req) => {
    const email = (req.body && req.body.email) ? String(req.body.email).trim().toLowerCase() : '';
    return `${req.ip}_${email}`;
  },
  message: {
    success: false,
    message: 'Too many password reset requests from this account or IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyGenerator: (req) => {
    const email = (req.body && req.body.email) ? String(req.body.email).trim().toLowerCase() : '';
    return `${req.ip}_${email}`;
  },
  message: {
    success: false,
    message: 'Too many verification attempts from this account or IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/login', authLimiter, authController.login);
router.post('/register', authLimiter, authController.register);
router.post('/register/student', authLimiter, authController.registerStudent);
router.post('/register/teacher', authLimiter, authController.registerTeacher);
router.post('/register/admin', authLimiter, authController.registerAdmin);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/verify-otp', verifyOtpLimiter, authController.verifyOtp);
router.get('/me', verifyToken, authController.getMe);
router.post('/logout', verifyToken, authController.logout);

module.exports = router;

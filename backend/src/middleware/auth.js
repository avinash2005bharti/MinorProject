const jwt = require('jsonwebtoken');
const { User, Student, Faculty } = require('../models/mysql');
const { logger } = require('../services/loggerService');

const JWT_SECRET = process.env.JWT_SECRET || 'cse_agentic_erp_super_secure_jwt_secret_2025';

const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: No authentication token provided.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user in relational database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'refreshToken', 'otpCode'] },
      include: [
        { model: Student, as: 'studentProfile', required: false },
        { model: Faculty, as: 'facultyProfile', required: false }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session: User account does not exist.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account disabled. Please contact the CSE Department Admin.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please refresh your session.',
        isExpired: true
      });
    }
    logger.warn(`[Auth] Token verification failed: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid or corrupted authentication token.'
    });
  }
};

// RBAC Middleware supporting Admin, Faculty, Student (and aliases)
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated.' });
    }

    let userRole = req.user.role.toLowerCase();
    // Normalize aliases: teacher/tg/hod -> faculty
    if (userRole === 'teacher' || userRole === 'tg' || userRole === 'hod') {
      userRole = 'faculty';
    }

    const normalizedAllowed = allowedRoles.map(r => {
      const lower = r.toLowerCase();
      return (lower === 'teacher' || lower === 'tg' || lower === 'hod') ? 'faculty' : lower;
    });

    if (!normalizedAllowed.includes(userRole) && !normalizedAllowed.includes(req.user.role.toLowerCase())) {
      logger.warn(`[RBAC] Forbidden: User ${req.user.id} (${req.user.role}) attempted to access resource requiring [${allowedRoles.join(', ')}]`);
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] permissions.`
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (user) req.user = user;
    }
  } catch {
    // continue without req.user
  }
  next();
};

module.exports = {
  verifyToken,
  checkRole,
  optionalAuth
};

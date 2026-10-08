// ============================================================================
// Departmental ERP - Authoritative Authentication & RBAC Middleware
// Single Source of Truth: PostgreSQL
// ============================================================================

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { prisma } = require('../config/postgres');
const { getPermissionsForRole, PERMISSIONS } = require('../config/permissions');
const { logger } = require('../services/loggerService');

const { envConfig } = require('../config/env');
const JWT_SECRET = process.env.JWT_SECRET || envConfig.jwtSecret;

// High-speed in-memory user session cache (60s TTL)
// Drastically speeds up API requests by eliminating redundant 5-join database lookups
const authUserCache = new Map();
const AUTH_CACHE_TTL_MS = 60 * 1000;

const resolveAuthUser = async (userId) => {
  const cached = authUserCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.userPayload;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      department: true,
      studentProfile: {
        include: {
          section: true,
          tutorGuardian: true
        }
      },
      teacherProfile: {
        include: {
          hodAssignments: {
            where: { isCurrent: true }
          }
        }
      }
    }
  });

  if (!user) return null;

  const baseRole = String(user.role?.name || '').toUpperCase();
  const isHod = (user.teacherProfile?.hodAssignments && user.teacherProfile.hodAssignments.length > 0) || baseRole === 'HOD';
  const isTg = Boolean(user.teacherProfile?.isTG);

  let effectiveRole = ['FACULTY', 'PROFESSOR'].includes(baseRole) ? 'TEACHER' : baseRole;
  if (isHod) effectiveRole = 'HOD';
  else if (isTg && baseRole !== 'ADMIN') effectiveRole = 'TG';

  const userPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: effectiveRole,
    roleName: baseRole,
    departmentId: user.departmentId,
    departmentCode: user.department?.code || null,
    departmentName: user.department?.name || null,
    studentId: user.studentProfile?.id || null,
    teacherId: user.teacherProfile?.id || null,
    isTG: isTg,
    isHOD: isHod,
    isActive: user.isActive,
    permissions: getPermissionsForRole(effectiveRole),
    studentProfile: user.studentProfile || null,
    teacherProfile: user.teacherProfile || null
  };

  authUserCache.set(userId, {
    userPayload,
    expiresAt: Date.now() + AUTH_CACHE_TTL_MS
  });

  return userPayload;
};

const invalidateAuthUser = (identifier) => {
  if (!identifier) {
    authUserCache.clear();
    return;
  }
  authUserCache.delete(identifier);
  for (const [key, value] of authUserCache.entries()) {
    if (value?.userPayload?.id === identifier || value?.userPayload?.email === identifier) {
      authUserCache.delete(key);
    }
  }
};

/**
 * Verify JWT token and attach authenticated PostgreSQL user to req.user
 */
const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Microservice Internal Secret Support (FastAPI AI Microservice ↔ Node Backend)
    const internalSecret = req.headers['x-internal-secret'];
    const expectedSecret = process.env.INTERNAL_API_SECRET;
    if (internalSecret !== undefined) {
      const supplied = Buffer.from(String(internalSecret));
      const expected = Buffer.from(String(expectedSecret || ''));
      if (!expected.length || supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
        return res.status(401).json({
          success: false,
          message: 'Invalid internal service authentication.',
          code: 'INVALID_INTERNAL_AUTH'
        });
      }

      const internalUserId = req.headers['x-user-id'];
      if (!internalUserId) {
        return res.status(401).json({
          success: false,
          message: 'Internal service requests must identify the authenticated user.',
          code: 'AUTH_REQUIRED'
        });
      }

      const authUser = await resolveAuthUser(internalUserId);
      if (!authUser || !authUser.isActive) {
        return res.status(401).json({
          success: false,
          message: 'The internal request user is not an active CampusFlow account.',
          code: 'USER_NOT_FOUND'
        });
      }
      req.user = authUser;
      return next();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Authentication token required.',
        code: 'AUTH_REQUIRED'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please sign in again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
        code: 'INVALID_TOKEN'
      });
    }

    const userId = decoded.sub || decoded.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Malformed token payload: Missing subject identifier.',
        code: 'INVALID_TOKEN'
      });
    }

    // Fast cached authoritative user lookup
    const user = await resolveAuthUser(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session: User account does not exist in ERP records.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account disabled. Please contact the Department Administrator.',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Attach user payload
    req.user = user;
    next();
  } catch (err) {
    logger.error(`[Auth Middleware Error]: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication verification.',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Centralized Role-Based Access Control (RBAC) middleware
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before permission verification.',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = (req.user.role || '').toUpperCase();
    const userRoleName = (req.user.roleName || '').toUpperCase();
    const normalizedAllowed = allowedRoles.flat().map(r => String(r).toUpperCase());

    // Interoperability between FACULTY and TEACHER aliases
    if (normalizedAllowed.includes('FACULTY') && !normalizedAllowed.includes('TEACHER')) {
      normalizedAllowed.push('TEACHER');
    }
    if (normalizedAllowed.includes('TEACHER') && !normalizedAllowed.includes('FACULTY')) {
      normalizedAllowed.push('FACULTY');
    }

    // Admin always has bypass access
    if (userRole === 'ADMIN' || userRoleName === 'ADMIN') {
      return next();
    }

    const hasAccess = normalizedAllowed.includes(userRole) || normalizedAllowed.includes(userRoleName);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}].`,
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

/**
 * Centralized Permission verification middleware
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = (req.user.role || '').toUpperCase();
    if (userRole === 'ADMIN') return next();

    const userPerms = req.user.permissions || [];
    if (!userPerms.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Missing required permission [${permission}].`,
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

/**
 * Optional Authentication middleware: populates req.user if token is present and valid,
 * but allows unauthenticated requests to proceed.
 */
const optionalAuth = async (req, res, next) => {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.sub || decoded.id;
    if (!userId) {
      req.user = null;
      return next();
    }

    const user = await resolveAuthUser(userId);
    if (user && user.isActive) {
      req.user = user;
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }
  next();
};

module.exports = {
  verifyToken,
  requireRole,
  checkRole: requireRole,
  requirePermission,
  optionalAuth,
  invalidateAuthUser
};

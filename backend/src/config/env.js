// ============================================================================
// Environment Configuration & Startup Validator (SEC-07)
// Ensures mission-critical secrets are present and properly formatted.
// ============================================================================

const crypto = require('crypto');

function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production';
  const errors = [];

  // Required secrets validation
  if (!process.env.JWT_SECRET) {
    if (isProd) {
      errors.push('CRITICAL: JWT_SECRET environment variable is missing in production environment.');
    } else {
      process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
      console.warn('[SECURITY WARNING] JWT_SECRET is not set. Generated ephemeral random secret for development.');
    }
  }

  if (!process.env.ADMIN_REGISTRATION_SECRET) {
    if (isProd) {
      errors.push('CRITICAL: ADMIN_REGISTRATION_SECRET environment variable is missing in production environment.');
    } else {
      process.env.ADMIN_REGISTRATION_SECRET = crypto.randomBytes(32).toString('hex');
      console.warn('[SECURITY WARNING] ADMIN_REGISTRATION_SECRET is not set. Generated ephemeral random secret for development.');
    }
  }

  if (!process.env.INTERNAL_API_SECRET) {
    if (isProd) {
      errors.push('CRITICAL: INTERNAL_API_SECRET environment variable is missing in production environment.');
    } else {
      process.env.INTERNAL_API_SECRET = 'dev_internal_microservice_secret_key_123';
    }
  }

  if (isProd && !process.env.FRONTEND_URL && !process.env.CORS_ORIGINS && !process.env.CORS_ORIGIN) {
    errors.push('CRITICAL: FRONTEND_URL or CORS_ORIGINS environment variable is missing in production environment.');
  }

  if (isProd && errors.length > 0) {
    errors.forEach(err => console.error(err));
    process.exit(1);
  }

  return {
    jwtSecret: process.env.JWT_SECRET,
    adminRegistrationSecret: process.env.ADMIN_REGISTRATION_SECRET,
    internalApiSecret: process.env.INTERNAL_API_SECRET || (isProd ? null : 'internal_microservice_secret_dev'),
    isProd
  };
}

const envConfig = validateEnv();

module.exports = {
  validateEnv,
  envConfig
};

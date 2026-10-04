// ============================================================================
// Internal Microservice Authentication Middleware (SEC-09)
// Validates X-Microservice-Secret header against INTERNAL_API_SECRET
// using constant-time comparison (crypto.timingSafeEqual).
// ============================================================================

const crypto = require('crypto');

function internalAuth(req, res, next) {
  const secretHeader = req.headers['x-microservice-secret'] || req.headers['x-internal-secret'];
  const expectedSecret = process.env.INTERNAL_API_SECRET;

  if (!expectedSecret) {
    console.error('[SECURITY ERROR] INTERNAL_API_SECRET is not configured on server.');
    return res.status(500).json({ success: false, message: 'Internal service authentication misconfigured.' });
  }

  if (!secretHeader) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Missing X-Microservice-Secret header for internal endpoint.'
    });
  }

  try {
    const headerBuffer = Buffer.from(String(secretHeader));
    const expectedBuffer = Buffer.from(String(expectedSecret));

    if (headerBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(headerBuffer, expectedBuffer)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Invalid microservice authentication token.'
      });
    }

    req.isInternalService = true;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Forbidden: Secret validation failed.' });
  }
}

module.exports = { internalAuth };

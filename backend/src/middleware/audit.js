const AuditLog = require('../models/AuditLog');

const auditLogger = (targetEntity, actionName) => {
  return async (req, res, next) => {
    // Preserve response json to intercept result
    const originalJson = res.json;

    res.json = function (data) {
      res.json = originalJson;

      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Asynchronously log audit entry
        setImmediate(async () => {
          try {
            await AuditLog.create({
              user: req.user ? req.user.name : 'System/Anonymous',
              userId: req.user ? req.user._id : null,
              role: req.user ? req.user.role : 'Guest',
              action: actionName || `${req.method} ${req.baseUrl}${req.path}`,
              targetEntity: targetEntity || 'General',
              entityId: req.params.id || (data && (data.id || data._id)) || null,
              details: JSON.stringify({
                method: req.method,
                path: req.originalUrl,
                body: req.body ? Object.keys(req.body) : []
              }),
              ip: req.ip || req.connection.remoteAddress || '127.0.0.1'
            });
          } catch (e) {
            console.error('[AuditLog] Failed to record:', e.message);
          }
        });
      }

      return res.json(data);
    };

    next();
  };
};

module.exports = auditLogger;

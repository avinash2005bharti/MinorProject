const { logger } = require('../services/loggerService');

const auditLogger = (targetEntity, actionName) => {
  return async (req, res, next) => {
    const originalJson = res.json;

    res.json = function (data) {
      res.json = originalJson;

      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(() => {
          try {
            logger.info(`[Audit] ${actionName || `${req.method} ${req.originalUrl}`} by ${req.user?.email || 'Anonymous'} (${req.user?.role || 'Guest'}) target: ${targetEntity || 'General'}`);
          } catch (e) {
            // Non-blocking
          }
        });
      }

      return res.json(data);
    };

    next();
  };
};

module.exports = auditLogger;

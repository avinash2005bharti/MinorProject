const { logger } = require('../services/loggerService');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const userRole = req.user ? req.user.role : 'unauthenticated';
    const userId = req.user ? req.user.id : 'anonymous';

    const logMessage = `${method} ${originalUrl} ${status} - ${duration}ms | IP: ${ip} | User: ${userId} (${userRole})`;

    if (status >= 400) {
      logger.warn(logMessage);
    } else {
      logger.info(logMessage);
    }
  });

  next();
};

module.exports = requestLogger;

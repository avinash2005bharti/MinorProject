const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}${stack ? `\nStack: ${stack}` : ''}${metaStr}`;
  })
);

// Specific transports for different domain logs
const apiTransport = new winston.transports.File({
  filename: path.join(logDir, 'api.log'),
  level: 'info'
});

const errorTransport = new winston.transports.File({
  filename: path.join(logDir, 'error.log'),
  level: 'error'
});

const aiTransport = new winston.transports.File({
  filename: path.join(logDir, 'ai.log'),
  level: 'info'
});

const emailTransport = new winston.transports.File({
  filename: path.join(logDir, 'email.log'),
  level: 'info'
});

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => `[${level}] ${message}`)
  )
});

// Default App Logger (records API & System events)
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: customFormat,
  transports: [
    apiTransport,
    errorTransport,
    consoleTransport
  ]
});

// Specialized AI Logger
const aiLogger = winston.createLogger({
  level: 'info',
  format: customFormat,
  transports: [
    aiTransport,
    errorTransport,
    consoleTransport
  ]
});

// Specialized Email Logger
const emailLogger = winston.createLogger({
  level: 'info',
  format: customFormat,
  transports: [
    emailTransport,
    errorTransport,
    consoleTransport
  ]
});

module.exports = {
  logger,
  aiLogger,
  emailLogger
};

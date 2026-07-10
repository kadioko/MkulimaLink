const winston = require('winston');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, requestId, ...meta }) => {
    const parts = [timestamp];
    if (requestId) parts.push(`[req:${requestId}]`);
    parts.push(`[${level.toUpperCase()}]:`);
    if (Object.keys(meta).length > 0) {
      parts.push(JSON.stringify(meta));
    }
    parts.push(stack || message);
    return parts.join(' ');
  })
);

const consoleFormat = isProduction
  ? winston.format.combine(winston.format.json())
  : winston.format.combine(winston.format.colorize(), logFormat);

const transports = [
  new winston.transports.Console({ format: consoleFormat }),
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    maxsize: 5242880,
    maxFiles: 5
  }),
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
    maxsize: 5242880,
    maxFiles: 5
  })
];

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: { service: 'mkulimalink-api' },
  transports
});

logger.stream = {
  write: (message) => logger.info(message.trim())
};

logger.child = (meta) => logger.child(meta);

module.exports = logger;

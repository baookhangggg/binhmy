/*
 * HTX Bình Mỹ — Logger (pino)
 * Structured logging, có thể redirect sang file/ELK/Datadog sau này.
 */

const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'production' ? undefined : {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' }
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
    censor: '[REDACTED]'
  }
});

module.exports = logger;

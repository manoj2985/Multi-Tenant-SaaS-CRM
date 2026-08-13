const pino = require('pino');
const config = require('../config/env');

const logger = pino({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  redact: {
    paths: [
      'password',
      'passwordHash',
      'jwt',
      'token',
      'refreshToken',
      'authorization',
      'headers.authorization',
      'req.headers.authorization',
      'body.password',
      'body.refreshToken',
      'body.token'
    ],
    censor: '[REDACTED]'
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

module.exports = logger;

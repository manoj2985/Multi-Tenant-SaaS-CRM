const config = require('../config/env');

const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let { statusCode, message, errorCode } = err;

  if (!statusCode) {
    statusCode = 500;
  }

  // In production, mask 500 internal server database/stack details
  const displayMessage = config.nodeEnv === 'production' && statusCode === 500
    ? 'Internal Server Error'
    : (message || 'Internal Server Error');

  const response = {
    success: false,
    statusCode,
    message: displayMessage,
    ...(errorCode && { errorCode }),
    ...(err.details && { data: err.details }),
    requestId: req.requestId || undefined,
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  };

  if (config.nodeEnv === 'development') {
    console.error(`[API ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;

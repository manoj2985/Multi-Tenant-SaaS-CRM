const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/apiError');

// General API Rate Limiter: 100 requests / 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests from this IP. Please try again after 15 minutes', true, null, 'RATE_LIMIT_EXCEEDED'));
  }
});

// Strict Authentication Rate Limiter: 10 requests / 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many authentication attempts. Please try again after 15 minutes', true, null, 'AUTH_RATE_LIMIT_EXCEEDED'));
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};

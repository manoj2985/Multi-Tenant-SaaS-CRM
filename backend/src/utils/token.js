const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');

/**
 * Generates short-lived Access Token (JWT)
 * @param {object} payload - { userId, companyId, role }
 * @returns {string}
 */
function generateAccessToken(payload) {
  return jwt.sign(
    {
      userId: payload.userId,
      companyId: payload.companyId,
      role: payload.role,
      jti: crypto.randomUUID()
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

/**
 * Generates long-lived Refresh Token (JWT)
 * @param {object} payload - { userId, companyId, role }
 * @returns {string}
 */
function generateRefreshToken(payload) {
  return jwt.sign(
    {
      userId: payload.userId,
      companyId: payload.companyId,
      tokenType: 'refresh',
      jti: crypto.randomUUID()
    },
    config.refreshTokenSecret,
    { expiresIn: config.refreshTokenExpiresIn }
  );
}

/**
 * Verifies Access Token
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

/**
 * Verifies Refresh Token
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, config.refreshTokenSecret);
}

/**
 * Computes SHA-256 hash of a token for safe database storage
 * @param {string} token
 * @returns {string} hex hash
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken
};

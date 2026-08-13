const express = require('express');
const {
  registerCompany,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword
} = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

router.post('/register', authLimiter, registerCompany);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refreshToken);
router.post('/logout', logout);
router.post('/logout-all', authenticateToken, logoutAll);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;

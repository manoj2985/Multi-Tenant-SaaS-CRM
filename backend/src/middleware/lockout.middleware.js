const ApiError = require('../utils/apiError');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

// In-memory store for tracking failed attempts (can be backed by Redis in production)
const failedAttemptsMap = new Map();

function checkLockout(email) {
  if (!email) return;
  const key = email.toLowerCase().trim();
  const record = failedAttemptsMap.get(key);

  if (!record) return;

  const now = Date.now();
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    throw new ApiError(
      429,
      `Account is temporarily locked due to repeated failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
      true,
      { lockedUntil: new Date(record.lockedUntil) },
      'ACCOUNT_TEMPORARILY_LOCKED'
    );
  }

  // If lockout window expired, reset attempts
  if (record.lockedUntil && record.lockedUntil <= now) {
    failedAttemptsMap.delete(key);
  }
}

function recordFailedLogin(email) {
  if (!email) return;
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const record = failedAttemptsMap.get(key) || { count: 0, firstAttemptAt: now };

  record.count += 1;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCK_TIME_MS;
  }

  failedAttemptsMap.set(key, record);
}

function resetFailedLogins(email) {
  if (!email) return;
  const key = email.toLowerCase().trim();
  failedAttemptsMap.delete(key);
}

module.exports = {
  checkLockout,
  recordFailedLogin,
  resetFailedLogins
};

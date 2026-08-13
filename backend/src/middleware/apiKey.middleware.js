const apiKeyService = require('../services/apiKey.service');
const ApiError = require('../utils/apiError');

async function authenticateApiKey(req, res, next) {
  const authHeader = req.headers['authorization'];
  const xApiKey = req.headers['x-api-key'];

  let rawKey = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    rawKey = authHeader.substring(7).trim();
  } else if (xApiKey) {
    rawKey = String(xApiKey).trim();
  }

  if (!rawKey || !rawKey.startsWith('crm_live_')) {
    return next(); // Fall through to standard JWT auth if not an API Key format
  }

  try {
    const apiKeyRecord = await apiKeyService.verifyApiKey(rawKey);
    if (!apiKeyRecord) {
      throw new ApiError(401, 'Invalid, revoked, or expired API Key', true, null, 'INVALID_API_KEY');
    }

    req.apiKey = apiKeyRecord;
    req.user = {
      id: `key_${apiKeyRecord.id}`,
      companyId: apiKeyRecord.companyId,
      role: 'API_CLIENT'
    };

    next();
  } catch (err) {
    next(err);
  }
}

function verifyScope(requiredScope) {
  return (req, res, next) => {
    if (!req.apiKey) {
      // If not using API Key (using standard JWT session), pass through
      return next();
    }

    const scopes = Array.isArray(req.apiKey.scopes) ? req.apiKey.scopes : [];
    if (!scopes.includes(requiredScope) && !scopes.includes('*')) {
      return next(new ApiError(403, `API Key lacks required scope: '${requiredScope}'`, true, null, 'INSUFFICIENT_SCOPE'));
    }

    next();
  };
}

module.exports = {
  authenticateApiKey,
  verifyScope
};

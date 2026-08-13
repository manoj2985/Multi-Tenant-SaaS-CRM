const apiKeyService = require('../services/apiKey.service');

const createApiKey = async (req, res, next) => {
  try {
    const result = await apiKeyService.createApiKey(req.user.companyId, req.user.id, req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getApiKeys = async (req, res, next) => {
  try {
    const result = await apiKeyService.getApiKeys(req.user.companyId);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const revokeApiKey = async (req, res, next) => {
  try {
    const result = await apiKeyService.revokeApiKey(req.user.companyId, req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getApiKeyUsage = async (req, res, next) => {
  try {
    const result = await apiKeyService.getApiKeyUsage(req.user.companyId, req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createApiKey,
  getApiKeys,
  revokeApiKey,
  getApiKeyUsage
};

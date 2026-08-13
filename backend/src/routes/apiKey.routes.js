const express = require('express');
const {
  createApiKey,
  getApiKeys,
  revokeApiKey,
  getApiKeyUsage
} = require('../controllers/apiKey.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticateToken);

router.post('/', createApiKey);
router.get('/', getApiKeys);
router.delete('/:id', revokeApiKey);
router.get('/:id/usage', getApiKeyUsage);

module.exports = router;

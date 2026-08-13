const express = require('express');
const {
  createWebhook,
  getWebhooks,
  getWebhookById,
  toggleWebhook,
  deleteWebhook
} = require('../controllers/webhook.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticateToken);

router.post('/', createWebhook);
router.get('/', getWebhooks);
router.get('/:id', getWebhookById);
router.patch('/:id/toggle', toggleWebhook);
router.delete('/:id', deleteWebhook);

module.exports = router;

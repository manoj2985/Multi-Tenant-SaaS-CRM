const express = require('express');
const billingService = require('../services/billing.service');

const router = express.Router();

router.post('/webhooks/billing', async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'] || req.headers['x-razorpay-signature'];
    const result = await billingService.handleWebhookPayload(req.body, signature);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

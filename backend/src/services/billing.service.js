const subscriptionService = require('./subscription.service');
const ApiError = require('../utils/apiError');

class BillingService {
  /**
   * Abstract Billing Provider Interface (Local Mock Provider)
   */
  async createCheckoutSession(companyId, planKey, returnUrl) {
    return {
      success: true,
      provider: 'mock_local_provider',
      sessionId: `cs_test_${Date.now()}`,
      checkoutUrl: `${returnUrl || 'http://localhost:5173/settings/subscription'}?success=true&plan=${planKey}`,
      message: 'Mock checkout session created for development.'
    };
  }

  /**
   * Billing webhook handler placeholder
   */
  async handleWebhookPayload(payload, signature) {
    // Placeholder verification layer for Stripe-Signature or Razorpay Signature
    if (!payload || typeof payload !== 'object') {
      throw new ApiError(400, 'Invalid webhook payload structure', true, '', 'WEBHOOK_ERROR');
    }

    const { eventType, companyId, plan } = payload;

    switch (eventType) {
      case 'checkout.session.completed':
      case 'subscription.updated':
        if (companyId && plan) {
          await subscriptionService.changePlan({ companyId, role: 'SUPER_ADMIN' }, plan);
        }
        break;
      case 'invoice.payment_failed':
        // Mark subscription PAST_DUE
        break;
      default:
        break;
    }

    return { received: true, eventType };
  }
}

module.exports = new BillingService();

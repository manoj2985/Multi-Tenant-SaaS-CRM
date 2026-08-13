const subscriptionService = require('../services/subscription.service');
const usageService = require('../services/usage.service');
const ApiError = require('../utils/apiError');
const { z } = require('zod');

const changePlanSchema = z.object({
  plan: z.enum(['FREE', 'PREMIUM', 'ENTERPRISE'])
});

const getSubscription = async (req, res, next) => {
  try {
    const result = await subscriptionService.getSubscriptionDetails(req.user.companyId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getUsage = async (req, res, next) => {
  try {
    const details = await subscriptionService.getSubscriptionDetails(req.user.companyId);
    return res.status(200).json({
      success: true,
      data: {
        plan: details.data.plan,
        usage: details.data.usage,
        limits: details.data.limits
      }
    });
  } catch (error) {
    next(error);
  }
};

const getPlans = async (req, res, next) => {
  try {
    const result = subscriptionService.getPlans();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const changePlan = async (req, res, next) => {
  try {
    const parseResult = changePlanSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await subscriptionService.changePlan(req.user, parseResult.data.plan);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubscription,
  getUsage,
  getPlans,
  changePlan
};

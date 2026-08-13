const { z } = require('zod');

const SubscriptionPlanEnum = z.enum(['FREE', 'PREMIUM', 'ENTERPRISE']);
const CompanyStatusEnum = z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL', 'INACTIVE']);

const updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  address: z.string().optional(),
  subscriptionPlan: SubscriptionPlanEnum.optional()
});

const updateCompanyStatusSchema = z.object({
  status: CompanyStatusEnum
});

module.exports = {
  updateCompanySchema,
  updateCompanyStatusSchema,
  SubscriptionPlanEnum,
  CompanyStatusEnum
};

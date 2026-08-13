const { z } = require('zod');

const DealStageEnum = z.enum(['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']);

const createDealSchema = z.object({
  customerId: z.string().uuid('Valid customer ID is required'),
  title: z.string().min(2, 'Deal title is required'),
  value: z.number().min(0, 'Deal value cannot be negative').default(0),
  currency: z.string().default('USD'),
  stage: DealStageEnum.optional().default('LEAD'),
  probability: z.number().min(0).max(100).optional().default(50),
  expectedCloseDate: z.string().datetime().optional().nullable().or(z.literal('')),
  assignedToId: z.string().uuid().optional().nullable().or(z.literal(''))
});

const updateDealSchema = z.object({
  title: z.string().min(2).optional(),
  value: z.number().min(0).optional(),
  currency: z.string().optional(),
  stage: DealStageEnum.optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().datetime().optional().nullable().or(z.literal('')),
  assignedToId: z.string().uuid().optional().nullable().or(z.literal(''))
});

const updateDealStageSchema = z.object({
  stage: DealStageEnum
});

const assignDealSchema = z.object({
  assignedTo: z.string().uuid('Invalid user ID format')
});

module.exports = {
  createDealSchema,
  updateDealSchema,
  updateDealStageSchema,
  assignDealSchema,
  DealStageEnum
};

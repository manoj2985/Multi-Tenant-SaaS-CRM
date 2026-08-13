const { z } = require('zod');

const LeadSourceEnum = z.enum(['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'EMAIL', 'PHONE', 'ADVERTISEMENT', 'OTHER']);
const LeadStatusEnum = z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'WON', 'LOST']);
const LeadPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

const createLeadSchema = z.object({
  name: z.string().min(2, 'Lead name is required'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional(),
  source: LeadSourceEnum.optional().default('OTHER'),
  status: LeadStatusEnum.optional().default('NEW'),
  priority: LeadPriorityEnum.optional().default('MEDIUM'),
  assignedToId: z.string().uuid().optional().nullable().or(z.literal('')),
  notes: z.string().optional()
});

const updateLeadSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  source: LeadSourceEnum.optional(),
  status: LeadStatusEnum.optional(),
  priority: LeadPriorityEnum.optional(),
  assignedToId: z.string().uuid().optional().nullable().or(z.literal('')),
  notes: z.string().optional()
});

const updateLeadStatusSchema = z.object({
  status: LeadStatusEnum
});

const assignLeadSchema = z.object({
  assignedTo: z.string().uuid('Invalid user ID format')
});

const convertLeadSchema = z.object({
  createCustomer: z.boolean().default(true),
  createDeal: z.boolean().default(false),
  dealTitle: z.string().optional(),
  dealValue: z.number().min(0).optional()
});

module.exports = {
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
  assignLeadSchema,
  convertLeadSchema,
  LeadSourceEnum,
  LeadStatusEnum,
  LeadPriorityEnum
};

const { z } = require('zod');

const CustomerStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT']);

const createCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  email: z.string().email('Invalid email address format').optional().or(z.literal('')),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  industry: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  status: CustomerStatusEnum.optional().default('PROSPECT'),
  assignedToId: z.string().uuid().optional().nullable().or(z.literal(''))
});

const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  industry: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  status: CustomerStatusEnum.optional(),
  assignedToId: z.string().uuid().optional().nullable().or(z.literal(''))
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  CustomerStatusEnum
};

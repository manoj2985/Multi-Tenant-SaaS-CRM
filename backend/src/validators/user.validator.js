const { z } = require('zod');

const UserRoleEnum = z.enum(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE']);
const UserStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']);

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  role: UserRoleEnum.optional().default('SALES_EXECUTIVE')
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: UserRoleEnum.optional()
});

const updateUserStatusSchema = z.object({
  status: UserStatusEnum
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  UserRoleEnum,
  UserStatusEnum
};

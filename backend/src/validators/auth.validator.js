const { z } = require('zod');

const passwordPolicy = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const registerCompanySchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  name: z.string().min(2, 'User name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address format'),
  password: passwordPolicy,
  phone: z.string().optional(),
  industry: z.string().optional(),
  address: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address format')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordPolicy
});

module.exports = {
  passwordPolicy,
  registerCompanySchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};

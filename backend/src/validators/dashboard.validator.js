const { z } = require('zod');

const dashboardFilterSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  employeeId: z.string().uuid().optional().nullable().or(z.literal(''))
});

module.exports = {
  dashboardFilterSchema
};

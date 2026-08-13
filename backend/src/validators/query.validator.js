const { z } = require('zod');

const parseQuerySchema = (allowedSortFields = ['createdAt', 'name']) => {
  return z.object({
    page: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().optional().default(''),
    sortBy: z.string().refine((val) => allowedSortFields.includes(val), {
      message: `sortBy must be one of: ${allowedSortFields.join(', ')}`
    }).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    status: z.string().optional(),
    priority: z.string().optional(),
    source: z.string().optional(),
    stage: z.string().optional(),
    assignedTo: z.string().optional(),
    customerId: z.string().optional()
  });
};

module.exports = {
  parseQuerySchema
};

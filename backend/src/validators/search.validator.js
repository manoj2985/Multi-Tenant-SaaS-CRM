const { z } = require('zod');

const searchQuerySchema = z.object({
  q: z.string().optional().default('')
});

module.exports = {
  searchQuerySchema
};

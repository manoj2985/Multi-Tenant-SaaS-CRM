const { z } = require('zod');

const updatePreferencesSchema = z.object({
  taskNotifications: z.boolean().optional(),
  leadNotifications: z.boolean().optional(),
  dealNotifications: z.boolean().optional(),
  meetingNotifications: z.boolean().optional(),
  systemNotifications: z.boolean().optional()
});

const notificationQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  isRead: z.string().optional()
});

module.exports = {
  updatePreferencesSchema,
  notificationQuerySchema
};

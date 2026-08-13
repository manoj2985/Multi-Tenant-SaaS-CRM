const { z } = require('zod');

const MeetingStatusEnum = z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']);

const createMeetingSchema = z.object({
  title: z.string().min(2, 'Meeting title is required'),
  customerId: z.string().uuid('Valid customer ID is required'),
  date: z.string().min(1, 'Meeting date is required'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'startTime must be in HH:mm format (e.g. 10:00)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'endTime must be in HH:mm format (e.g. 11:00)'),
  location: z.string().optional(),
  meetingLink: z.string().optional(),
  notes: z.string().optional(),
  status: MeetingStatusEnum.optional().default('SCHEDULED')
}).refine((data) => data.endTime > data.startTime, {
  message: 'Meeting endTime must be after startTime',
  path: ['endTime']
});

const updateMeetingSchema = z.object({
  title: z.string().min(2).optional(),
  customerId: z.string().uuid().optional(),
  date: z.string().optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  location: z.string().optional(),
  meetingLink: z.string().optional(),
  notes: z.string().optional(),
  status: MeetingStatusEnum.optional()
});

const updateMeetingStatusSchema = z.object({
  status: MeetingStatusEnum
});

module.exports = {
  createMeetingSchema,
  updateMeetingSchema,
  updateMeetingStatusSchema,
  MeetingStatusEnum
};

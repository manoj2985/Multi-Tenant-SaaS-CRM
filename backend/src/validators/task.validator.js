const { z } = require('zod');

const TaskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

const createTaskSchema = z.object({
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional(),
  assignedToId: z.string().uuid().optional().nullable().or(z.literal('')),
  priority: TaskPriorityEnum.optional().default('MEDIUM'),
  status: TaskStatusEnum.optional().default('TODO'),
  dueDate: z.string().optional().nullable().or(z.literal(''))
});

const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  assignedToId: z.string().uuid().optional().nullable().or(z.literal('')),
  priority: TaskPriorityEnum.optional(),
  status: TaskStatusEnum.optional(),
  dueDate: z.string().optional().nullable().or(z.literal(''))
});

const updateTaskStatusSchema = z.object({
  status: TaskStatusEnum
});

const assignTaskSchema = z.object({
  assignedTo: z.string().uuid('Invalid assigned user ID format')
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  assignTaskSchema,
  TaskStatusEnum,
  TaskPriorityEnum
};

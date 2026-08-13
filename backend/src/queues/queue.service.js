const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const config = require('../config/env');
const logger = require('../utils/logger');
const { prisma } = require('../config/db');
const emailService = require('../services/email.service');
const notificationService = require('../services/notification.service');

class QueueService {
  constructor() {
    this.redisClient = null;
    this.queues = {};
    this.workers = {};
    this.useFallback = false;
  }

  init() {
    try {
      if (config.nodeEnv === 'test') {
        this.useFallback = true;
        logger.info('QueueService running in in-memory mode for test suite');
        return;
      }

      this.redisClient = new Redis(config.redisUrl, {
        maxRetriesPerRequest: null,
        enableOfflineQueue: false
      });

      this.redisClient.on('error', (err) => {
        logger.warn({ error: err.message }, 'Redis connection unavailable. Operating queue in in-memory fallback mode');
        this.useFallback = true;
      });

      // Initialize BullMQ Queues
      this.queues.emailQueue = new Queue('emailQueue', { connection: this.redisClient });
      this.queues.reminderQueue = new Queue('reminderQueue', { connection: this.redisClient });
      this.queues.cleanupQueue = new Queue('cleanupQueue', { connection: this.redisClient });

      this.startWorkers();
    } catch (err) {
      logger.warn({ error: err.message }, 'Failed to initialize Redis queue. Using fallback mode');
      this.useFallback = true;
    }
  }

  startWorkers() {
    if (this.useFallback || !this.redisClient) return;

    // Email Queue Worker with Retries & Exponential Backoff
    this.workers.emailWorker = new Worker('emailQueue', async (job) => {
      const { type, payload } = job.data;
      if (type === 'WELCOME') await emailService.sendWelcomeEmail(payload);
      if (type === 'RESET_PASSWORD') await emailService.sendPasswordResetEmail(payload);
      if (type === 'TASK_ASSIGNED') await emailService.sendTaskAssignmentEmail(payload);
      if (type === 'MEETING_REMINDER') await emailService.sendMeetingReminderEmail(payload);
    }, {
      connection: this.redisClient,
      limiter: { max: 10, duration: 1000 }
    });
  }

  async addEmailJob(type, payload) {
    if (this.useFallback) {
      // Execute immediately in fallback mode
      try {
        if (type === 'WELCOME') await emailService.sendWelcomeEmail(payload);
        if (type === 'RESET_PASSWORD') await emailService.sendPasswordResetEmail(payload);
        if (type === 'TASK_ASSIGNED') await emailService.sendTaskAssignmentEmail(payload);
        if (type === 'MEETING_REMINDER') await emailService.sendMeetingReminderEmail(payload);
      } catch (err) {
        logger.error({ error: err.message }, 'Fallback email job execution failed');
      }
      return;
    }

    try {
      await this.queues.emailQueue.add('sendEmail', { type, payload }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      });
    } catch (err) {
      logger.warn({ error: err.message }, 'Failed to add job to email queue. Executing fallback');
      await emailService.sendWelcomeEmail(payload).catch(() => {});
    }
  }

  /**
   * Periodic Overdue Tasks Job
   */
  async processOverdueTasks() {
    try {
      const now = new Date();
      const overdueTasks = await prisma.task.findMany({
        where: {
          deletedAt: null,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          dueDate: { lt: now }
        }
      });

      for (const task of overdueTasks) {
        if (task.assignedToId) {
          // Check if notification already exists for this task
          const existingNotif = await prisma.notification.findFirst({
            where: {
              userId: task.assignedToId,
              entityType: 'Task',
              entityId: task.id,
              type: 'TASK_OVERDUE'
            }
          });

          if (!existingNotif) {
            await notificationService.createNotification({
              companyId: task.companyId,
              userId: task.assignedToId,
              type: 'TASK_OVERDUE',
              title: 'Task Overdue Warning',
              message: `Task "${task.title}" is overdue (due: ${new Date(task.dueDate).toLocaleDateString()})`,
              entityType: 'Task',
              entityId: task.id
            });
          }
        }
      }
    } catch (err) {
      logger.error({ error: err.message }, 'Overdue task job execution error');
    }
  }

  /**
   * Periodic Retention Cleanup Job
   */
  async processRetentionCleanup() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Clean expired refresh tokens
      await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: now } }
      });

      // Clean expired password reset tokens
      await prisma.passwordResetToken.deleteMany({
        where: { expiresAt: { lt: now } }
      });

      // Clean soft-deleted files older than 30 days
      const oldFiles = await prisma.file.findMany({
        where: { deletedAt: { lt: thirtyDaysAgo } }
      });

      const storageService = require('../services/storage.service');
      for (const f of oldFiles) {
        await storageService.deleteFileFromDisk(f.storageKey).catch(() => {});
        await prisma.file.delete({ where: { id: f.id } }).catch(() => {});
      }
    } catch (err) {
      logger.error({ error: err.message }, 'Retention cleanup job execution error');
    }
  }
}

const queueService = new QueueService();
queueService.init();

module.exports = queueService;

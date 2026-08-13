const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('../utils/logger');

const getWelcomeEmailTemplate = require('../emails/welcome');
const getPasswordResetEmailTemplate = require('../emails/passwordReset');
const getTaskAssignedEmailTemplate = require('../emails/taskAssigned');
const getMeetingReminderEmailTemplate = require('../emails/meetingReminder');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: config.smtpUser ? {
          user: config.smtpUser,
          pass: config.smtpPassword
        } : undefined
      });
    }
    return this.transporter;
  }

  async sendEmail({ to, subject, text, html }) {
    if (!to || !subject) return false;

    try {
      if (config.nodeEnv === 'test') {
        logger.info({ to, subject }, '[MOCK EMAIL SENT]');
        return true;
      }

      const transporter = this.getTransporter();
      const mailOptions = {
        from: config.smtpFrom,
        to,
        subject,
        text,
        html
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info({ messageId: info.messageId, to, subject }, 'Email sent successfully via SMTP');
      return true;
    } catch (error) {
      logger.error({ error: error.message, to, subject }, 'Failed to send email via SMTP');
      return false;
    }
  }

  async sendWelcomeEmail({ to, name, companyName, loginUrl }) {
    const template = getWelcomeEmailTemplate({ name, companyName, loginUrl });
    return await this.sendEmail({ to, ...template });
  }

  async sendPasswordResetEmail({ to, name, resetUrl, expiresInMinutes = 60 }) {
    const template = getPasswordResetEmailTemplate({ name, resetUrl, expiresInMinutes });
    return await this.sendEmail({ to, ...template });
  }

  async sendTaskAssignmentEmail({ to, name, taskTitle, priority, dueDate, taskUrl }) {
    const template = getTaskAssignedEmailTemplate({ name, taskTitle, priority, dueDate, taskUrl });
    return await this.sendEmail({ to, ...template });
  }

  async sendMeetingReminderEmail({ to, name, meetingTitle, meetingDate, meetingTime, meetingUrl }) {
    const template = getMeetingReminderEmailTemplate({ name, meetingTitle, meetingDate, meetingTime, meetingUrl });
    return await this.sendEmail({ to, ...template });
  }
}

module.exports = new EmailService();

const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const companyRoutes = require('./company.routes');
const customerRoutes = require('./customer.routes');
const leadRoutes = require('./lead.routes');
const dealRoutes = require('./deal.routes');
const taskRoutes = require('./task.routes');
const meetingRoutes = require('./meeting.routes');
const activityRoutes = require('./activity.routes');
const auditRoutes = require('./audit.routes');
const dashboardRoutes = require('./dashboard.routes');
const searchRoutes = require('./search.routes');
const notificationRoutes = require('./notification.routes');
const subscriptionRoutes = require('./subscription.routes');
const fileRoutes = require('./file.routes');
const adminRoutes = require('./admin.routes');
const billingRoutes = require('./billing.routes');

// Phase 8 Routes
const workflowRoutes = require('./workflow.routes');
const customFieldRoutes = require('./customField.routes');
const tagRoutes = require('./tag.routes');
const advancedSearchRoutes = require('./advancedSearch.routes');
const importExportRoutes = require('./importExport.routes');
const webhookRoutes = require('./webhook.routes');
const apiKeyRoutes = require('./apiKey.routes');

const router = express.Router();

// Core Route Wiring
router.use('/health', healthRoutes);
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/customers', customerRoutes);
router.use('/leads', leadRoutes);
router.use('/deals', dealRoutes);
router.use('/tasks', taskRoutes);
router.use('/meetings', meetingRoutes);
router.use('/activities', activityRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/search', searchRoutes);
router.use('/search', advancedSearchRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/files', fileRoutes);
router.use('/admin', adminRoutes);
router.use('/', notificationRoutes);
router.use('/', billingRoutes);

// Phase 8 Modular Extensions
router.use('/workflows', workflowRoutes);
router.use('/custom-fields', customFieldRoutes);
router.use('/tags', tagRoutes);
router.use('/import', importExportRoutes);
router.use('/', importExportRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/api-keys', apiKeyRoutes);

module.exports = router;

const subscriptionRepository = require('../repositories/subscription.repository');
const usageService = require('./usage.service');
const { prisma } = require('../config/db');
const PLANS = require('../config/plans');
const ApiError = require('../utils/apiError');
const auditLogService = require('./audit.service');

class SubscriptionService {
  async getSubscriptionDetails(companyId) {
    let subscription = await subscriptionRepository.findByCompanyId(companyId);

    if (!subscription) {
      subscription = await subscriptionRepository.create({
        companyId,
        plan: 'FREE',
        status: 'ACTIVE'
      });
    }

    const usage = await usageService.getUsage(companyId);
    const planConfig = PLANS[subscription.plan] || PLANS.FREE;

    return {
      success: true,
      data: {
        companyId: subscription.companyId,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        trialEndsAt: subscription.trialEndsAt,
        usage,
        limits: {
          users: planConfig.maxUsers,
          customers: planConfig.maxCustomers,
          leads: planConfig.maxLeads,
          deals: planConfig.maxDeals,
          storageMB: planConfig.maxStorageMB
        }
      }
    };
  }

  getPlans() {
    return {
      success: true,
      data: PLANS
    };
  }

  async changePlan(requestingUser, targetPlan) {
    if (!['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(requestingUser.role)) {
      throw new ApiError(403, 'Only company administrators can modify subscription plans', true, '', 'FORBIDDEN');
    }

    if (!PLANS[targetPlan]) {
      throw new ApiError(400, `Invalid subscription plan: ${targetPlan}`, true, '', 'INVALID_PLAN');
    }

    const companyId = requestingUser.companyId;
    const targetConfig = PLANS[targetPlan];
    const currentUsage = await usageService.getUsage(companyId);

    // Downgrade protection validation
    const conflicts = [];

    if (targetConfig.maxUsers !== -1 && currentUsage.users > targetConfig.maxUsers) {
      conflicts.push(`Users (${currentUsage.users} active > ${targetConfig.maxUsers} allowed)`);
    }
    if (targetConfig.maxCustomers !== -1 && currentUsage.customers > targetConfig.maxCustomers) {
      conflicts.push(`Customers (${currentUsage.customers} active > ${targetConfig.maxCustomers} allowed)`);
    }
    if (targetConfig.maxLeads !== -1 && currentUsage.leads > targetConfig.maxLeads) {
      conflicts.push(`Leads (${currentUsage.leads} active > ${targetConfig.maxLeads} allowed)`);
    }
    if (targetConfig.maxDeals !== -1 && currentUsage.deals > targetConfig.maxDeals) {
      conflicts.push(`Deals (${currentUsage.deals} active > ${targetConfig.maxDeals} allowed)`);
    }

    const targetStorageBytes = targetConfig.maxStorageMB === -1 ? -1 : targetConfig.maxStorageMB * 1024 * 1024;
    if (targetStorageBytes !== -1 && currentUsage.storageBytes > targetStorageBytes) {
      const currentMB = Math.round(currentUsage.storageBytes / (1024 * 1024));
      conflicts.push(`Storage (${currentMB} MB used > ${targetConfig.maxStorageMB} MB allowed)`);
    }

    if (conflicts.length > 0) {
      throw new ApiError(
        400,
        `You cannot downgrade because current usage exceeds the selected plan limits: ${conflicts.join('; ')}`,
        true,
        { conflicts, targetPlan },
        'DOWNGRADE_LIMIT_EXCEEDED'
      );
    }

    // Update Subscription & Company plan atomically
    const updatedSub = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.upsert({
        where: { companyId },
        update: { plan: targetPlan, status: 'ACTIVE', updatedAt: new Date() },
        create: { companyId, plan: targetPlan, status: 'ACTIVE' }
      });

      await tx.company.update({
        where: { id: companyId },
        data: { subscriptionPlan: targetPlan }
      });

      return sub;
    });

    // Record audit event
    await auditLogService.logAudit({
      companyId,
      userId: requestingUser.id || requestingUser.userId,
      action: 'PLAN_CHANGED',
      entityType: 'Subscription',
      entityId: updatedSub.id,
      description: `Subscription plan updated to ${targetPlan}`
    });

    return {
      success: true,
      message: `Subscription successfully updated to ${targetPlan} plan`,
      data: updatedSub
    };
  }
}

module.exports = new SubscriptionService();

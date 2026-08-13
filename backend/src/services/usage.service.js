const usageRepository = require('../repositories/usage.repository');
const subscriptionRepository = require('../repositories/subscription.repository');
const PLANS = require('../config/plans');
const ApiError = require('../utils/apiError');

class UsageService {
  async getUsage(companyId) {
    const usage = await usageRepository.syncCounts(companyId);
    return {
      users: usage.usersCount,
      customers: usage.customersCount,
      leads: usage.leadsCount,
      deals: usage.dealsCount,
      tasks: usage.tasksCount,
      storageBytes: Number(usage.storageBytes || 0)
    };
  }

  async checkLimit(companyId, resource, requestedAddition = 1) {
    let sub = await subscriptionRepository.findByCompanyId(companyId);
    const planKey = sub ? sub.plan : 'FREE';
    const planConfig = PLANS[planKey] || PLANS.FREE;

    const usage = await usageRepository.syncCounts(companyId);

    let current = 0;
    let limit = -1;
    let resourceName = resource;

    switch (resource) {
      case 'users':
        current = usage.usersCount;
        limit = planConfig.maxUsers;
        break;
      case 'customers':
        current = usage.customersCount;
        limit = planConfig.maxCustomers;
        break;
      case 'leads':
        current = usage.leadsCount;
        limit = planConfig.maxLeads;
        break;
      case 'deals':
        current = usage.dealsCount;
        limit = planConfig.maxDeals;
        break;
      case 'storage':
        current = Number(usage.storageBytes || 0); // bytes
        limit = planConfig.maxStorageMB === -1 ? -1 : planConfig.maxStorageMB * 1024 * 1024; // convert MB to Bytes
        resourceName = 'storage';
        break;
      default:
        return true;
    }

    // Unlimited check
    if (limit === -1) return true;

    if (current + requestedAddition > limit) {
      const displayLimit = resource === 'storage' ? `${planConfig.maxStorageMB} MB` : limit;
      const displayCurrent = resource === 'storage' ? `${Math.round(current / (1024 * 1024))} MB` : current;

      throw new ApiError(
        403,
        `Your current ${planKey} plan has reached its ${resourceName} limit (${displayCurrent} / ${displayLimit})`,
        true,
        {
          resource: resourceName,
          current: displayCurrent,
          limit: displayLimit,
          plan: planKey
        },
        'PLAN_LIMIT_REACHED'
      );
    }

    return true;
  }

  async syncUsage(companyId) {
    return usageRepository.syncCounts(companyId);
  }
}

module.exports = new UsageService();

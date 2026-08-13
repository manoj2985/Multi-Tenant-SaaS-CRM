const { prisma } = require('../config/db');

class SubscriptionRepository {
  async findByCompanyId(companyId) {
    return prisma.subscription.findUnique({
      where: { companyId }
    });
  }

  async create(data) {
    return prisma.subscription.create({
      data
    });
  }

  async updatePlan(companyId, plan, status = 'ACTIVE') {
    return prisma.subscription.upsert({
      where: { companyId },
      update: {
        plan,
        status,
        updatedAt: new Date()
      },
      create: {
        companyId,
        plan,
        status
      }
    });
  }
}

module.exports = new SubscriptionRepository();

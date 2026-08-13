const { prisma } = require('../config/db');

class UsageRepository {
  async findByCompanyId(companyId) {
    return prisma.usage.findUnique({
      where: { companyId }
    });
  }

  async create(companyId, initialData = {}) {
    return prisma.usage.create({
      data: {
        companyId,
        ...initialData
      }
    });
  }

  async upsertUsage(companyId, data) {
    return prisma.usage.upsert({
      where: { companyId },
      update: data,
      create: {
        companyId,
        ...data
      }
    });
  }

  /**
   * Recalculate actual database record counts for a company
   */
  async syncCounts(companyId) {
    const [usersCount, customersCount, leadsCount, dealsCount, tasksCount, filesAgg] = await Promise.all([
      prisma.user.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.customer.count({ where: { companyId, deletedAt: null } }),
      prisma.lead.count({ where: { companyId, deletedAt: null } }),
      prisma.deal.count({ where: { companyId, deletedAt: null } }),
      prisma.task.count({ where: { companyId, deletedAt: null } }),
      prisma.file.aggregate({
        where: { companyId, deletedAt: null },
        _sum: { size: true }
      })
    ]);

    const storageBytes = BigInt(filesAgg._sum.size || 0);

    return prisma.usage.upsert({
      where: { companyId },
      update: {
        usersCount,
        customersCount,
        leadsCount,
        dealsCount,
        tasksCount,
        storageBytes
      },
      create: {
        companyId,
        usersCount,
        customersCount,
        leadsCount,
        dealsCount,
        tasksCount,
        storageBytes
      }
    });
  }
}

module.exports = new UsageRepository();

const { prisma } = require('../config/db');
const usageService = require('./usage.service');
const subscriptionRepository = require('../repositories/subscription.repository');
const auditLogService = require('./audit.service');
const ApiError = require('../utils/apiError');
const PLANS = require('../config/plans');

class AdminService {
  async getCompanies(requestingUser, query) {
    if (requestingUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Only SUPER_ADMIN can access platform administration', true, '', 'FORBIDDEN');
    }

    const { search, plan, status, page = 1, limit = 20 } = query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const where = {};
    if (plan) where.subscriptionPlan = plan;
    if (status) where.status = status;
    if (search && search.trim()) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    const [total, companies] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: true,
          usage: true,
          _count: {
            select: { users: true, customers: true, leads: true, deals: true }
          }
        }
      })
    ]);

    const formattedCompanies = companies.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      subscriptionPlan: c.subscriptionPlan,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      subscription: c.subscription,
      usage: {
        users: c._count.users,
        customers: c._count.customers,
        leads: c._count.leads,
        deals: c._count.deals,
        storageBytes: Number(c.usage?.storageBytes || 0)
      }
    }));

    return {
      success: true,
      data: formattedCompanies,
      meta: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    };
  }

  async getCompanyById(requestingUser, companyId) {
    if (requestingUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Only SUPER_ADMIN can access platform administration', true, '', 'FORBIDDEN');
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscription: true,
        usage: true,
        users: {
          select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
          take: 10
        }
      }
    });

    if (!company) {
      throw new ApiError(404, 'Company not found', true, '', 'NOT_FOUND');
    }

    const usage = await usageService.getUsage(companyId);
    const auditLogs = await prisma.auditLog.findMany({
      where: { companyId },
      take: 15,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    });

    return {
      success: true,
      data: {
        ...company,
        usage,
        auditLogs
      }
    };
  }

  async updateCompanyStatus(requestingUser, companyId, newStatus) {
    if (requestingUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Only SUPER_ADMIN can suspend or reactivate companies', true, '', 'FORBIDDEN');
    }

    if (!['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(newStatus)) {
      throw new ApiError(400, `Invalid company status: ${newStatus}`, true, '', 'INVALID_STATUS');
    }

    const existing = await prisma.company.findUnique({ where: { id: companyId } });
    if (!existing) {
      throw new ApiError(404, 'Company not found', true, '', 'NOT_FOUND');
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { status: newStatus }
    });

    const action = newStatus === 'SUSPENDED' ? 'COMPANY_SUSPENDED' : 'COMPANY_REACTIVATED';
    await auditLogService.logAudit({
      companyId,
      userId: requestingUser.id || requestingUser.userId,
      action,
      entityType: 'Company',
      entityId: companyId,
      description: `Company status changed to ${newStatus} by platform SUPER_ADMIN`
    });

    return {
      success: true,
      message: `Company status updated to ${newStatus}`,
      data: updated
    };
  }

  async updateCompanyPlan(requestingUser, companyId, targetPlan) {
    if (requestingUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Only SUPER_ADMIN can modify company plan overrides', true, '', 'FORBIDDEN');
    }

    if (!PLANS[targetPlan]) {
      throw new ApiError(400, `Invalid plan: ${targetPlan}`, true, '', 'INVALID_PLAN');
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new ApiError(404, 'Company not found', true, '', 'NOT_FOUND');
    }

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

    await auditLogService.logAudit({
      companyId,
      userId: requestingUser.id || requestingUser.userId,
      action: 'PLAN_CHANGED',
      entityType: 'Subscription',
      entityId: updatedSub.id,
      description: `Company subscription plan overridden to ${targetPlan} by SUPER_ADMIN`
    });

    return {
      success: true,
      message: `Company plan overridden to ${targetPlan}`,
      data: updatedSub
    };
  }

  async getPlatformAuditLogs(requestingUser, query) {
    if (requestingUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Only SUPER_ADMIN can access platform audit logs', true, '', 'FORBIDDEN');
    }

    const { companyId, userId, action, page = 1, limit = 50 } = query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const where = {};
    if (companyId) where.companyId = companyId;
    if (userId) where.userId = userId;
    if (action) where.action = action;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true, role: true } }
        }
      })
    ]);

    return {
      success: true,
      data: logs,
      meta: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    };
  }
}

module.exports = new AdminService();

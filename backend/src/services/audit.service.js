const { prisma } = require('../config/db');
const ApiError = require('../utils/apiError');

class AuditService {
  /**
   * Internal helper to record an Enterprise Audit Log entry
   */
  async logAudit({ companyId, userId, action, entityType, entityId = null, description, req = null }) {
    if (!companyId || !action || !entityType || !description) return;
    try {
      const ipAddress = req ? (req.headers['x-forwarded-for'] || req.ip || null) : null;
      const userAgent = req ? (req.headers['user-agent'] || null) : null;

      await prisma.auditLog.create({
        data: {
          companyId,
          userId: userId || null,
          action,
          entityType,
          entityId: entityId ? String(entityId) : null,
          description,
          ipAddress: ipAddress ? String(ipAddress).substring(0, 100) : null,
          userAgent: userAgent ? String(userAgent).substring(0, 255) : null
        }
      });
    } catch (err) {
      console.error('Failed to write audit log:', err.message);
    }
  }

  /**
   * Get enterprise audit logs for tenant
   */
  async getAuditLogs(requestingUser, query) {
    if (requestingUser.role === 'SALES_EXECUTIVE') {
      throw new ApiError(403, 'Sales executives cannot access audit logs', true, '', 'FORBIDDEN');
    }

    const { page = 0, limit = 20, search = '', action, entityType, userId } = query;
    const skip = Number(page) * Number(limit);

    const where = {
      companyId: requestingUser.companyId,
      ...(action && { action }),
      ...(entityType && { entityType }),
      ...(userId && { userId }),
      ...(search && {
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { action: { contains: search, mode: 'insensitive' } },
          { entityType: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [total, data] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      })
    ]);

    const totalPages = Math.ceil(total / limit) || 0;

    return {
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages
      }
    };
  }
}

module.exports = new AuditService();

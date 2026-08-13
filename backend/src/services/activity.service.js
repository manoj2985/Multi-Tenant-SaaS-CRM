const { prisma } = require('../config/db');
const ApiError = require('../utils/apiError');

class ActivityService {
  /**
   * Internal helper to record customer activity timeline event
   */
  async logCustomerActivity({ companyId, userId, customerId, action, description, metadata = null }) {
    if (!companyId || !customerId || !action || !description) return;
    try {
      await prisma.customerActivity.create({
        data: {
          companyId,
          userId: userId || null,
          customerId,
          action,
          description,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined
        }
      });
    } catch (err) {
      console.error('Failed to log customer activity:', err.message);
    }
  }

  /**
   * Fetch customer activity timeline in reverse chronological order
   */
  async getCustomerTimeline(requestingUser, customerId) {
    // Verify customer exists in tenant
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId: requestingUser.companyId,
        deletedAt: null
      }
    });

    if (!customer) {
      throw new ApiError(404, 'Customer not found or access denied', true, '', 'NOT_FOUND');
    }

    const activities = await prisma.customerActivity.findMany({
      where: {
        companyId: requestingUser.companyId,
        customerId
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return {
      success: true,
      data: activities
    };
  }
}

module.exports = new ActivityService();

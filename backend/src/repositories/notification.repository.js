const { prisma } = require('../config/db');

class NotificationRepository {
  async create(data) {
    return await prisma.notification.create({
      data
    });
  }

  async findUserNotifications({ userId, companyId, isRead, skip = 0, limit = 20 }) {
    const where = {
      userId,
      companyId,
      ...(isRead !== undefined && { isRead })
    };

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where })
    ]);

    return { items, total };
  }

  async getUnreadCount(userId, companyId) {
    return await prisma.notification.count({
      where: {
        userId,
        companyId,
        isRead: false
      }
    });
  }

  async markAsRead(id, userId, companyId) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId, companyId }
    });

    if (!notification) return null;

    return await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }

  async markAllAsRead(userId, companyId) {
    return await prisma.notification.updateMany({
      where: { userId, companyId, isRead: false },
      data: { isRead: true }
    });
  }

  async deleteNotification(id, userId, companyId) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId, companyId }
    });

    if (!notification) return null;

    return await prisma.notification.delete({
      where: { id }
    });
  }

  async findPreferencesByUserId(userId) {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId }
      });
    }

    return prefs;
  }

  async upsertPreferences(userId, data) {
    return await prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data
      }
    });
  }
}

module.exports = new NotificationRepository();

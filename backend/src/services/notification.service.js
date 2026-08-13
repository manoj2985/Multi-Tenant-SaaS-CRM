const notificationRepository = require('../repositories/notification.repository');
const auditService = require('./audit.service');
const { sendNotificationToUser } = require('../config/socket');
const ApiError = require('../utils/apiError');

class NotificationService {
  /**
   * Helper mapping NotificationType to User Preference Key
   */
  getPreferenceKeyForType(type) {
    switch (type) {
      case 'TASK_ASSIGNED':
      case 'TASK_DUE':
      case 'TASK_OVERDUE':
        return 'taskNotifications';
      case 'LEAD_ASSIGNED':
        return 'leadNotifications';
      case 'DEAL_ASSIGNED':
      case 'DEAL_STAGE_CHANGED':
        return 'dealNotifications';
      case 'MEETING_UPCOMING':
        return 'meetingNotifications';
      case 'MENTION':
      case 'SYSTEM':
      default:
        return 'systemNotifications';
    }
  }

  /**
   * Create and deliver notification respecting user preferences
   */
  async createNotification({ companyId, userId, type, title, message, entityType = null, entityId = null }) {
    if (!companyId || !userId || !type || !title || !message) return null;

    try {
      const prefs = await notificationRepository.findPreferencesByUserId(userId);
      const prefKey = this.getPreferenceKeyForType(type);

      // Check if user disabled notifications for this category
      if (prefs && prefs[prefKey] === false) {
        return null;
      }

      const notification = await notificationRepository.create({
        companyId,
        userId,
        type,
        title,
        message,
        entityType,
        entityId: entityId ? String(entityId) : null
      });

      // Emit real-time notification to user's room
      sendNotificationToUser(userId, notification);

      return notification;
    } catch (err) {
      console.error('Failed to create notification:', err.message);
      return null;
    }
  }

  async getUserNotifications(userId, companyId, query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    let isRead = undefined;
    if (query.isRead !== undefined && query.isRead !== '') {
      isRead = query.isRead === 'true' || query.isRead === true;
    }

    const { items, total } = await notificationRepository.findUserNotifications({
      userId,
      companyId,
      isRead,
      skip,
      limit
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages
      }
    };
  }

  async getUnreadCount(userId, companyId) {
    const count = await notificationRepository.getUnreadCount(userId, companyId);
    return {
      success: true,
      unreadCount: count
    };
  }

  async markAsRead(id, userId, companyId) {
    const updated = await notificationRepository.markAsRead(id, userId, companyId);
    if (!updated) {
      throw new ApiError(404, 'Notification not found', true, '', 'NOT_FOUND');
    }
    return {
      success: true,
      message: 'Notification marked as read',
      data: updated
    };
  }

  async markAllAsRead(userId, companyId) {
    await notificationRepository.markAllAsRead(userId, companyId);
    return {
      success: true,
      message: 'All notifications marked as read'
    };
  }

  async deleteNotification(id, userId, companyId) {
    const deleted = await notificationRepository.deleteNotification(id, userId, companyId);
    if (!deleted) {
      throw new ApiError(404, 'Notification not found', true, '', 'NOT_FOUND');
    }
    return {
      success: true,
      message: 'Notification deleted successfully'
    };
  }

  async getUserPreferences(userId) {
    const prefs = await notificationRepository.findPreferencesByUserId(userId);
    return {
      success: true,
      data: prefs
    };
  }

  async updateUserPreferences(userId, dto, requestingUser, req = null) {
    const updated = await notificationRepository.upsertPreferences(userId, dto);

    await auditService.logAudit({
      companyId: requestingUser.companyId,
      userId: requestingUser.id || requestingUser.userId,
      action: 'NOTIFICATION_PREFERENCE_UPDATED',
      entityType: 'NotificationPreference',
      entityId: updated.id,
      description: `User ${requestingUser.email} updated notification preferences`,
      req
    });

    return {
      success: true,
      message: 'Notification preferences updated successfully',
      data: updated
    };
  }
}

module.exports = new NotificationService();

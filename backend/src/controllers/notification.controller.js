const notificationService = require('../services/notification.service');
const { updatePreferencesSchema, notificationQuerySchema } = require('../validators/notification.validator');
const ApiError = require('../utils/apiError');

const getNotifications = async (req, res, next) => {
  try {
    const parseResult = notificationQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const userId = req.user.id || req.user.userId;
    const companyId = req.user.companyId;

    const result = await notificationService.getUserNotifications(userId, companyId, parseResult.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.userId;
    const companyId = req.user.companyId;

    const result = await notificationService.getUnreadCount(userId, companyId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user.userId;
    const companyId = req.user.companyId;

    const result = await notificationService.markAsRead(id, userId, companyId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.userId;
    const companyId = req.user.companyId;

    const result = await notificationService.markAllAsRead(userId, companyId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user.userId;
    const companyId = req.user.companyId;

    const result = await notificationService.deleteNotification(id, userId, companyId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.userId;
    const result = await notificationService.getUserPreferences(userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updatePreferences = async (req, res, next) => {
  try {
    const parseResult = updatePreferencesSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const userId = req.user.id || req.user.userId;
    const result = await notificationService.updateUserPreferences(userId, parseResult.data, req.user, req);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences
};

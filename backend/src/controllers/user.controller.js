const userService = require('../services/user.service');
const { createUserSchema, updateUserSchema, updateUserStatusSchema } = require('../validators/user.validator');
const ApiError = require('../utils/apiError');

const getCurrentUser = async (req, res, next) => {
  try {
    const result = await userService.getCurrentUserProfile(req.user.userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await userService.createUser(req.user, parseResult.data);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getCompanyUsers = async (req, res, next) => {
  try {
    const result = await userService.getCompanyUsers(req.user);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const result = await userService.getUserById(req.user, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const parseResult = updateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await userService.updateUser(req.user, req.params.id, parseResult.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const parseResult = updateUserStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await userService.updateUserStatus(req.user, req.params.id, parseResult.data.status);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentUser,
  createUser,
  getCompanyUsers,
  getUserById,
  updateUser,
  updateUserStatus
};

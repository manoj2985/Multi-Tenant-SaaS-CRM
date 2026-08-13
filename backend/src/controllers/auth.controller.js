const authService = require('../services/auth.service');
const {
  registerCompanySchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../validators/auth.validator');
const ApiError = require('../utils/apiError');

const formatZodError = (error) => {
  const issues = error.issues || error.errors || [];
  return issues.map(e => e.message).join(', ');
};

const registerCompany = async (req, res, next) => {
  try {
    const parseResult = registerCompanySchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ApiError(400, errorMsg, true, null, 'VALIDATION_ERROR');
    }

    const result = await authService.registerCompany(parseResult.data);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ApiError(400, errorMsg, true, null, 'VALIDATION_ERROR');
    }

    const result = await authService.login(parseResult.data, req);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const tokenStr = req.body.refreshToken || req.headers['x-refresh-token'];
    const parseResult = refreshTokenSchema.safeParse({ refreshToken: tokenStr });
    if (!parseResult.success) {
      throw new ApiError(400, 'Refresh token is required', true, null, 'VALIDATION_ERROR');
    }

    const result = await authService.refreshToken(parseResult.data.refreshToken);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const tokenStr = req.body.refreshToken || req.headers['x-refresh-token'];
    const result = await authService.logout(tokenStr, req);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.userId;
    const result = await authService.logoutAll(userId, req);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const parseResult = forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ApiError(400, errorMsg, true, null, 'VALIDATION_ERROR');
    }

    const result = await authService.forgotPassword(parseResult.data, req);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ApiError(400, errorMsg, true, null, 'VALIDATION_ERROR');
    }

    const result = await authService.resetPassword(parseResult.data, req);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerCompany,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword
};

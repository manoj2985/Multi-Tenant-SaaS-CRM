const dashboardService = require('../services/dashboard.service');
const { dashboardFilterSchema } = require('../validators/dashboard.validator');
const ApiError = require('../utils/apiError');

const getDashboardKpis = async (req, res, next) => {
  try {
    const parseResult = dashboardFilterSchema.safeParse(req.query);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await dashboardService.getKpis(req.user, parseResult.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getPipelineAnalytics = async (req, res, next) => {
  try {
    const parseResult = dashboardFilterSchema.safeParse(req.query);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await dashboardService.getPipeline(req.user, parseResult.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getLeadAnalytics = async (req, res, next) => {
  try {
    const parseResult = dashboardFilterSchema.safeParse(req.query);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await dashboardService.getLeads(req.user, parseResult.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getDealAnalytics = async (req, res, next) => {
  try {
    const parseResult = dashboardFilterSchema.safeParse(req.query);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await dashboardService.getDeals(req.user, parseResult.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getSalesPerformance = async (req, res, next) => {
  try {
    const parseResult = dashboardFilterSchema.safeParse(req.query);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await dashboardService.getSalesPerformance(req.user, parseResult.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getTaskAnalytics = async (req, res, next) => {
  try {
    const parseResult = dashboardFilterSchema.safeParse(req.query);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await dashboardService.getTasks(req.user, parseResult.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getMeetingAnalytics = async (req, res, next) => {
  try {
    const parseResult = dashboardFilterSchema.safeParse(req.query);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await dashboardService.getMeetings(req.user, parseResult.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardKpis,
  getPipelineAnalytics,
  getLeadAnalytics,
  getDealAnalytics,
  getSalesPerformance,
  getTaskAnalytics,
  getMeetingAnalytics
};

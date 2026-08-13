const adminService = require('../services/admin.service');
const ApiError = require('../utils/apiError');

const getCompanies = async (req, res, next) => {
  try {
    const result = await adminService.getCompanies(req.user, req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getCompanyById = async (req, res, next) => {
  try {
    const result = await adminService.getCompanyById(req.user, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateCompanyStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      throw new ApiError(400, 'Status is required', true, '', 'VALIDATION_ERROR');
    }
    const result = await adminService.updateCompanyStatus(req.user, req.params.id, status);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateCompanyPlan = async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!plan) {
      throw new ApiError(400, 'Plan is required', true, '', 'VALIDATION_ERROR');
    }
    const result = await adminService.updateCompanyPlan(req.user, req.params.id, plan);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getCompanyUsage = async (req, res, next) => {
  try {
    const result = await adminService.getCompanyById(req.user, req.params.id);
    return res.status(200).json({
      success: true,
      data: result.data.usage
    });
  } catch (error) {
    next(error);
  }
};

const getPlatformAuditLogs = async (req, res, next) => {
  try {
    const result = await adminService.getPlatformAuditLogs(req.user, req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  updateCompanyStatus,
  updateCompanyPlan,
  getCompanyUsage,
  getPlatformAuditLogs
};

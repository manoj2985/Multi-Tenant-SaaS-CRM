const companyService = require('../services/company.service');
const { updateCompanySchema, updateCompanyStatusSchema } = require('../validators/company.validator');
const ApiError = require('../utils/apiError');

const getCompanyById = async (req, res, next) => {
  try {
    const result = await companyService.getCompanyById(req.user, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const parseResult = updateCompanySchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await companyService.updateCompany(req.user, req.params.id, parseResult.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateCompanyStatus = async (req, res, next) => {
  try {
    const parseResult = updateCompanyStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await companyService.updateCompanyStatus(req.user, req.params.id, parseResult.data.status);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getAllCompanies = async (req, res, next) => {
  try {
    const result = await companyService.getAllCompanies(req.user);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanyById,
  updateCompany,
  updateCompanyStatus,
  getAllCompanies
};

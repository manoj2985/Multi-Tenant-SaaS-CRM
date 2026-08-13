const customerService = require('../services/customer.service');
const { createCustomerSchema, updateCustomerSchema } = require('../validators/customer.validator');
const { parseQuerySchema } = require('../validators/query.validator');
const ApiError = require('../utils/apiError');

const createCustomer = async (req, res, next) => {
  try {
    const parseResult = createCustomerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await customerService.createCustomer(req.user, parseResult.data);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getCustomers = async (req, res, next) => {
  try {
    const queryValidator = parseQuerySchema(['createdAt', 'name', 'companyName', 'status']);
    const parseResult = queryValidator.safeParse(req.query);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await customerService.getCustomers(req.user, parseResult.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const result = await customerService.getCustomerById(req.user, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const parseResult = updateCustomerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await customerService.updateCustomer(req.user, req.params.id, parseResult.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteCustomer = async (req, res, next) => {
  try {
    const result = await customerService.deleteCustomer(req.user, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
};

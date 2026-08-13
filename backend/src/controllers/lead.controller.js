const leadService = require('../services/lead.service');
const { 
  createLeadSchema, 
  updateLeadSchema, 
  updateLeadStatusSchema, 
  assignLeadSchema, 
  convertLeadSchema 
} = require('../validators/lead.validator');
const { parseQuerySchema } = require('../validators/query.validator');
const ApiError = require('../utils/apiError');

const createLead = async (req, res, next) => {
  try {
    const parseResult = createLeadSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await leadService.createLead(req.user, parseResult.data);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getLeads = async (req, res, next) => {
  try {
    const queryValidator = parseQuerySchema(['createdAt', 'name', 'status', 'priority', 'source']);
    const parseResult = queryValidator.safeParse(req.query);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await leadService.getLeads(req.user, parseResult.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getLeadById = async (req, res, next) => {
  try {
    const result = await leadService.getLeadById(req.user, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateLead = async (req, res, next) => {
  try {
    const parseResult = updateLeadSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await leadService.updateLead(req.user, req.params.id, parseResult.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateLeadStatus = async (req, res, next) => {
  try {
    const parseResult = updateLeadStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await leadService.updateLeadStatus(req.user, req.params.id, parseResult.data.status);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const assignLead = async (req, res, next) => {
  try {
    const parseResult = assignLeadSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await leadService.assignLead(req.user, req.params.id, parseResult.data.assignedTo);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const convertLead = async (req, res, next) => {
  try {
    const parseResult = convertLeadSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await leadService.convertLead(req.user, req.params.id, parseResult.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteLead = async (req, res, next) => {
  try {
    const result = await leadService.deleteLead(req.user, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  updateLeadStatus,
  assignLead,
  convertLead,
  deleteLead
};

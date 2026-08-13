const dealService = require('../services/deal.service');
const { 
  createDealSchema, 
  updateDealSchema, 
  updateDealStageSchema, 
  assignDealSchema 
} = require('../validators/deal.validator');
const { parseQuerySchema } = require('../validators/query.validator');
const ApiError = require('../utils/apiError');

const createDeal = async (req, res, next) => {
  try {
    const parseResult = createDealSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await dealService.createDeal(req.user, parseResult.data);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getDeals = async (req, res, next) => {
  try {
    const queryValidator = parseQuerySchema(['createdAt', 'title', 'value', 'stage', 'probability']);
    const parseResult = queryValidator.safeParse(req.query);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await dealService.getDeals(req.user, parseResult.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getPipeline = async (req, res, next) => {
  try {
    const result = await dealService.getPipeline(req.user, req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getDealById = async (req, res, next) => {
  try {
    const result = await dealService.getDealById(req.user, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateDeal = async (req, res, next) => {
  try {
    const parseResult = updateDealSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await dealService.updateDeal(req.user, req.params.id, parseResult.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateDealStage = async (req, res, next) => {
  try {
    const parseResult = updateDealStageSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await dealService.updateDealStage(req.user, req.params.id, parseResult.data.stage);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const assignDeal = async (req, res, next) => {
  try {
    const parseResult = assignDealSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await dealService.assignDeal(req.user, req.params.id, parseResult.data.assignedTo);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteDeal = async (req, res, next) => {
  try {
    const result = await dealService.deleteDeal(req.user, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDeal,
  getDeals,
  getPipeline,
  getDealById,
  updateDeal,
  updateDealStage,
  assignDeal,
  deleteDeal
};

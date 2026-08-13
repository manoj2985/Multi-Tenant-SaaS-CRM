const taskService = require('../services/task.service');
const { createTaskSchema, updateTaskSchema, updateTaskStatusSchema, assignTaskSchema } = require('../validators/task.validator');
const { parseQuerySchema } = require('../validators/query.validator');
const ApiError = require('../utils/apiError');

const createTask = async (req, res, next) => {
  try {
    const parseResult = createTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await taskService.createTask(req.user, parseResult.data, req);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const queryValidator = parseQuerySchema(['createdAt', 'dueDate', 'priority', 'status', 'title']);
    const parseResult = queryValidator.safeParse(req.query);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await taskService.getTasks(req.user, parseResult.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const result = await taskService.getTaskById(req.user, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const parseResult = updateTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await taskService.updateTask(req.user, req.params.id, parseResult.data, req);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const parseResult = updateTaskStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await taskService.updateTaskStatus(req.user, req.params.id, parseResult.data.status, req);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const assignTask = async (req, res, next) => {
  try {
    const parseResult = assignTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await taskService.assignTask(req.user, req.params.id, parseResult.data.assignedTo, req);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const result = await taskService.deleteTask(req.user, req.params.id, req);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  assignTask,
  deleteTask
};

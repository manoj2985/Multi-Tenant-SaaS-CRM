const workflowService = require('../services/workflow.service');

const createWorkflow = async (req, res, next) => {
  try {
    const result = await workflowService.createWorkflow(req.user.companyId, req.user.id, req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getWorkflows = async (req, res, next) => {
  try {
    const result = await workflowService.getWorkflows(req.user.companyId);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getWorkflowById = async (req, res, next) => {
  try {
    const result = await workflowService.getWorkflowById(req.user.companyId, req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const toggleWorkflow = async (req, res, next) => {
  try {
    const result = await workflowService.toggleWorkflow(req.user.companyId, req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const deleteWorkflow = async (req, res, next) => {
  try {
    const result = await workflowService.deleteWorkflow(req.user.companyId, req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createWorkflow,
  getWorkflows,
  getWorkflowById,
  toggleWorkflow,
  deleteWorkflow
};

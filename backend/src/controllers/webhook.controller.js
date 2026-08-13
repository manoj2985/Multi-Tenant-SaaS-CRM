const webhookService = require('../services/webhook.service');

const createWebhook = async (req, res, next) => {
  try {
    const result = await webhookService.createWebhook(req.user.companyId, req.user.id, req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getWebhooks = async (req, res, next) => {
  try {
    const result = await webhookService.getWebhooks(req.user.companyId);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getWebhookById = async (req, res, next) => {
  try {
    const result = await webhookService.getWebhookById(req.user.companyId, req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const toggleWebhook = async (req, res, next) => {
  try {
    const result = await webhookService.toggleWebhook(req.user.companyId, req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const deleteWebhook = async (req, res, next) => {
  try {
    const result = await webhookService.deleteWebhook(req.user.companyId, req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createWebhook,
  getWebhooks,
  getWebhookById,
  toggleWebhook,
  deleteWebhook
};

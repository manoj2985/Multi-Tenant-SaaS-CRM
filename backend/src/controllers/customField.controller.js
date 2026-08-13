const customFieldService = require('../services/customField.service');

const createCustomField = async (req, res, next) => {
  try {
    const result = await customFieldService.createCustomField(req.user.companyId, req.user.id, req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getCustomFields = async (req, res, next) => {
  try {
    const { entityType } = req.query;
    const result = await customFieldService.getCustomFields(req.user.companyId, entityType);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const updateCustomField = async (req, res, next) => {
  try {
    const result = await customFieldService.updateCustomField(req.user.companyId, req.params.id, req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const deleteCustomField = async (req, res, next) => {
  try {
    const result = await customFieldService.deleteCustomField(req.user.companyId, req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCustomField,
  getCustomFields,
  updateCustomField,
  deleteCustomField
};

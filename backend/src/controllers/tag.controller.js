const tagService = require('../services/tag.service');

const createTag = async (req, res, next) => {
  try {
    const result = await tagService.createTag(req.user.companyId, req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getTags = async (req, res, next) => {
  try {
    const result = await tagService.getTags(req.user.companyId);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const deleteTag = async (req, res, next) => {
  try {
    const result = await tagService.deleteTag(req.user.companyId, req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const assignTag = async (req, res, next) => {
  try {
    const result = await tagService.assignTag(req.user.companyId, req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const removeTag = async (req, res, next) => {
  try {
    const result = await tagService.removeTag(req.user.companyId, req.body);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTag,
  getTags,
  deleteTag,
  assignTag,
  removeTag
};

const advancedSearchService = require('../services/advancedSearch.service');

const search = async (req, res, next) => {
  try {
    const result = await advancedSearchService.search(req.user.companyId, req.body);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const createSavedFilter = async (req, res, next) => {
  try {
    const result = await advancedSearchService.createSavedFilter(req.user.companyId, req.user.id, req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getSavedFilters = async (req, res, next) => {
  try {
    const result = await advancedSearchService.getSavedFilters(req.user.companyId, req.user.id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const deleteSavedFilter = async (req, res, next) => {
  try {
    const result = await advancedSearchService.deleteSavedFilter(req.user.companyId, req.user.id, req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  search,
  createSavedFilter,
  getSavedFilters,
  deleteSavedFilter
};

const searchService = require('../services/search.service');
const { searchQuerySchema } = require('../validators/search.validator');
const ApiError = require('../utils/apiError');

const globalSearch = async (req, res, next) => {
  try {
    const parseResult = searchQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await searchService.globalSearch(req.user, parseResult.data.q);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  globalSearch
};

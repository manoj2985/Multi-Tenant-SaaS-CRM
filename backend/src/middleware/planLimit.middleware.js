const usageService = require('../services/usage.service');

const checkPlanLimit = (resource) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.companyId) {
        return next();
      }

      await usageService.checkLimit(req.user.companyId, resource);
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  checkPlanLimit
};

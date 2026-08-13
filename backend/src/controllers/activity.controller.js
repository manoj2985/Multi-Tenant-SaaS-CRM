const activityService = require('../services/activity.service');

const getCustomerTimeline = async (req, res, next) => {
  try {
    const result = await activityService.getCustomerTimeline(req.user, req.params.customerId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomerTimeline
};

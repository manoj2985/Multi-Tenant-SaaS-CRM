const auditService = require('../services/audit.service');

const getAuditLogs = async (req, res, next) => {
  try {
    const result = await auditService.getAuditLogs(req.user, req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs
};

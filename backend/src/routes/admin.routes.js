const express = require('express');
const {
  getCompanies,
  getCompanyById,
  updateCompanyStatus,
  updateCompanyPlan,
  getCompanyUsage,
  getPlatformAuditLogs
} = require('../controllers/admin.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('SUPER_ADMIN'));

router.get('/companies', getCompanies);
router.get('/companies/:id', getCompanyById);
router.patch('/companies/:id/status', updateCompanyStatus);
router.patch('/companies/:id/plan', updateCompanyPlan);
router.get('/companies/:id/usage', getCompanyUsage);
router.get('/audit-logs', getPlatformAuditLogs);

module.exports = router;

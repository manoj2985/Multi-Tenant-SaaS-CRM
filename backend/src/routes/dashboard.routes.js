const express = require('express');
const {
  getDashboardKpis,
  getPipelineAnalytics,
  getLeadAnalytics,
  getDealAnalytics,
  getSalesPerformance,
  getTaskAnalytics,
  getMeetingAnalytics
} = require('../controllers/dashboard.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getDashboardKpis);
router.get('/pipeline', getPipelineAnalytics);
router.get('/leads', getLeadAnalytics);
router.get('/deals', getDealAnalytics);
router.get('/sales-performance', getSalesPerformance);
router.get('/tasks', getTaskAnalytics);
router.get('/meetings', getMeetingAnalytics);

module.exports = router;

const express = require('express');
const {
  getSubscription,
  getUsage,
  getPlans,
  changePlan
} = require('../controllers/subscription.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES_MANAGER'), getSubscription);
router.get('/usage', getUsage);
router.get('/plans', getPlans);
router.post('/change-plan', requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), changePlan);

module.exports = router;

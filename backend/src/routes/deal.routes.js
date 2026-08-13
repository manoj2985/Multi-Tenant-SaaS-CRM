const express = require('express');
const { 
  createDeal, 
  getDeals, 
  getPipeline, 
  getDealById, 
  updateDeal, 
  updateDealStage, 
  assignDeal, 
  deleteDeal 
} = require('../controllers/deal.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');
const { checkPlanLimit } = require('../middleware/planLimit.middleware');

const router = express.Router();

router.use(authenticateToken);

router.post('/', checkPlanLimit('deals'), createDeal);
router.get('/', getDeals);
router.get('/pipeline', getPipeline);
router.get('/:id', getDealById);
router.put('/:id', updateDeal);
router.patch('/:id/stage', updateDealStage);
router.patch('/:id/assign', requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES_MANAGER'), assignDeal);
router.delete('/:id', requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES_MANAGER'), deleteDeal);

module.exports = router;

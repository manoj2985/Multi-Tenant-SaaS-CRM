const express = require('express');
const { 
  createLead, 
  getLeads, 
  getLeadById, 
  updateLead, 
  updateLeadStatus, 
  assignLead, 
  convertLead, 
  deleteLead 
} = require('../controllers/lead.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');
const { checkPlanLimit } = require('../middleware/planLimit.middleware');

const router = express.Router();

router.use(authenticateToken);

router.post('/', checkPlanLimit('leads'), createLead);
router.get('/', getLeads);
router.get('/:id', getLeadById);
router.put('/:id', updateLead);
router.patch('/:id/status', updateLeadStatus);
router.patch('/:id/assign', requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES_MANAGER'), assignLead);
router.post('/:id/convert', convertLead);
router.delete('/:id', requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES_MANAGER'), deleteLead);

module.exports = router;

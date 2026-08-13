const express = require('express');
const { 
  getCompanyById, 
  updateCompany, 
  updateCompanyStatus, 
  getAllCompanies 
} = require('../controllers/company.controller');
const { authenticateToken, requireRole, enforceTenantIsolation } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', requireRole('SUPER_ADMIN'), getAllCompanies);
router.get('/:id', enforceTenantIsolation('id'), getCompanyById);
router.put('/:id', requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), enforceTenantIsolation('id'), updateCompany);
router.patch('/:id/status', requireRole('SUPER_ADMIN'), updateCompanyStatus);

module.exports = router;

const express = require('express');
const { 
  createCustomer, 
  getCustomers, 
  getCustomerById, 
  updateCustomer, 
  deleteCustomer 
} = require('../controllers/customer.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');
const { checkPlanLimit } = require('../middleware/planLimit.middleware');

const router = express.Router();

router.use(authenticateToken);

router.post('/', checkPlanLimit('customers'), createCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES_MANAGER'), deleteCustomer);

module.exports = router;

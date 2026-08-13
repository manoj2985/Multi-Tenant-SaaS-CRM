const express = require('express');
const { 
  getCurrentUser, 
  createUser, 
  getCompanyUsers, 
  getUserById, 
  updateUser, 
  updateUserStatus 
} = require('../controllers/user.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');
const { checkPlanLimit } = require('../middleware/planLimit.middleware');

const router = express.Router();

// Apply authentication to all user routes
router.use(authenticateToken);

router.get('/me', getCurrentUser);
router.get('/', requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES_MANAGER'), getCompanyUsers);
router.post('/', requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES_MANAGER'), checkPlanLimit('users'), createUser);
router.get('/:id', getUserById);
router.put('/:id', requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES_MANAGER'), updateUser);
router.patch('/:id/status', requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), updateUserStatus);

module.exports = router;

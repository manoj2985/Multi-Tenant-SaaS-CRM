const express = require('express');
const { 
  createTask, 
  getTasks, 
  getTaskById, 
  updateTask, 
  updateTaskStatus, 
  assignTask, 
  deleteTask 
} = require('../controllers/task.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateToken);

router.post('/', createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/assign', requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES_MANAGER'), assignTask);
router.delete('/:id', requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES_MANAGER'), deleteTask);

module.exports = router;

const express = require('express');
const {
  createWorkflow,
  getWorkflows,
  getWorkflowById,
  toggleWorkflow,
  deleteWorkflow
} = require('../controllers/workflow.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticateToken);

router.post('/', createWorkflow);
router.get('/', getWorkflows);
router.get('/:id', getWorkflowById);
router.patch('/:id/toggle', toggleWorkflow);
router.delete('/:id', deleteWorkflow);

module.exports = router;

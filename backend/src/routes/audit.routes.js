const express = require('express');
const { getAuditLogs } = require('../controllers/audit.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES_MANAGER'));

router.get('/', getAuditLogs);

module.exports = router;

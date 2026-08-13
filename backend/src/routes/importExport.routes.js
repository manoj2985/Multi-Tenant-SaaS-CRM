const express = require('express');
const {
  previewImport,
  processImport,
  getImportJobStatus,
  exportCsv
} = require('../controllers/importExport.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticateToken);

router.post('/preview', previewImport);
router.post('/', processImport);
router.get('/status/:id', getImportJobStatus);
router.get('/export', exportCsv);

module.exports = router;

const express = require('express');
const multer = require('multer');
const {
  uploadFile,
  getFiles,
  getFileById,
  downloadFile,
  deleteFile
} = require('../controllers/file.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { checkPlanLimit } = require('../middleware/planLimit.middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max per file upload
  }
});

const router = express.Router();

router.use(authenticateToken);

router.post('/', upload.single('file'), checkPlanLimit('storage'), uploadFile);
router.get('/', getFiles);
router.get('/:id', getFileById);
router.get('/:id/download', downloadFile);
router.delete('/:id', deleteFile);

module.exports = router;

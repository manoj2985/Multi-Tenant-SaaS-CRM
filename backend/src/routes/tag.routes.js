const express = require('express');
const {
  createTag,
  getTags,
  deleteTag,
  assignTag,
  removeTag
} = require('../controllers/tag.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticateToken);

router.post('/', createTag);
router.get('/', getTags);
router.delete('/:id', deleteTag);
router.post('/assign', assignTag);
router.post('/remove', removeTag);

module.exports = router;

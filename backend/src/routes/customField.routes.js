const express = require('express');
const {
  createCustomField,
  getCustomFields,
  updateCustomField,
  deleteCustomField
} = require('../controllers/customField.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticateToken);

router.post('/', createCustomField);
router.get('/', getCustomFields);
router.put('/:id', updateCustomField);
router.delete('/:id', deleteCustomField);

module.exports = router;

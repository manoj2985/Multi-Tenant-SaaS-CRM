const express = require('express');
const {
  search,
  createSavedFilter,
  getSavedFilters,
  deleteSavedFilter
} = require('../controllers/advancedSearch.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticateToken);

router.post('/advanced', search);
router.post('/saved-filters', createSavedFilter);
router.get('/saved-filters', getSavedFilters);
router.delete('/saved-filters/:id', deleteSavedFilter);

module.exports = router;

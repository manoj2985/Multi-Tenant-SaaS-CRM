const express = require('express');
const { globalSearch } = require('../controllers/search.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', globalSearch);

module.exports = router;

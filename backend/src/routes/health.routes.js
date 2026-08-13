const express = require('express');
const { getHealth, getReady, getMetrics } = require('../controllers/health.controller');

const router = express.Router();

router.get('/health', getHealth);
router.get('/ready', getReady);
router.get('/metrics', getMetrics);
router.get('/', getHealth);

module.exports = router;

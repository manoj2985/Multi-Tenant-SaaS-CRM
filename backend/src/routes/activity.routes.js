const express = require('express');
const { getCustomerTimeline } = require('../controllers/activity.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/customer/:customerId', getCustomerTimeline);

module.exports = router;

const express = require('express');
const router = express.Router();
const { daily, monthToDate, monthly } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

// All report endpoints require authentication
router.use(authMiddleware);

router.get('/daily', daily);
router.get('/month-to-date', monthToDate);
router.get('/monthly', monthly);

module.exports = router;

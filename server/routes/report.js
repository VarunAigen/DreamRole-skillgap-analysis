const express = require('express');
const router = express.Router();
const { generateReport } = require('../controllers/reportController');
const { firebaseAuth } = require('../middleware/firebaseAuth');

// POST /api/report/generate — requires authentication (uses Puppeteer)
router.post('/generate', firebaseAuth(), generateReport);

module.exports = router;

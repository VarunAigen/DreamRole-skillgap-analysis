const express = require('express');
const router = express.Router();
const { generateReport } = require('../controllers/reportController');
const { firebaseAuth } = require('../middleware/firebaseAuth');
const { requirePlan } = require('../middleware/planGate');

// POST /api/report/generate — requires authentication (uses Puppeteer)
router.post('/generate', firebaseAuth(), requirePlan('report'), generateReport);

module.exports = router;

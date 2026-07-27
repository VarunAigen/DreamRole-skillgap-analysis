const express = require('express');
const router = express.Router();
const { analyzeJdMatch, getJdHistory, getJdAnalysis } = require('../controllers/jdController');
const { firebaseAuth } = require('../middleware/firebaseAuth');
const { validate, jdAnalyzeSchema } = require('../middleware/validation');
const { requirePlan } = require('../middleware/planGate');

// Protected JD analyzer routes — validation on the analyze endpoint
router.post('/analyze', firebaseAuth(), requirePlan('jd_analysis'), validate(jdAnalyzeSchema), analyzeJdMatch);
router.get('/history', firebaseAuth(), getJdHistory);
router.get('/:id', firebaseAuth(), getJdAnalysis);

module.exports = router;

const express = require('express');
const router = express.Router();
const { analyzeJdMatch, getJdHistory, getJdAnalysis } = require('../controllers/jdController');
const { firebaseAuth } = require('../middleware/firebaseAuth');
const { validate, jdAnalyzeSchema } = require('../middleware/validation');

// Protected JD analyzer routes — validation on the analyze endpoint
router.post('/analyze', firebaseAuth(), validate(jdAnalyzeSchema), analyzeJdMatch);
router.get('/history', firebaseAuth(), getJdHistory);
router.get('/:id', firebaseAuth(), getJdAnalysis);

module.exports = router;

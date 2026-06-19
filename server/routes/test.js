const express = require('express');
const router = express.Router();
const { generateTestController } = require('../controllers/testController');
const { firebaseAuth } = require('../middleware/firebaseAuth');

// POST /api/test/generate — requires authentication (calls OpenAI)
router.post('/generate', firebaseAuth(), generateTestController);

module.exports = router;

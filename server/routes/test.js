const express = require('express');
const router = express.Router();
const { generateTestController } = require('../controllers/testController');

// POST /api/test/generate
router.post('/generate', generateTestController);

module.exports = router;

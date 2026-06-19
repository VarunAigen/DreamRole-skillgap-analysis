const express = require('express');
const router = express.Router();
const { recommendRoles } = require('../controllers/rolesController');
const { firebaseAuth } = require('../middleware/firebaseAuth');

// POST /api/recommend-roles — requires authentication (calls OpenAI)
router.post('/', firebaseAuth(), recommendRoles);

module.exports = router;

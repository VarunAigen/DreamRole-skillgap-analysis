const express = require('express');
const router = express.Router();
const {
    listPersonas, listCategories, getPersona,
    generateRoadmap, checkSkillGap, chatWithMentor
} = require('../controllers/personaController');
const { firebaseAuth } = require('../middleware/firebaseAuth');

// GET /api/personas                    - list all (allow guest browsing)
router.get('/', firebaseAuth(true), listPersonas);

// GET /api/personas/categories          - unique category list (allow guest)
router.get('/categories', firebaseAuth(true), listCategories);

// GET /api/personas/:id                 - single mentor profile (allow guest)
router.get('/:id', firebaseAuth(true), getPersona);

// POST /api/personas/:id/roadmap        - generate career roadmap (calls OpenAI — require auth)
router.post('/:id/roadmap', firebaseAuth(), generateRoadmap);

// POST /api/personas/:id/skill-gap      - compare student skills (require auth)
router.post('/:id/skill-gap', firebaseAuth(), checkSkillGap);

// POST /api/personas/:id/chat           - chat with mentor persona (calls OpenAI — require auth)
router.post('/:id/chat', firebaseAuth(), chatWithMentor);

module.exports = router;

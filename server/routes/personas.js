const express = require('express');
const router = express.Router();
const {
    listPersonas, listCategories, getPersona,
    generateRoadmap, checkSkillGap, chatWithMentor
} = require('../controllers/personaController');

// GET /api/personas                    - list all (filter by ?category=&search=)
router.get('/', listPersonas);

// GET /api/personas/categories          - unique category list
router.get('/categories', listCategories);

// GET /api/personas/:id                 - single mentor profile
router.get('/:id', getPersona);

// POST /api/personas/:id/roadmap        - generate career roadmap
router.post('/:id/roadmap', generateRoadmap);

// POST /api/personas/:id/skill-gap      - compare student skills
router.post('/:id/skill-gap', checkSkillGap);

// POST /api/personas/:id/chat           - chat with mentor persona
router.post('/:id/chat', chatWithMentor);

module.exports = router;

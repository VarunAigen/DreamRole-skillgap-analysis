const express = require('express');
const router = express.Router();
const { generateInterviewQuestionsController, evaluateInterviewAnswerController } = require('../controllers/interviewController');

// POST /api/interview/generate  — resume-based interview questions
router.post('/generate', generateInterviewQuestionsController);

// POST /api/interview/evaluate  — evaluate one answer
router.post('/evaluate', evaluateInterviewAnswerController);

module.exports = router;

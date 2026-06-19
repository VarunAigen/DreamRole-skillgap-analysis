const OpenAI = require('openai');
const NodeCache = require('node-cache');
const crypto = require('crypto');

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'
});

// Cache: TTL = 6 hours (21600s), check expired every 10 minutes
const cache = new NodeCache({ stdTTL: 21600, checkperiod: 600 });

// Standardize on gpt-4o-mini for all calls (cheapest capable model)
const DEFAULT_MODEL = 'gpt-4o-mini';

/** SHA-256 hash of a string — used as cache key */
function hashText(text) {
    return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}

/**
 * Extract technical skills from resume text using OpenAI.
 * Cached by resume content hash — won't re-call for same resume.
 */
async function extractSkills(resumeText) {
    const cacheKey = `skills:${hashText(resumeText)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        console.log('[Cache HIT] extractSkills');
        return cached;
    }

    const prompt = `Carefully analyze the following resume text and extract all technical skills, tools, programming languages, frameworks, and core competencies mentioned.

Rules:
1. Be comprehensive: Extract skills mentioned in the technical skills section, professional experience, projects, and education.
2. Handle squashed text: If you see words merged together due to parsing errors (e.g., "PythonDjango", "SQLServer", "ReactHooks"), split them into separate, correct skills.
3. Normalize names: Convert variations to standard industry names (e.g., "ReactJS" or "React.js" to "React", "Nodejs" to "Node.js").
4. Filter noise: Only include actual skills. Exclude generic words, names, or addresses.
5. Include both hard skills (e.g., "Python", "Docker") and technical concepts/methodologies (e.g., "A/B Testing", "CI/CD", "Machine Learning").

Return a valid JSON object with the following structure:
{
  "skills": ["Skill 1", "Skill 2", ...]
}

Resume text:
${resumeText.substring(0, 6000)}`;

    const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" },
        messages: [{ 
            role: 'system', 
            content: 'You are an expert technical recruiter specializing in accurate skill extraction from resumes.' 
        }, { 
            role: 'user', 
            content: prompt 
        }],
        temperature: 0.1,
        max_tokens: 1000
    });

    try {
        const content = JSON.parse(response.choices[0].message.content.trim());
        const skills = Array.isArray(content.skills) ? content.skills : [];
        cache.set(cacheKey, skills);
        return skills;
    } catch (e) {
        console.error("Skill extraction parse error:", e);
        const text = response.choices[0].message.content.trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        return text.replace(/[\[\]"]/g, '').split(',').map(s => s.trim()).filter(Boolean);
    }
}

/**
 * Generate holistic feedback based on skill gap AND resume context.
 * Cached by role + matched + missing hash.
 */
async function generateFeedback(matched, missing, role, resumeText = '') {
    const cacheKey = `feedback:${hashText(role + matched.join() + missing.join())}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        console.log('[Cache HIT] generateFeedback');
        return cached;
    }

    const resumeContext = resumeText
        ? `\n\nAdditional context from their resume (reference specific projects or experience where relevant):\n${resumeText.substring(0, 2000)}`
        : '';

    const prompt = `You are a supportive career coach helping a student analyze their skill gap for the role of "${role}".

Their matched skills: ${matched.join(', ') || 'None detected yet'}
Skills they need to develop: ${missing.slice(0, 8).join(', ') || 'None – great alignment!'}${resumeContext}

Write a warm, encouraging, and constructive 3-4 sentence analysis:
- Start by acknowledging their existing strengths, referencing specific skills or projects from their resume if available.
- Highlight what they should work on next, being specific.
- End with a motivational sentence.
- Do NOT mention any scores, numbers, or percentages.
- Sound like a genuine mentor, not a robot.`;

    const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 350
    });

    const result = response.choices[0].message.content.trim();
    cache.set(cacheKey, result);
    return result;
}

/**
 * Generate actionable feedback: weak areas + resume improvements.
 * Cached by role + skill combo hash.
 */
async function generateActionableFeedback(matched, missing, role, resumeText = '') {
    const cacheKey = `actionable:${hashText(role + matched.join() + missing.slice(0, 5).join())}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        console.log('[Cache HIT] generateActionableFeedback');
        return cached;
    }

    const resumeContext = resumeText
        ? `\n\nApplicant Resume text:\n${resumeText.substring(0, 2500)}`
        : '';

    const prompt = `You are an expert technical recruiter analyzing a candidate's skill gap for the role of "${role}".

Their matched core skills: ${matched.join(', ') || 'None'}
Their missing core skills: ${missing.join(', ') || 'None'}${resumeContext}

Analyze the candidate's profile and identify:
1. Specific weak areas (broader concepts or tool categories based on the missing skills and their resume).
2. Actionable resume improvements (how they can improve their resume for this specific role).

Return ONLY a valid JSON object with exactly the following structure:
{
  "weak_areas": ["Area 1", "Area 2", "Area 3"],
  "resume_improvements": ["Improvement 1", "Improvement 2", "Improvement 3", "Improvement 4"]
}

Limit to 3-4 items max per list. Make them actionable and specific.
No explanation, no markdown, just the JSON object.`;

    const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 600
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        weak_areas: missing.slice(0, 3) || [],
        resume_improvements: ["Add more specific projects demonstrating missing skills.", "Ensure your terminology matches the role's core required skills."]
    };
    cache.set(cacheKey, result);
    return result;
}

/**
 * Generate MCQ questions based on missing skills + dream role + resume context.
 * Cached by role + skills hash.
 */
async function generateTest(role, missingSkills, matchedSkills = [], resumeText = '', count = 5) {
    const cacheKey = `test:${hashText(role + missingSkills.join() + matchedSkills.join())}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        console.log('[Cache HIT] generateTest');
        return cached;
    }

    const weakSkillsStr = missingSkills.slice(0, 3).join(', ') || role;
    const strongSkillsStr = matchedSkills.slice(0, 3).join(', ') || 'general knowledge';
    
    let prompt = `You are a technical interviewer assessing a candidate for a ${role} role. 
The candidate is WEAK in: [${weakSkillsStr}]. 
The candidate is STRONG in: [${strongSkillsStr}].

Generate exactly ${count} multiple-choice interview questions:
- Create 2 difficult questions specifically targeting their weak areas: [${weakSkillsStr}].
- Create 3 moderate/practical questions combining their strong areas [${strongSkillsStr}] within the context of a ${role}.`;

    if (resumeText) {
        prompt += `\nUse this resume context to make questions practical: ${resumeText.substring(0, 800)}`;
    }

    prompt += `\n\nReturn ONLY a valid JSON object strictly matching this format:
{
  "questions": [
    {
      "question": "string",
      "options": ["opt1", "opt2", "opt3", "opt4"],
      "correct_answer": "exact match to one option"
    }
  ]
}
No explanation, no markdown.`;

    const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" },
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 1500
    });

    try {
        const content = response.choices[0].message.content.trim();
        const parsed = JSON.parse(content);
        const questions = parsed.questions || [];
        cache.set(cacheKey, questions);
        return questions;
    } catch (e) {
        console.error("Test generation parse error:", e);
        return [];
    }
}

/**
 * Generate open-ended interview questions from resume content + role skills.
 * Now also generates hidden model_answer_points per question for rubric evaluation.
 * @param {string} resumeText
 * @param {string} role
 * @param {number} count
 * @param {string} userName
 * @param {object|null} categorizedSkills - from dataService.getRequiredSkillsCategorized()
 */
async function generateInterviewQuestions(resumeText, role, count = 7, userName = 'Candidate', categorizedSkills = null) {
    const cacheKey = `iq2:${hashText(resumeText + role + JSON.stringify(categorizedSkills || {}))}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        console.log('[Cache HIT] generateInterviewQuestions');
        return cached;
    }

    // Build skills context from the dataset (if available)
    let skillsContext = '';
    if (categorizedSkills && Object.keys(categorizedSkills).length > 0) {
        const sections = Object.entries(categorizedSkills)
            .filter(([, skills]) => skills && skills.length > 0)
            .map(([cat, skills]) => `  - ${cat.replace(/_/g, ' ')}: ${skills.join(', ')}`);
        if (sections.length > 0) {
            skillsContext = `\n\nREQUIRED SKILLS FOR THIS ROLE (from our verified dataset):\n${sections.join('\n')}

IMPORTANT: At least 3 of your ${count} questions MUST directly test whether the candidate knows specific skills from the list above. Ask about practical usage, not just definitions.`;
        }
    }

    const prompt = `You are an experienced technical interviewer for the role of "${role}".
You are interviewing a candidate named ${userName}.${skillsContext}

Carefully read the following resume and generate ${count} realistic, highly specific interview questions.

RULES:
- Base questions on ACTUAL content in the resume (specific project names, tech used, companies, experiences)
- Mix types: technical deep-dive, behavioral, project walkthrough, situational
- Categories: "Project Experience", "Technical Knowledge", "Internship/Work", "Problem Solving", "Career Goals"
- Make questions feel like a real interview - specific, not generic
- Do NOT ask "Tell me about yourself" - dig into specific things on the resume

For each question, also generate 3-5 "model_answer_points" — these are the KEY POINTS that an ideal answer MUST cover. They serve as a grading rubric. Be specific and technical.

Return ONLY a valid JSON array. Each item:
{
  "question": "the actual interview question",
  "category": "one of the 5 categories above",
  "hint": "brief tip on what makes a strong answer",
  "model_answer_points": ["key point 1 the ideal answer must mention", "key point 2", "key point 3"]
}

Resume:
${resumeText.substring(0, 3500)}`;

    const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 3000
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    cache.set(cacheKey, questions);
    return questions;
}

/**
 * Evaluate a SINGLE answer (kept for backward compatibility with text interview).
 */
async function evaluateInterviewAnswer(question, answer, role, category, userName = 'Candidate') {
    if (!answer || answer.trim().length < 10) {
        return {
            stage: 'Needs Improvement',
            feedback: `Your answer was too brief, ${userName}. In a real interview, always elaborate with specific examples, context, and outcomes. Use the STAR method: Situation, Task, Action, Result.`,
            strengths: [],
            improvements: ['Give a detailed answer with a specific example', 'Describe the outcome or what you learned']
        };
    }

    const prompt = `You are evaluating an interview answer from a candidate named ${userName} for the role of "${role}". Address ${userName} directly in your feedback by their name.

Category: ${category}
Question: "${question}"
Candidate ${userName}'s Answer: "${answer}"

Evaluate and return ONLY this valid JSON object:
{
  "stage": "Excellent" | "Good" | "Developing" | "Needs Improvement",
  "feedback": "2-3 sentence supportive and constructive evaluation",
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific suggestion 1", "specific suggestion 2"]
}

Criteria: specificity of examples, clarity, technical accuracy, role relevance.
Be honest but encouraging — never harsh.`;

    const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 500
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return {
        stage: 'Good',
        feedback: 'Your answer showed relevant understanding. Add more specific project examples to stand out.',
        strengths: ['Relevant approach'],
        improvements: ['Add a concrete example with outcome']
    };
}

/**
 * ★ Rubric-based batch evaluation of ALL interview answers in a SINGLE API call.
 * Uses model_answer_points for grounded accuracy checking.
 * @param {Array} questions - each has { question, category, model_answer_points? }
 * @param {Array} answers - string answers indexed to match questions
 * @param {string} role
 * @param {string} userName
 * @param {Array|null} emotionPerQuestion - optional array of { emotion, confidence } per question
 */
async function batchEvaluateAnswers(questions, answers, role, userName = 'Candidate', emotionPerQuestion = null) {
    // Build items with model answers and emotion context
    const items = questions.map((q, i) => ({
        index: i,
        question: q.question,
        category: q.category,
        answer: answers[i] || '',
        modelPoints: q.model_answer_points || [],
        emotion: emotionPerQuestion?.[i] || null
    })).filter(item => item.answer.trim().length >= 10);

    if (items.length === 0) {
        return {
            evaluations: questions.map(() => ({
                stage: 'Needs Improvement',
                score: 0,
                rubric: { technical_accuracy: 0, specificity: 0, clarity: 0, role_relevance: 0 },
                feedback: `No answer provided, ${userName}. Always attempt an answer — even partial answers show your thought process.`,
                strengths: [],
                improvements: ['Provide at least a partial answer to every question'],
                model_answer_points: []
            })),
            tokensUsed: 0
        };
    }

    const prompt = `You are a STRICT but encouraging technical interview evaluator for ${userName} applying for "${role}".

EVALUATION RUBRIC (apply consistently):
1. Technical Accuracy (40%): Does the answer correctly address the technical concepts? Compare against the MODEL ANSWER POINTS provided.
2. Specificity (25%): Does the candidate give concrete examples (project names, numbers, technologies, outcomes)?
3. Communication Clarity (20%): Is the answer well-structured, clear, and professional?
4. Role Relevance (15%): Does the answer demonstrate understanding of the "${role}" role specifically?

SCORING GUIDE:
- 85-100 → "Excellent" (covers most model answer points + adds own insights)
- 65-84  → "Good" (covers some model answer points, decent examples)
- 40-64  → "Developing" (partially correct, vague, lacks specifics)
- 0-39   → "Needs Improvement" (incorrect, off-topic, or too brief)

ANSWERS TO EVALUATE:
${items.map(item => `
Q${item.index + 1} [${item.category}]: "${item.question}"
MODEL ANSWER POINTS (what a correct answer should cover): ${item.modelPoints.length > 0 ? item.modelPoints.map((p, j) => `${j + 1}. ${p}`).join('; ') : 'No reference available — evaluate on general merit'}
Candidate's Answer: "${item.answer.substring(0, 600)}"${item.emotion ? `\nCandidate's Emotional State: ${item.emotion.emotion} (${item.emotion.confidence}% confidence)` : ''}
`).join('\n---\n')}

Return ONLY a valid JSON array (one object per answered question, SAME ORDER):
[
  {
    "index": <0-based question index>,
    "score": <0-100 numeric score>,
    "rubric": {
      "technical_accuracy": <0-100>,
      "specificity": <0-100>,
      "clarity": <0-100>,
      "role_relevance": <0-100>
    },
    "stage": "Excellent" | "Good" | "Developing" | "Needs Improvement",
    "feedback": "2-3 sentence evaluation addressing ${userName} by name. Reference specific things they said (or should have said based on model answer points).",
    "strengths": ["specific strength 1", "specific strength 2"],
    "improvements": ["actionable suggestion 1", "actionable suggestion 2"]${emotionPerQuestion ? ',\n    "emotion_note": "brief observation about their emotional state during this question (encouraging tone)"' : ''}
  }
]

CRITICAL: Be HONEST. If the answer is factually wrong or misses the model answer points, say so clearly. Do NOT give "Good" to vague or incorrect answers.`;

    const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 3500
    });

    const totalTokens = response.usage?.total_tokens || 0;
    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
        return {
            evaluations: questions.map(() => ({
                stage: 'Developing',
                score: 50,
                rubric: { technical_accuracy: 50, specificity: 50, clarity: 50, role_relevance: 50 },
                feedback: 'Answer evaluated. Add more specific examples next time.',
                strengths: [], improvements: [], model_answer_points: []
            })),
            tokensUsed: totalTokens
        };
    }

    const evaluations = JSON.parse(jsonMatch[0]);

    // Build full result array (unanswered = Needs Improvement)
    const result = questions.map((q, i) => {
        const ev = evaluations.find(e => e.index === i);
        if (ev) {
            // Attach model_answer_points so frontend can reveal them
            ev.model_answer_points = q.model_answer_points || [];
            return ev;
        }
        return {
            stage: 'Needs Improvement',
            score: 0,
            rubric: { technical_accuracy: 0, specificity: 0, clarity: 0, role_relevance: 0 },
            feedback: `This question was not answered, ${userName}. Make sure to address every question in a real interview.`,
            strengths: [],
            improvements: ['Attempt every question — partial answers count'],
            model_answer_points: q.model_answer_points || []
        };
    });

    return { evaluations: result, tokensUsed: totalTokens };
}

/**
 * Generate a career roadmap to reach a mentor's role.
 * Cached by persona.role + studentSkills hash.
 */
async function generateCareerRoadmap(persona, studentSkills = []) {
    const cacheKey = `roadmap:${hashText(persona.role + studentSkills.join())}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        console.log('[Cache HIT] generateCareerRoadmap');
        return cached;
    }

    const knownContext = studentSkills.length > 0
        ? `The student already knows: ${studentSkills.join(', ')}. Build on this foundation.`
        : 'The student is starting from a beginner level.';

    const prompt = `You are generating a career roadmap for a student who wants to become a "${persona.role}" like ${persona.name} at ${persona.company}.

Mentor Profile:
- Role: ${persona.role}
- Domain: ${persona.domain}
- Key Skills: ${persona.skills.join(', ')}
- Years of experience: ${persona.years_experience}
- Background: ${persona.bio}

${knownContext}

Create a realistic 5-7 step career roadmap. Each step should be specific, actionable, and build progressively toward this role.

Return ONLY a valid JSON array. Each item:
{
  "step": number (1, 2, 3...),
  "title": "Short action-oriented step title",
  "description": "2-3 sentence explanation of what to do and why",
  "skills_focus": ["skill1", "skill2"],
  "duration": "estimated time e.g. '2-3 months'"
}

No markdown, no explanation. Just the JSON array.`;

    const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 2000
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const roadmap = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    cache.set(cacheKey, roadmap);
    return roadmap;
}

/**
 * Chat with a mentor using their persona as system prompt.
 */
async function chatWithMentor(persona, messages, studentGoal = '') {
    const systemPrompt = `You are ${persona.name}, a ${persona.role} at ${persona.company} with ${persona.years_experience} years of experience.

Your background: ${persona.bio}
Your core expertise: ${persona.skills.join(', ')}
Domain: ${persona.domain}

You are mentoring a student${studentGoal ? ` whose goal is: ${studentGoal}` : ''}.

CRITICAL RULES:
- By default, keep your responses brief, crisp, and direct (2-3 short sentences max). Sound like a busy professional giving a quick, valuable tip.
- If the user explicitly asks for details, deep explanation, or list of points (e.g. "explain in detail", "give points", etc.), then provide a comprehensive, structured response with detailed points and explanations.
- Use first person naturally. Reference your own career only when highly relevant.`;

    const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages
        ],
        temperature: 0.65,
        max_tokens: 800
    });

    return response.choices[0].message.content.trim();
}

/** Expose cache stats for admin monitoring */
function getCacheStats() {
    return cache.getStats();
}

/** Manually flush the cache (admin action) */
function flushCache() {
    cache.flushAll();
}

module.exports = {
    extractSkills,
    generateFeedback,
    generateActionableFeedback,
    generateTest,
    generateInterviewQuestions,
    evaluateInterviewAnswer,
    batchEvaluateAnswers,
    generateCareerRoadmap,
    chatWithMentor,
    getCacheStats,
    flushCache
};

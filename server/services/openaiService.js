const OpenAI = require('openai');
const NodeCache = require('node-cache');
const crypto = require('crypto');

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_initialization',
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

    try {
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

        const content = JSON.parse(response.choices[0].message.content.trim());
        const skills = Array.isArray(content.skills) ? content.skills : [];
        cache.set(cacheKey, skills);
        return skills;
    } catch (e) {
        console.warn("Skill extraction API error, using keyword fallback:", e.message);
        const fallbackSkills = fallbackExtractSkills(resumeText);
        cache.set(cacheKey, fallbackSkills);
        return fallbackSkills;
    }
}

const COMMON_SKILLS = [
    // Programming Languages
    "Python", "Java", "C++", "C", "C#", "JavaScript", "TypeScript", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "CUDA",
    // Web & Mobile Frameworks
    "React", "React.js", "React Native", "Node.js", "Express", "Express.js", "FastAPI", "Django", "Flask", "Spring Boot", 
    "Angular", "Vue.js", "Next.js", "Vite", "ASP.NET", "Bootstrap", "Tailwind CSS", "HTML", "CSS", "Expo",
    // AI, ML & Data Science
    "Machine Learning", "Deep Learning", "NLP", "Natural Language Processing", "OpenAI API", "RAG", "ChromaDB",
    "TensorFlow", "PyTorch", "Scikit-Learn", "Pandas", "NumPy", "CUDA", "Sentiment Analysis", "Classification", "Regression",
    // Databases & Cloud
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "SQLite", "SQL Server", "Redis", "Firebase", "AWS", "GCP", "Azure", "Cloud Computing",
    // Developer Tools & DevOps
    "Git", "GitHub", "Docker", "Kubernetes", "CI/CD", "Linux", "REST API", "GraphQL", "JWT",
    // Cybersecurity & Security
    "Cybersecurity", "Threat Analysis", "Risk Mitigation", "Threat Recognition", "Secure Systems"
];

function fallbackExtractSkills(resumeText) {
    if (!resumeText) return [];
    const textLower = resumeText.toLowerCase();
    const found = new Set();

    for (const skill of COMMON_SKILLS) {
        const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(?:^|[^a-zA-Z0-9_#+])${escaped}(?:$|[^a-zA-Z0-9_#+])`, 'i');
        if (regex.test(textLower)) {
            // Normalize variants (e.g. React.js -> React, Express.js -> Express)
            let norm = skill;
            if (norm === 'React.js') norm = 'React';
            if (norm === 'Express.js') norm = 'Express';
            found.add(norm);
        }
    }
    return Array.from(found);
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

    const prompt = `You are a STRICT, grounded technical and HR interview evaluator evaluating answers for ${userName} applying for the role of "${role}".

EVALUATION RUBRIC & SCORING RULES:
1. Technical Accuracy (40%): Evaluate factual correctness against the MODEL ANSWER POINTS provided. Penalize buzzword-stuffing or incorrect statements.
2. STAR Structure & Specificity (25%): Evaluate if the answer follows STAR (Situation, Task, Action, Result). Did they mention concrete technologies, numbers, or specific actions?
3. Communication Clarity (20%): Is the answer concise, logical, and clear?
4. Role Relevance (15%): Does it directly fit the expectations for a "${role}"?

SCORING CONSTRAINTS:
- 85-100 → "Excellent" (Covers most model points + STAR structured + specific)
- 65-84  → "Good" (Covers key points, good response, minor gaps)
- 40-64  → "Developing" (Vague, lacks specific actions/metrics, misses core technical points)
- 0-39   → "Needs Improvement" (Factually wrong, off-topic, or under 15 words)

ANSWERS TO EVALUATE:
${items.map(item => `
Q${item.index + 1} [${item.category}]: "${item.question}"
MODEL ANSWER POINTS: ${item.modelPoints.length > 0 ? item.modelPoints.map((p, j) => `${j + 1}. ${p}`).join('; ') : 'Evaluate on technical merit'}
Candidate's Answer: "${item.answer.substring(0, 800)}"${item.emotion ? `\nEmotional state during answer: ${item.emotion.emotion} (${item.emotion.confidence}% confidence)` : ''}
`).join('\n---\n')}

Return ONLY a valid JSON array matching this structure exactly (one item per answered question, same order):
[
  {
    "index": <0-based index>,
    "score": <0-100 score>,
    "rubric": {
      "technical_accuracy": <0-100>,
      "specificity": <0-100>,
      "clarity": <0-100>,
      "role_relevance": <0-100>
    },
    "stage": "Excellent" | "Good" | "Developing" | "Needs Improvement",
    "feedback": "2-3 sentence honest evaluation addressing ${userName} by name. Detail what was done well vs missed.",
    "strengths": ["specific strength 1", "specific strength 2"],
    "improvements": ["actionable improvement 1", "actionable improvement 2"],
    "hr_reframed_answer": "A 2-4 sentence polished, STAR-structured model answer that ${userName} SHOULD have given for this question to impress HR or a Senior Mentor."${emotionPerQuestion ? ',\n    "emotion_note": "Observation on confidence & vocal delivery"' : ''}
  }
]
`;

    const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" },
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 3800
    });

    const totalTokens = response.usage?.total_tokens || 0;
    const content = response.choices[0].message.content.trim();
    let jsonMatch = content.match(/\[[\s\S]*\]/);

    if (!jsonMatch && content.startsWith('{')) {
        // Fallback if returned object wrapping array
        try {
            const parsedObj = JSON.parse(content);
            if (Array.isArray(parsedObj.evaluations)) {
                jsonMatch = [JSON.stringify(parsedObj.evaluations)];
            }
        } catch (e) {}
    }

    if (!jsonMatch) {
        return {
            evaluations: questions.map(() => ({
                stage: 'Developing',
                score: 50,
                rubric: { technical_accuracy: 50, specificity: 50, clarity: 50, role_relevance: 50 },
                feedback: 'Answer evaluated. Add more specific project details and outcomes next time.',
                strengths: [], improvements: [], model_answer_points: [], hr_reframed_answer: ''
            })),
            tokensUsed: totalTokens
        };
    }

    const evaluations = JSON.parse(jsonMatch[0]);

    // Build full result array (unanswered = Needs Improvement)
    const result = questions.map((q, i) => {
        const ev = evaluations.find(e => e.index === i);
        if (ev) {
            ev.model_answer_points = q.model_answer_points || [];
            ev.hr_reframed_answer = ev.hr_reframed_answer || '';
            return ev;
        }
        return {
            stage: 'Needs Improvement',
            score: 0,
            rubric: { technical_accuracy: 0, specificity: 0, clarity: 0, role_relevance: 0 },
            feedback: `This question was not answered, ${userName}. Make sure to address every question in a real interview.`,
            strengths: [],
            improvements: ['Attempt every question — partial answers count'],
            model_answer_points: q.model_answer_points || [],
            hr_reframed_answer: ''
        };
    });

    return { evaluations: result, tokensUsed: totalTokens };
}

/**
 * Transcribe audio using OpenAI Whisper API (`whisper-1`).
 * @param {Buffer} audioBuffer - Buffer of the audio file
 * @param {string} originalName - e.g. "recording.webm"
 * @returns {Promise<string>} Transcribed text
 */
async function transcribeAudio(audioBuffer, originalName = 'audio.webm') {
    const Readable = require('stream').Readable;
    const stream = new Readable();
    stream.push(audioBuffer);
    stream.push(null);
    stream.path = originalName;

    const response = await client.audio.transcriptions.create({
        file: stream,
        model: 'whisper-1',
        language: 'en',
        temperature: 0.2
    });

    return response.text ? response.text.trim() : '';
}

/**
 * Generate speech audio from text using OpenAI Speech API (`tts-1`).
 * @param {string} text - Question or text to read aloud
 * @param {string} voice - Voice choice ('nova', 'alloy', 'echo', 'fable', 'onyx', 'shimmer')
 * @returns {Promise<Buffer>} MP3 audio buffer
 */
async function generateTTS(text, voice = 'nova') {
    const mp3Response = await client.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: text.substring(0, 1000)
    });

    const arrayBuffer = await mp3Response.arrayBuffer();
    return Buffer.from(arrayBuffer);
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

/**
 * ★ Advanced JD Gap Analysis Engine — rubric-based scoring with honesty guardrails.
 * Compares resume against JD using weighted categories and flags hard disqualifiers.
 */
async function generateJdMatch(resumeText, jdText) {
    const cacheKey = `jd:${hashText(resumeText.substring(0, 500) + jdText.substring(0, 500))}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        console.log('[Cache HIT] generateJdMatch');
        return cached;
    }

    const prompt = `You are a resume-to-job-description gap analysis engine. Your job is to compare a candidate's resume against a job description and output an accurate, structured gap report. You are NOT writing a new resume — you are diagnosing gaps and scoring fit.

INPUTS:

JOB DESCRIPTION:
${jdText.substring(0, 5000)}

RESUME:
${resumeText.substring(0, 5000)}

YOUR TASK — do the following in order:

1. EXTRACT REQUIREMENTS FROM THE JD
   - Separate into: (a) Hard requirements/basic qualifications (degree, CGPA, years of experience, graduation year, availability/location) (b) Core technical skills/tools named explicitly (c) Preferred/nice-to-have qualifications (d) Soft skills or behavioral traits mentioned
   - Note which are phrased as mandatory ("must have", "required") vs preferred ("nice to have", "preferred", "bonus").

2. EXTRACT SIGNAL FROM THE RESUME
   - Pull out: stated degree + CGPA/GPA if present, all named tools/technologies/languages, all project descriptions with their tech stacks, all work experience with responsibilities, certifications, soft-skill evidence (leadership roles, communication evidence, etc.)
   - Do not infer skills that are not explicitly stated or strongly implied by a named tool/project. E.g., listing "Node.js" does NOT imply "AWS Lambda" experience.

3. MATCH AND SCORE
   - For each hard requirement: mark as MET / NOT MET / UNCLEAR (unclear = resume doesn't state it, e.g. no CGPA listed).
   - For each core technical skill in the JD: mark as DIRECT MATCH (explicitly named in resume), ADJACENT MATCH (resume shows a related/transferable skill, e.g. "GCP" resume vs "AWS" JD), or GAP (no evidence at all).
   - Do not count a keyword as matched just because a similar-sounding word appears elsewhere out of context.
   - Calculate a numeric score out of 100 using this weighting: Hard/basic qualifications met = 40%, Core technical skill match = 35%, Preferred qualifications = 15%, Soft skills/culture signals = 10%.
   - Hard requirement failures (e.g. wrong degree type, CGPA below stated cutoff) should cap the overall score — flag explicitly as "may be an automatic disqualifier" rather than just averaging it in.

4. OUTPUT FORMAT — return ONLY this JSON:
{
  "overall_score": <0-100>,
  "hard_requirement_flags": [
    {"requirement": "...", "status": "met|not_met|unclear", "note": "..."}
  ],
  "matched_keywords": ["..."],
  "adjacent_matches": [{"jd_term": "...", "resume_term": "...", "note": "why this counts as partial"}],
  "missing_keywords": ["..."],
  "formatting_issues": ["..."],
  "actionable_suggestions": [
    {
      "type": "add_section|rephrase_bullet|add_project|get_certification|fill_missing_field",
      "suggestion": "...",
      "honesty_note": "Only suggest this if user can truthfully claim it OR frame it as a suggestion to go acquire this skill before applying — NEVER suggest resume language that fabricates experience"
    }
  ],
  "shortlist_likelihood": "low|medium|high",
  "shortlist_reasoning": "1-2 sentence honest explanation, mentioning any hard disqualifiers explicitly",
  "projects": [
    {
      "title": "Suggested project name",
      "description": "Short description integrating missing skills",
      "tags": ["skill1", "skill2"],
      "link": "https://github.com/topics/relevant-topic"
    }
  ],
  "certifications": [
    {
      "title": "Relevant certification name",
      "platform": "Coursera/Udemy/AWS/etc",
      "link": "https://example.com"
    }
  ]
}

CRITICAL GUARDRAILS:
- NEVER generate resume bullet suggestions that claim tools/experience not evidenced in the original resume. If a keyword is missing, suggest it as a skill-gap to close via a project/course, not as resume copy to paste in.
- Do not inflate the score. Be calibrated — most real resumes against a specific JD should score 40-75, not 85+. Scores in high 80s/90s should be rare.
- If the resume is missing a data point needed to evaluate a hard requirement (like CGPA), mark it "unclear" and flag it as a risk, not a pass.
- Be specific with the missing keyword list — pull exact terms from the JD's tech stack, not generic categories.
- Limit: missing_keywords max 10, projects max 2, certifications max 2, actionable_suggestions max 5.`;

    const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" },
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 3000
    });

    try {
        const content = response.choices[0].message.content.trim();
        const parsed = JSON.parse(content);
        
        // Normalize: ensure backward-compatible match_score alias
        parsed.match_score = parsed.overall_score || 0;
        
        // Ensure all expected arrays exist
        parsed.hard_requirement_flags = parsed.hard_requirement_flags || [];
        parsed.matched_keywords = parsed.matched_keywords || [];
        parsed.adjacent_matches = parsed.adjacent_matches || [];
        parsed.missing_keywords = parsed.missing_keywords || [];
        parsed.formatting_issues = parsed.formatting_issues || [];
        parsed.actionable_suggestions = parsed.actionable_suggestions || [];
        parsed.projects = parsed.projects || [];
        parsed.certifications = parsed.certifications || [];
        parsed.shortlist_likelihood = parsed.shortlist_likelihood || 'medium';
        parsed.shortlist_reasoning = parsed.shortlist_reasoning || '';

        // Build backward-compatible ats_check from the new fields
        parsed.ats_check = {
            score: parsed.overall_score || 0,
            feedback: parsed.shortlist_reasoning || '',
            formatting_issues: parsed.formatting_issues || []
        };
        // Build backward-compatible summary_update and suggested_bullet_points
        parsed.summary_update = parsed.shortlist_reasoning || '';
        parsed.suggested_bullet_points = (parsed.actionable_suggestions || [])
            .filter(s => s.type === 'rephrase_bullet')
            .map(s => s.suggestion);

        cache.set(cacheKey, parsed);
        return parsed;
    } catch (e) {
        console.error("JD Match parsing error:", e);
        throw new Error("Failed to parse AI response for JD match");
    }
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
    transcribeAudio,
    generateTTS,
    generateCareerRoadmap,
    chatWithMentor,
    generateJdMatch,
    getCacheStats,
    flushCache
};

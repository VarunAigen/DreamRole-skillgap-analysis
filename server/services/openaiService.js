const OpenAI = require('openai');

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'
});

/**
 * Extract technical skills from resume text using OpenAI.
 */
async function extractSkills(resumeText) {
    const prompt = `Extract the technical skills mentioned in this resume text. 
Return ONLY a valid JSON array of skill names (strings). No explanation, no markdown, just the JSON array.
Example output: ["HTML", "CSS", "JavaScript", "React"]

Resume text:
${resumeText.substring(0, 4000)}`;

    const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 500
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return content.replace(/[\[\]"]/g, '').split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Generate holistic feedback based on skill gap AND resume context (projects, experience).
 * @param {string[]} matched
 * @param {string[]} missing
 * @param {string} role
 * @param {string} resumeText - full resume text for project/experience context
 */
async function generateFeedback(matched, missing, role, resumeText = '') {
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
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 350
    });

    return response.choices[0].message.content.trim();
}

/**
 * Generate actionable feedback including weak areas and resume improvements.
 * @param {string[]} matched
 * @param {string[]} missing
 * @param {string} role
 * @param {string} resumeText
 */
async function generateActionableFeedback(matched, missing, role, resumeText = '') {
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
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 600
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    
    return {
        weak_areas: missing.slice(0, 3) || [],
        resume_improvements: ["Add more specific projects demonstrating missing skills.", "Ensure your terminology matches the role's core required skills."]
    };
}

/**
 * Generate MCQ questions based on missing skills + dream role + resume context.
 * @param {string} role
 * @param {string[]} missingSkills
 * @param {string} resumeText - for practical, resume-aware questions
 * @param {number} count
 */
async function generateTest(role, missingSkills, resumeText = '', count = 5) {
    const skillsToTest = missingSkills.slice(0, 5).join(', ') || role;
    const resumeHint = resumeText
        ? `\nAlso consider this resume context to make questions practical and relevant: ${resumeText.substring(0, 800)}`
        : '';

    const prompt = `Generate ${count} multiple choice questions to test knowledge in: ${skillsToTest}
Context: These are for a ${role} role assessment. Mix theoretical and practical questions.${resumeHint}

Return ONLY a valid JSON array. Each item must have:
- "question": string (practical and specific)
- "options": array of exactly 4 strings
- "correct_answer": string (must match one of the options exactly)

No explanation, no markdown, just the JSON array.`;

    const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 1500
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return [];
}

/**
 * Generate open-ended interview questions from the actual resume content.
 * Based on real projects, internships, and experiences mentioned.
 * @param {string} resumeText
 * @param {string} role - dream role
 * @param {number} count
 * @returns {Promise<Array>} - [{question, category, hint}]
 */
async function generateInterviewQuestions(resumeText, role, count = 7) {
    const prompt = `You are an experienced technical interviewer for the role of "${role}".

Carefully read the following resume and generate ${count} realistic, highly specific interview questions.

RULES:
- Base questions on ACTUAL content in the resume (specific project names, tech used, companies, experiences)
- Mix types: technical deep-dive, behavioral, project walkthrough, situational
- Categories: "Project Experience", "Technical Knowledge", "Internship/Work", "Problem Solving", "Career Goals"
- Make questions feel like a real interview - specific, not generic
- Do NOT ask "Tell me about yourself" - dig into specific things on the resume

Return ONLY a valid JSON array. Each item:
{
  "question": "the actual interview question",
  "category": "one of the 5 categories above",
  "hint": "brief tip on what makes a strong answer (shown AFTER they answer)"
}

Resume:
${resumeText.substring(0, 3500)}`;

    const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 1800
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return [];
}

/**
 * Evaluate a candidate's answer to an interview question.
 * No numeric scores — returns qualitative stage + constructive feedback.
 * @param {string} question
 * @param {string} answer
 * @param {string} role
 * @param {string} category
 */
async function evaluateInterviewAnswer(question, answer, role, category) {
    if (!answer || answer.trim().length < 10) {
        return {
            stage: 'Needs Improvement',
            feedback: 'Your answer was too brief. In a real interview, always elaborate with specific examples, context, and outcomes. Use the STAR method: Situation, Task, Action, Result.',
            strengths: [],
            improvements: ['Give a detailed answer with a specific example', 'Describe the outcome or what you learned']
        };
    }

    const prompt = `You are evaluating a candidate's interview answer for the role of "${role}".

Category: ${category}
Question: "${question}"
Candidate's Answer: "${answer}"

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
        model: 'gpt-3.5-turbo',
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
 * Generate a step-by-step career roadmap to reach a mentor's role.
 * @param {Object} persona - Full mentor persona object
 * @param {string[]} studentSkills - What the student already knows
 * @returns {Promise<Array>} - [{step, title, description, skills_focus, duration}]
 */
async function generateCareerRoadmap(persona, studentSkills = []) {
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
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 2000
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return [];
}

/**
 * Chat with a mentor using their persona as system prompt.
 * @param {Object} persona - Mentor persona
 * @param {Array} messages - [{role: 'user'|'assistant', content: string}]
 * @param {string} studentGoal - What the student wants to achieve
 * @returns {Promise<string>} - mentor reply
 */
async function mentorChat(persona, messages = [], studentGoal = '') {
    const systemPrompt = `You are ${persona.name}, a ${persona.role} at ${persona.company} with ${persona.years_experience} years of experience in ${persona.domain}.

Your skills include: ${persona.skills.join(', ')}.

Background: ${persona.bio}

You are mentoring a student who wants to enter your field${studentGoal ? ` and specifically wants to: ${studentGoal}` : ''}. 

Provide practical career advice, specific learning steps, honest industry insights, and encouragement. Speak as yourself — use your actual experiences and background. Be conversational, warm, and direct. Keep responses concise (3-5 sentences) unless a detailed answer is genuinely needed.`;

    const chatMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10) // keep last 10 turns for context
    ];

    // If no messages, create an opening message
    if (messages.length === 0) {
        chatMessages.push({
            role: 'user',
            content: studentGoal || `Hi ${persona.name}, I want to become a ${persona.role}. Where should I start?`
        });
    }

    const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 600
    });

    return response.choices[0].message.content.trim();
}

module.exports = {
    extractSkills,
    generateFeedback,
    generateActionableFeedback,
    generateTest,
    generateInterviewQuestions,
    evaluateInterviewAnswer,
    generateCareerRoadmap,
    mentorChat
};

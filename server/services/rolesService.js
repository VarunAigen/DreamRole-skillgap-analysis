const OpenAI = require('openai');

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'
});

async function recommendRolesAI(resumeText, skills) {
    const prompt = `You are a professional technical recruiter. Based on the candidate's resume and extracted skills, suggest the top 3-5 suitable job roles.
For each role, calculate a strict match_percentage based on the following structured grading rubric:

GRADING RUBRIC FOR MATCH PERCENTAGE:
- 90% - 100%: Candidate has ALL core skills required for the role, has worked directly in similar roles, and has deep experience in the main technologies.
- 80% - 89%: Candidate has most of the core skills and technologies, but lacks some secondary libraries or has limited years of experience in that exact domain.
- 70% - 79%: Candidate has basic foundational knowledge (e.g., knows Python/JS) but lacks direct domain experience (e.g., knows Python but has no ML libraries for a Machine Learning role).
- 50% - 69%: Candidate has minimal skill overlap (only general tools like Git or basic command line) and would need significant upskilling.
- Below 50%: Very low compatibility; candidate does not possess the primary programming languages or frameworks required for the role.

Return ONLY a valid JSON object strictly matching this format:
{
  "recommended_roles": [
    {
      "role": "Role Name",
      "match_percentage": 85,
      "reason": "Clear explanation referencing which core skills the candidate has, which ones they are missing, and how it maps to the rubric score."
    }
  ]
}

Candidate's Extracted Skills: ${(skills || []).join(', ')}

Resume text:
${resumeText.substring(0, 3000)}`;

    const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        response_format: { type: "json_object" },
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 800
    });

    try {
        const content = response.choices[0].message.content.trim();
        const parsed = JSON.parse(content);
        return parsed.recommended_roles || [];
    } catch (e) {
        console.error("Recommend roles parse error:", e);
        return [];
    }
}

module.exports = {
    recommendRolesAI
};

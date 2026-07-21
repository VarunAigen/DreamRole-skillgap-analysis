const { z } = require('zod');

/**
 * Generic validation middleware factory.
 * Usage: router.post('/analyze', validate(analyzeSchema), controller)
 */
function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message
            }));
            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }
        // Replace body with parsed (coerced/defaulted) data
        req.body = result.data;
        next();
    };
}

// ── Schemas ──

const analyzeSchema = z.object({
    resume_skills: z.array(z.string().max(200)).min(1, 'At least one skill is required'),
    role: z.string().min(1).max(200),
    user_id: z.string().max(200).optional(),
    resume_text: z.string().max(15000).optional()
});

const jdAnalyzeSchema = z.object({
    jd_text: z.string().min(50, 'Job description must be at least 50 characters').max(20000),
    resume_text: z.string().min(50, 'Resume text must be at least 50 characters').max(20000),
    job_title: z.string().max(200).default('Unknown Role'),
    company_name: z.string().max(200).default('Unknown Company')
});

const interviewGenerateSchema = z.object({
    resume_text: z.string().min(50).max(15000),
    role: z.string().min(1).max(200),
    count: z.number().int().min(1).max(10).default(7),
    user_name: z.string().max(100).optional()
});

const interviewEvaluateSchema = z.object({
    question: z.string().min(1).max(2000),
    answer: z.string().max(5000).optional().default(''),
    role: z.string().min(1).max(200),
    category: z.string().max(100).optional().default('General'),
    user_name: z.string().max(100).optional()
});

module.exports = {
    validate,
    analyzeSchema,
    jdAnalyzeSchema,
    interviewGenerateSchema,
    interviewEvaluateSchema
};

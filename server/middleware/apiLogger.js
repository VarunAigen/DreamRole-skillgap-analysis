const ApiLog = require('../models/ApiLog');

// gpt-4o-mini pricing (per 1K tokens, USD) — update as pricing changes
const MODEL_PRICING = {
    'gpt-4o-mini':       { input: 0.00015, output: 0.0006 },
    'gpt-3.5-turbo':     { input: 0.0005,  output: 0.0015 },
    'gpt-4o':            { input: 0.005,   output: 0.015  },
};

/**
 * Attaches a logger to res.json so we can capture the final status + any token data.
 * Usage: app.use(apiLogger) — place AFTER body parser, BEFORE routes.
 */
function apiLogger(req, res, next) {
    const start = Date.now();
    const originalJson = res.json.bind(res);

    res.json = function (data) {
        const latencyMs = Date.now() - start;

        // Pull token info injected by controllers via res.locals
        const tokensUsed = res.locals.tokensUsed || 0;
        const openaiModel = res.locals.openaiModel || null;
        const isError = res.statusCode >= 400;

        // Cost estimation
        let estimatedCostUSD = 0;
        if (openaiModel && tokensUsed > 0) {
            const pricing = MODEL_PRICING[openaiModel];
            if (pricing) {
                // Rough split: assume 60% input, 40% output tokens
                estimatedCostUSD = parseFloat((
                    (tokensUsed * 0.6 / 1000) * pricing.input +
                    (tokensUsed * 0.4 / 1000) * pricing.output
                ).toFixed(6));
            }
        }

        // Only log /api/* routes
        if (req.path.startsWith('/api/')) {
            ApiLog.create({
                uid: req.user?.uid || 'anonymous',
                endpoint: req.path,
                method: req.method,
                statusCode: res.statusCode,
                latencyMs,
                openaiModel,
                tokensUsed,
                estimatedCostUSD,
                isError,
                errorMessage: isError && data?.error ? String(data.error) : null
            }).catch(err => console.warn('[ApiLogger] Failed to log:', err.message));
        }

        return originalJson(data);
    };

    next();
}

module.exports = apiLogger;

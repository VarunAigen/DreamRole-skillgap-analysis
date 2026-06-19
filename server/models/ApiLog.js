const mongoose = require('mongoose');

/**
 * ApiLog — tracks every backend API call for admin monitoring and cost analysis.
 */
const ApiLogSchema = new mongoose.Schema({
    uid: { type: String, default: 'anonymous' },   // Firebase UID or 'anonymous'
    endpoint: { type: String, required: true },     // e.g. /api/skills/extract
    method: { type: String, default: 'POST' },
    statusCode: { type: Number, default: 200 },
    latencyMs: { type: Number, default: 0 },
    openaiModel: { type: String, default: null },   // e.g. gpt-4o-mini
    tokensUsed: { type: Number, default: 0 },       // total tokens (prompt + completion)
    estimatedCostUSD: { type: Number, default: 0 }, // calculated at log time
    isError: { type: Boolean, default: false },
    errorMessage: { type: String, default: null }
}, {
    timestamps: true,
    // Auto-expire logs after 90 days
    expires: '90d'
});

ApiLogSchema.index({ endpoint: 1, createdAt: -1 });
ApiLogSchema.index({ uid: 1, createdAt: -1 });
ApiLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ApiLog', ApiLogSchema);

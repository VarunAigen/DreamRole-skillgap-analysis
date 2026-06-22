require('dotenv').config();
const connectDB = require('./config/db');
connectDB();
const express = require('express');
const cors = require('cors');
const path = require('path');

const resumeRoutes       = require('./routes/resume');
const skillsRoutes       = require('./routes/skills');
const analysisRoutes     = require('./routes/analysis');
const testRoutes         = require('./routes/test');
const recommendationsRoutes = require('./routes/recommendations');
const mentorsRoutes      = require('./routes/mentors');
const reportRoutes       = require('./routes/report');
const progressRoutes     = require('./routes/progress');
const interviewRoutes    = require('./routes/interview');
const personaRoutes      = require('./routes/personas');
const rolesRoutes        = require('./routes/roles');
const adminRoutes        = require('./routes/admin');
const mentorAnalyticsRoutes = require('./routes/mentorAnalytics');
const authRoutes         = require('./routes/auth');
const profileRoutes      = require('./routes/profile');
const chatRoutes         = require('./routes/chat');

// Middleware
const apiLogger = require('./middleware/apiLogger');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
        : ['http://localhost:5173', 'http://localhost:3000', 'https://dreamrole-app-platform.netlify.app'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── API Logger (logs every /api/* call to MongoDB) ────────────────────────────
app.use(apiLogger);

// ── Rate Limiting on heavy AI endpoints ──────────────────────────────────────
const rateLimit = require('express-rate-limit');
const aiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20,
    message: { error: "Too many requests — please slow down." }
});
app.use('/api/skills/extract',        aiLimiter);
app.use('/api/test/generate',         aiLimiter);
app.use('/api/interview/generate',    aiLimiter);
app.use('/api/interview/evaluate',    aiLimiter);
app.use('/api/interview/evaluate-all',aiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/resume',          resumeRoutes);
app.use('/api/skills',          skillsRoutes);
app.use('/api/analysis',        analysisRoutes);
app.use('/api/test',            testRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/mentors',         mentorsRoutes);
app.use('/api/report',          reportRoutes);
app.use('/api/progress',        progressRoutes);
app.use('/api/interview',       interviewRoutes);
app.use('/api/personas',        personaRoutes);
app.use('/api/recommend-roles', rolesRoutes);
app.use('/api/admin',           adminRoutes);
app.use('/api/mentor',          mentorAnalyticsRoutes);
app.use('/api/auth',            authRoutes);
app.use('/api/profile',         profileRoutes);
app.use('/api/chat',            chatRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'DreamRole API is running', timestamp: new Date().toISOString() });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message || 'Something went wrong'
    });
});

const { checkAndScheduleWeeklyUpdate } = require('./scripts/update_dataset');

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 DreamRole Backend running on http://localhost:${PORT}`);
        console.log(`📋 API Health: http://localhost:${PORT}/api/health`);
        
        // Check and trigger weekly dataset auto-update using Gemini API
        checkAndScheduleWeeklyUpdate();
    });
}

module.exports = app;

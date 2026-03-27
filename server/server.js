require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const resumeRoutes = require('./routes/resume');
const skillsRoutes = require('./routes/skills');
const analysisRoutes = require('./routes/analysis');
const testRoutes = require('./routes/test');
const recommendationsRoutes = require('./routes/recommendations');
const mentorsRoutes = require('./routes/mentors');
const reportRoutes = require('./routes/report');
const progressRoutes = require('./routes/progress');
const interviewRoutes = require('./routes/interview');
const personaRoutes = require('./routes/personas');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/resume', resumeRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/test', testRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/mentors', mentorsRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/personas', personaRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'DreamRole API is running', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message || 'Something went wrong'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 DreamRole Backend running on http://localhost:${PORT}`);
    console.log(`📋 API Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;

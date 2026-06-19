const mongoose = require('mongoose');

const EmotionSnapshotSchema = new mongoose.Schema({
    timestamp: { type: Number }, // ms from session start
    emotion: { type: String },   // happy, sad, neutral, angry, etc.
    confidence: { type: Number } // 0-1
}, { _id: false });

const QuestionSchema = new mongoose.Schema({
    question: String,
    category: String,
    hint: String
}, { _id: false });

const AnswerSchema = new mongoose.Schema({
    questionIndex: Number,
    text: String,
    transcript: String // from speech-to-text if used
}, { _id: false });

const EvaluationSchema = new mongoose.Schema({
    questionIndex: Number,
    stage: { type: String, enum: ['Excellent', 'Good', 'Developing', 'Needs Improvement'] },
    feedback: String,
    strengths: [String],
    improvements: [String]
}, { _id: false });

const VoiceMetricsSchema = new mongoose.Schema({
    avgConfidenceScore: { type: Number, default: 0 }, // 0-100
    avgPaceWPM: { type: Number, default: 0 },         // words per minute
    totalPauses: { type: Number, default: 0 },
    avgVolume: { type: Number, default: 0 }            // 0-1
}, { _id: false });

const InterviewSessionSchema = new mongoose.Schema({
    uid: { type: String, required: true, index: true },   // Firebase UID
    role: { type: String, required: true },
    mode: { type: String, enum: ['text', 'voice', 'video'], default: 'text' },
    questions: [QuestionSchema],
    answers: [AnswerSchema],
    evaluations: [EvaluationSchema],
    emotionTimeline: [EmotionSnapshotSchema],
    voiceMetrics: VoiceMetricsSchema,
    overallStage: {
        type: String,
        enum: ['Excellent', 'Good', 'Developing', 'Needs Improvement'],
        default: 'Developing'
    },
    dominantEmotions: [String],          // top 3 emotions during session
    answeredCount: { type: Number, default: 0 },
    mentorId: { type: String, default: null }, // Firebase UID of assigned mentor
    isSharedWithMentor: { type: Boolean, default: false },
    mentorNote: { type: String, default: '' }
}, { timestamps: true });

// Index for mentor queries
InterviewSessionSchema.index({ mentorId: 1, createdAt: -1 });
InterviewSessionSchema.index({ uid: 1, createdAt: -1 });

module.exports = mongoose.model('InterviewSession', InterviewSessionSchema);

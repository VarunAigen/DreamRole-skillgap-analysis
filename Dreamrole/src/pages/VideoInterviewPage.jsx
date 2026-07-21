import { useState, useEffect, useRef, useCallback } from 'react'
import { authFetch } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import {
    Video, Mic, MicOff, VideoOff, ChevronRight, ChevronLeft,
    Trophy, Loader, Loader2, AlertCircle, CheckCircle2, Brain,
    Volume2, Activity, Clock, BarChart3, Lightbulb, Star,
    ArrowRight, Play, Square, Camera, Download, FileText, Trash2, UploadCloud
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useEmotionDetection } from '../hooks/useEmotionDetection'
import { useVoiceMetrics } from '../hooks/useVoiceMetrics'
import UploadBox from '../components/UploadBox'

// ── Helpers ───────────────────────────────────────────────────────────────────
const stageConfig = {
    'Excellent': { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: '🌟', label: 'Excellent' },
    'Good':      { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: '👍', label: 'Good' },
    'Developing':{ color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '📈', label: 'Developing' },
    'Needs Improvement': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '💪', label: 'Needs Work' }
}

const categoryColors = {
    'Project Experience':  { bg: 'rgba(99,102,241,0.15)', text: '#818cf8' },
    'Technical Knowledge': { bg: 'rgba(168,85,247,0.15)', text: '#c084fc' },
    'Internship/Work':     { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' },
    'Problem Solving':     { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
    'Career Goals':        { bg: 'rgba(244,114,182,0.15)', text: '#f472b6' }
}

// ── Filler word removal + transcript cleanup ──────────────────────────────────
const FILLER_WORDS = /\b(um|uh|uhh|umm|erm|like|you know|i mean|sort of|kind of|basically|actually|literally|honestly|right|so yeah|yeah so)\b/gi
function cleanTranscript(raw) {
    if (!raw) return ''
    let text = raw.replace(FILLER_WORDS, '').replace(/\s{2,}/g, ' ').trim()
    // Add sentence boundaries — capitalize after periods
    text = text.replace(/(^|[.!?]\s+)(\w)/g, (_, sep, ch) => sep + ch.toUpperCase())
    // Capitalize first letter
    if (text.length > 0) text = text[0].toUpperCase() + text.slice(1)
    // Add period at end if missing
    if (text.length > 0 && !/[.!?]$/.test(text)) text += '.'
    return text
}

// ── Answer quality calculator ─────────────────────────────────────────────────
function getAnswerQuality(text) {
    const words = (text || '').trim().split(/\s+/).filter(Boolean).length
    if (words >= 80) return { level: 'Strong', color: '#22c55e', pct: 100 }
    if (words >= 50) return { level: 'Good', color: '#3b82f6', pct: 75 }
    if (words >= 25) return { level: 'Fair', color: '#f59e0b', pct: 50 }
    return { level: 'Too Short', color: '#ef4444', pct: Math.max(10, Math.round((words / 25) * 50)) }
}

// ── Rubric bar component for results ──────────────────────────────────────────
function RubricBar({ label, score, color }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', width: 110, textAlign: 'right', flexShrink: 0 }}>{label}</span>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color, width: 28, textAlign: 'right' }}>{score}</span>
        </div>
    )
}

function MetricBadge({ icon: Icon, label, value, color = '#6366f1' }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 8
        }}>
            <Icon size={15} style={{ color }} />
            <div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>{value}</p>
            </div>
        </div>
    )
}

function EmotionBadge({ emotion, confidence, EMOTION_EMOJI, EMOTION_COLOR }) {
    if (!emotion) return null
    return (
        <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${EMOTION_COLOR[emotion] || '#6366f1'}40`,
            borderRadius: 20, padding: '6px 12px',
            display: 'flex', alignItems: 'center', gap: 6,
            zIndex: 10
        }}>
            <span style={{ fontSize: 18 }}>{EMOTION_EMOJI[emotion] || '😐'}</span>
            <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: EMOTION_COLOR[emotion] || '#fff', margin: 0, textTransform: 'capitalize' }}>{emotion}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{confidence}%</p>
            </div>
        </div>
    )
}

// ── AI Interviewer Panel ───────────────────────────────────────────────────────
function AIInterviewerPanel({ question, isReading, onReadQuestion }) {
    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 100%)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16
        }}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 24px rgba(99,102,241,0.4)',
                    flexShrink: 0
                }}>
                    <Brain size={26} color="#fff" />
                </div>
                <div>
                    <p style={{ fontWeight: 700, color: '#fff', margin: 0, fontSize: 15 }}>Alex · AI Interviewer</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: isReading ? '#f59e0b' : '#22c55e',
                            display: 'inline-block',
                            animation: 'pulse 2s infinite'
                        }} />
                        {isReading ? 'Speaking...' : 'Listening'}
                    </p>
                </div>
                {question && (
                    <button
                        onClick={onReadQuestion}
                        title="Read question aloud"
                        style={{
                            marginLeft: 'auto', background: 'rgba(99,102,241,0.2)',
                            border: '1px solid rgba(99,102,241,0.3)',
                            borderRadius: 10, padding: '7px 12px',
                            color: '#818cf8', cursor: 'pointer', fontSize: 12,
                            display: 'flex', alignItems: 'center', gap: 5
                        }}
                    >
                        <Volume2 size={13} /> Replay
                    </button>
                )}
            </div>

            {/* Question display */}
            {question && (
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14, padding: 18
                }}>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {question.category}
                    </p>
                    <p style={{ fontSize: 16, color: '#f1f5f9', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
                        "{question.question}"
                    </p>
                </div>
            )}
        </div>
    )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function VideoInterviewPage() {
    const navigate = useNavigate()
    const { resumeText, resumePdfName, setResumeText, setResumePdfName, clearSession, selectedRole } = useApp()
    const { currentUser } = useAuth()

    const role = selectedRole || 'Software Engineer'
    const userName = currentUser?.displayName || 'Candidate'

    // ── State ─────────────────────────────────────────────────────────────────
    const [phase, setPhase] = useState('setup')   // setup → interview → results
    const [camEnabled, setCamEnabled] = useState(true)
    const [micEnabled, setMicEnabled] = useState(true)
    const [questions, setQuestions] = useState([])
    const [loadingQ, setLoadingQ] = useState(false)
    const [current, setCurrent] = useState(0)
    const [answers, setAnswers] = useState({})
    const [evaluations, setEvaluations] = useState([])
    const [evaluatingAll, setEvaluatingAll] = useState(false)
    const [showHint, setShowHint] = useState(false)
    const [isReading, setIsReading] = useState(false)
    const [sessionSaved, setSessionSaved] = useState(false)
    const [error, setError] = useState('')
    const [showEmptyWarning, setShowEmptyWarning] = useState(false)

    // Local resume states
    const [localResumeText, setLocalResumeText] = useState('')
    const [localResumePdfName, setLocalResumePdfName] = useState('')
    const [isSessionResume, setIsSessionResume] = useState(false)
    const [showUploadMode, setShowUploadMode] = useState(false)

    // File upload states for setup
    const [uploadFile, setUploadFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [saveToProfile, setSaveToProfile] = useState(true)

    // Initialize local states from AppContext once loaded
    useEffect(() => {
        if (resumeText && !localResumeText) {
            setLocalResumeText(resumeText)
        }
        if (resumePdfName && !localResumePdfName) {
            setLocalResumePdfName(resumePdfName)
        }
    }, [resumeText, resumePdfName])

    const handleUploadResume = async () => {
        if (!uploadFile) return
        setUploading(true)
        setError('')
        try {
            const formData = new FormData()
            formData.append('resume', uploadFile)
            const url = saveToProfile ? '/api/resume/upload' : '/api/resume/upload?sessionOnly=true'
            const res = await authFetch(url, { method: 'POST', body: formData })
            let data
            try {
                data = await res.json()
            } catch (jsonErr) {
                throw new Error(`Upload failed: Server returned status ${res.status}`)
            }
            if (!res.ok) throw new Error(data.error || 'Upload failed')

            setLocalResumeText(data.resume_text)
            setLocalResumePdfName(data.filename)
            setIsSessionResume(!saveToProfile)
            setUploadFile(null)
            setShowUploadMode(false)

            if (saveToProfile) {
                setResumeText(data.resume_text)
                setResumePdfName(data.filename)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setUploading(false)
        }
    }

    const handleRemoveResume = async () => {
        setLocalResumeText('')
        setLocalResumePdfName('')
        setIsSessionResume(false)
        setUploadFile(null)
        setShowUploadMode(false)
        // Also clear persistent profile session
        await clearSession()
    }

    // Track emotion per question for evaluation context
    const emotionPerQuestionRef = useRef({})

    // Video & stream
    const videoRef = useRef(null)
    const streamRef = useRef(null)

    // Hooks
    const emotion = useEmotionDetection(videoRef, phase === 'interview' && camEnabled)
    const voice = useVoiceMetrics(phase === 'interview' && micEnabled)

    // ── Camera Setup ──────────────────────────────────────────────────────────
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 },
                audio: false // audio handled by useVoiceMetrics separately
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.play()
            }
        } catch (err) {
            console.warn('[VideoInterview] Camera access denied:', err.message)
            setCamEnabled(false)
        }
    }, [])

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop())
    }, [])

    useEffect(() => {
        if ((phase === 'setup' || phase === 'interview') && camEnabled) startCamera()
        if (!camEnabled) stopCamera()
        return () => stopCamera()
    }, [phase, camEnabled])

    // ── Fetch Questions ───────────────────────────────────────────────────────
    const fetchQuestions = async () => {
        if (!localResumeText) { setError('Please upload your resume first.'); return }
        setLoadingQ(true)
        setError('')
        try {
            const res = await authFetch('/api/interview/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resume_text: localResumeText, role, count: 7, user_name: userName })
            })
            let data
            try {
                data = await res.json()
            } catch (jsonErr) {
                throw new Error(`Failed to generate questions: Server returned status ${res.status}`)
            }
            if (!res.ok) throw new Error(data.error || 'Failed to generate questions')
            if (data.questions?.length > 0) {
                setQuestions(data.questions)
                setPhase('interview')
                // AI reads first question aloud
                setTimeout(() => readAloud(data.questions[0].question), 800)
            } else throw new Error('No questions generated')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoadingQ(false)
        }
    }

    // ── TTS — Read Question Aloud via OpenAI Speech API ───────────────────────
    const audioPlayerRef = useRef(null)

    const readAloud = async (text) => {
        if (!text) return
        if (window.speechSynthesis) window.speechSynthesis.cancel()
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause()
            audioPlayerRef.current = null
        }
        setIsReading(true)

        try {
            const res = await authFetch('/api/interview/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice: 'nova' })
            })
            if (res.ok) {
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const audio = new Audio(url)
                audioPlayerRef.current = audio
                audio.onended = () => setIsReading(false)
                audio.onerror = () => fallbackSpeechSynthesis(text)
                await audio.play()
                return
            }
        } catch (e) {
            console.warn('[TTS] Server TTS fallback:', e.message)
        }
        fallbackSpeechSynthesis(text)
    }

    const fallbackSpeechSynthesis = (text) => {
        if (!window.speechSynthesis) { setIsReading(false); return }
        const utter = new SpeechSynthesisUtterance(text)
        utter.rate = 0.92
        utter.pitch = 1.05
        utter.volume = 1
        utter.onstart = () => setIsReading(true)
        utter.onend   = () => setIsReading(false)
        utter.onerror = () => setIsReading(false)
        window.speechSynthesis.speak(utter)
    }

    // ── Whisper Audio Transcription ───────────────────────────────────────────
    const transcribeCurrentAudio = async (idx) => {
        try {
            const blob = voice.getAudioBlob?.()
            if (!blob || blob.size < 3000) return
            const formData = new FormData()
            formData.append('audio', blob, `q${idx}_speech.webm`)
            const res = await authFetch('/api/interview/transcribe', {
                method: 'POST',
                body: formData
            })
            if (res.ok) {
                const data = await res.json()
                if (data.text && data.text.length > 5) {
                    setAnswers(prev => ({ ...prev, [idx]: data.text }))
                    return data.text
                }
            }
        } catch (e) {
            console.warn('[Whisper] Audio transcription notice:', e.message)
        }
        return answers[idx] || ''
    }

    // ── Navigation ─────────────────────────────────────────────────────────────
    const handleNext = async () => {
        const currentAnswer = answers[current] || ''
        const wordCount = currentAnswer.trim().split(/\s+/).filter(Boolean).length

        // Soft-block: warn if answer is empty/too short
        if (wordCount < 5 && current < questions.length - 1) {
            setShowEmptyWarning(true)
            setTimeout(() => setShowEmptyWarning(false), 4000)
            if (!showEmptyWarning) return
        }
        setShowEmptyWarning(false)

        // Attempt Whisper transcription in background for current answer
        transcribeCurrentAudio(current)

        if (current < questions.length - 1) {
            const nextIdx = current + 1
            setCurrent(nextIdx)
            setShowHint(false)
            voice.resetTranscript()
            setTimeout(() => readAloud(questions[nextIdx].question), 400)
        } else {
            finishInterview()
        }
    }

    const handlePrev = () => {
        if (current > 0) {
            setCurrent(c => c - 1)
            setShowHint(false)
            setShowEmptyWarning(false)
        }
    }

    // ── Accept voice transcript as answer (cleaned) ───────────────────────────
    useEffect(() => {
        if (voice.transcript) {
            const cleaned = cleanTranscript(voice.transcript)
            setAnswers(prev => ({ ...prev, [current]: cleaned }))
        }
    }, [voice.transcript, current])

    // ── Track dominant emotion per question ───────────────────────────────────
    useEffect(() => {
        if (phase === 'interview' && emotion.dominantEmotion) {
            emotionPerQuestionRef.current[current] = {
                emotion: emotion.dominantEmotion,
                confidence: emotion.confidence
            }
        }
    }, [emotion.dominantEmotion, emotion.confidence, current, phase])

    // ── Finish: Batch Evaluate ────────────────────────────────────────────────
    const finishInterview = async () => {
        window.speechSynthesis.cancel()
        stopCamera()
        setEvaluatingAll(true)
        setPhase('evaluating')

        try {
            const answersArr = questions.map((_, i) => ({ text: answers[i] || '' }))

            // Build emotion_per_question from tracked data
            const emotionArr = questions.map((_, i) => emotionPerQuestionRef.current[i] || null)

            const res = await authFetch('/api/interview/evaluate-all', {
                method: 'POST',
                body: JSON.stringify({
                    questions, answers: answersArr.map(a => a.text),
                    role, user_name: userName,
                    emotion_per_question: emotionArr
                })
            })
            const data = await res.json()
            setEvaluations(data.evaluations || [])

            // Save session to MongoDB
            const dominantEmotions = emotion.getDominantEmotionsSummary()
            const stageOrder = { 'Excellent': 4, 'Good': 3, 'Developing': 2, 'Needs Improvement': 1 }
            const evals = data.evaluations || []
            const avgScore = evals.length
                ? Math.round(evals.reduce((s, e) => s + (stageOrder[e?.stage] || 2), 0) / evals.length)
                : 2
            const overallStage = Object.keys(stageOrder).find(k => stageOrder[k] === avgScore) || 'Developing'

            await authFetch('/api/interview/save-session', {
                method: 'POST',
                body: JSON.stringify({
                    role, mode: 'video',
                    questions, answers: answersArr, evaluations: data.evaluations,
                    emotionTimeline: emotion.emotionTimeline,
                    voiceMetrics: {
                        avgConfidenceScore: voice.confidenceScore,
                        avgPaceWPM: voice.paceWPM,
                        totalPauses: voice.pauseCount,
                        avgVolume: voice.avgVolume
                    },
                    overallStage, dominantEmotions
                })
            })
            setSessionSaved(true)
        } catch (err) {
            console.error('Evaluation error:', err.message)
            setEvaluations(questions.map(() => ({
                stage: 'Developing', feedback: 'Evaluation temporarily unavailable.', strengths: [], improvements: []
            })))
        } finally {
            setEvaluatingAll(false)
            setPhase('results')
        }
    }

    // ── Camera Toggle ─────────────────────────────────────────────────────────
    const toggleCamera = () => {
        if (camEnabled) {
            stopCamera()
            setCamEnabled(false)
        } else {
            setCamEnabled(true)
            startCamera()
        }
    }

    const handleDownloadResume = async () => {
        try {
            const res = await authFetch('/api/profile/resume/download')
            if (!res.ok) throw new Error('No resume PDF available for download.')
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'resume.pdf'
            document.body.appendChild(a)
            a.click()
            a.remove()
        } catch (error) {
            alert(error.message)
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER: Setup Phase
    // ─────────────────────────────────────────────────────────────────────────
    if (phase === 'setup') {
        const hasResume = !!localResumeText
        return (
            <div style={{ maxWidth: 680, margin: '0 auto', fontFamily: 'inherit' }}>
                <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', margin: '0 0 6px' }}>
                            🎥 Video Interview Simulator
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: 0 }}>
                            AI-powered live interview · Emotion Detection · Voice Confidence Analysis
                        </p>
                    </div>
                    {localResumeText && (
                        <button
                            onClick={handleDownloadResume}
                            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                            style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}
                        >
                            <Download size={13} /> My Resume
                        </button>
                    )}
                </div>

                {/* Info cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
                    {[
                        { icon: Camera, label: 'Emotion AI', desc: 'Real-time facial analysis' },
                        { icon: Mic, label: 'Voice Metrics', desc: 'Pace, clarity & confidence' },
                        { icon: Brain, label: 'AI Feedback', desc: 'Instant batch evaluation' }
                    ].map(({ icon: Icon, label, desc }) => (
                        <div key={label} style={{
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 16, padding: '18px 16px', textAlign: 'center'
                        }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 12,
                                background: 'rgba(99,102,241,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px'
                            }}>
                                <Icon size={18} color="#818cf8" />
                            </div>
                            <p style={{ fontWeight: 700, color: '#e2e8f0', margin: '0 0 3px', fontSize: 13 }}>{label}</p>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{desc}</p>
                        </div>
                    ))}
                </div>

                {/* Camera preview */}
                <div style={{
                    background: 'rgba(15,15,30,0.8)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 20, overflow: 'hidden', marginBottom: 24, position: 'relative',
                    aspectRatio: '16/7'
                }}>
                    <video
                        ref={videoRef} autoPlay muted playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: camEnabled ? 'block' : 'none' }}
                    />
                    {!camEnabled && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 10 }}>
                            <VideoOff size={36} color="rgba(255,255,255,0.2)" />
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Camera disabled</p>
                        </div>
                    )}
                    {/* Controls overlay */}
                    <div style={{
                        position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
                        display: 'flex', gap: 10
                    }}>
                        {[
                            { icon: camEnabled ? Video : VideoOff, label: camEnabled ? 'Cam On' : 'Cam Off', action: toggleCamera, active: camEnabled },
                            { icon: micEnabled ? Mic : MicOff, label: micEnabled ? 'Mic On' : 'Mic Off', action: () => setMicEnabled(m => !m), active: micEnabled }
                        ].map(({ icon: Icon, label, action, active }) => (
                            <button key={label} onClick={action} style={{
                                background: active ? 'rgba(99,102,241,0.8)' : 'rgba(239,68,68,0.7)',
                                border: 'none', borderRadius: 10, padding: '8px 16px',
                                color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: 6
                            }}>
                                <Icon size={14} /> {label}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                        <p style={{ color: '#fca5a5', margin: 0, fontSize: 13 }}>{error}</p>
                    </div>
                )}

                {hasResume && !showUploadMode ? (
                    <div className="card space-y-5 animate-fade-in" style={{ padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                                <FileText size={22} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', margin: 0 }}>Selected Resume</p>
                                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {localResumePdfName || 'Loaded Resume'}
                                    {isSessionResume && (
                                        <span style={{ fontSize: 9, background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)', padding: '2px 6px', borderRadius: 4, fontWeight: 400 }}>
                                            Session Only
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <button onClick={fetchQuestions} disabled={loadingQ} style={{
                                width: '100%', padding: '16px 24px', borderRadius: 14,
                                background: loadingQ ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
                                cursor: loadingQ ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: loadingQ ? 'none' : '0 8px 24px rgba(99,102,241,0.35)'
                            }}>
                                {loadingQ ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Preparing Interview...</>
                                    : <><Play size={16} /> Start Video Interview · {role}</>}
                            </button>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => setShowUploadMode(true)} className="btn-secondary" style={{ flex: 1, padding: '10px 16px', borderRadius: 12, justifyContent: 'center', fontSize: 13 }}>
                                    Upload New Resume
                                </button>
                                <button onClick={handleRemoveResume} className="btn-ghost" style={{ flex: 1, padding: '10px 16px', borderRadius: 12, justifyContent: 'center', color: '#f87171', fontSize: 13 }}>
                                    <Trash2 size={14} style={{ marginRight: 6 }} /> Remove Resume
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card space-y-5 animate-fade-in" style={{ padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
                        <div style={{ textAlign: 'center', marginBottom: 12 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                                {hasResume ? 'Upload Replacement Resume' : 'Upload Your Resume'}
                            </h2>
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
                                A PDF resume is required to generate custom mock interview questions.
                            </p>
                        </div>

                        <UploadBox
                            file={uploadFile}
                            onFileAccepted={setUploadFile}
                            onClear={() => setUploadFile(null)}
                        />

                        {uploadFile && (
                            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.7)', userSelect: 'none' }}>
                                    <input
                                        type="checkbox"
                                        checked={saveToProfile}
                                        onChange={(e) => setSaveToProfile(e.target.checked)}
                                        style={{ accentColor: '#6366f1' }}
                                    />
                                    Save to profile for future sessions
                                </label>

                                <button
                                    onClick={handleUploadResume}
                                    disabled={uploading}
                                    style={{
                                        width: '100%', padding: '12px 20px', borderRadius: 12,
                                        background: '#6366f1', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600,
                                        cursor: uploading ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                    }}
                                >
                                    {uploading ? (
                                        <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Parsing PDF...</>
                                    ) : (
                                        <><UploadCloud size={15} /> Parse & Use Resume</>
                                    )}
                                </button>
                            </div>
                        )}

                        {hasResume && (
                            <button
                                onClick={() => { setShowUploadMode(false); setUploadFile(null); }}
                                className="btn-ghost"
                                style={{ width: '100%', padding: '10px 16px', borderRadius: 12, justifyContent: 'center', fontSize: 13, marginTop: 8 }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                )}

                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 12 }}>
                    Camera and microphone permissions required · Works best in Chrome
                </p>
            </div>
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER: Evaluating Phase
    // ─────────────────────────────────────────────────────────────────────────
    if (phase === 'evaluating') {
        return (
            <div style={{ maxWidth: 560, margin: '80px auto', textAlign: 'center' }}>
                <div style={{
                    width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(168,85,247,0.3) 100%)',
                    border: '2px solid rgba(99,102,241,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Loader2 size={36} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>Analyzing Your Interview</h2>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
                    AI is evaluating all {questions.length} answers in one pass · Generating comprehensive feedback...
                </p>
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: 20, marginTop: 28,
                    color: 'rgba(255,255,255,0.3)', fontSize: 12
                }}>
                    <span>🧠 Reviewing answers</span>
                    <span>📊 Computing metrics</span>
                    <span>✍️ Writing feedback</span>
                </div>
            </div>
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER: Results Phase
    // ─────────────────────────────────────────────────────────────────────────
    if (phase === 'results') {
        const stageOrder = { 'Excellent': 4, 'Good': 3, 'Developing': 2, 'Needs Improvement': 1 }
        const avgNum = evaluations.length
            ? Math.round(evaluations.reduce((s, e) => s + (stageOrder[e?.stage] || 2), 0) / evaluations.length)
            : 2
        const overallStage = Object.keys(stageOrder).find(k => stageOrder[k] === avgNum) || 'Developing'
        const cfg = stageConfig[overallStage]
        const dominantEmotions = emotion.getDominantEmotionsSummary()
        const avgScore = evaluations.length
            ? Math.round(evaluations.reduce((s, e) => s + (e?.score || 0), 0) / evaluations.length)
            : 0

        return (
            <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: 'inherit' }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 100%)',
                    border: '1px solid rgba(99,102,241,0.25)', borderRadius: 24,
                    padding: '28px 32px', marginBottom: 24, textAlign: 'center'
                }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 32px rgba(99,102,241,0.5)'
                    }}>
                        <Trophy size={32} color="#fbbf24" />
                    </div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', margin: '0 0 8px' }}>
                        Interview Complete!
                    </h1>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: cfg.bg, border: `1px solid ${cfg.color}40`,
                        borderRadius: 30, padding: '8px 20px', marginBottom: 8
                    }}>
                        <span style={{ fontSize: 20 }}>{cfg.icon}</span>
                        <span style={{ fontWeight: 700, color: cfg.color, fontSize: 15 }}>Overall: {cfg.label}</span>
                    </div>
                    {/* Overall numeric score */}
                    <p style={{ fontSize: 36, fontWeight: 800, color: cfg.color, margin: '8px 0 4px' }}>{avgScore}<span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>/100</span></p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 16px' }}>Weighted average across all questions</p>

                    {/* Session metrics row */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>{voice.confidenceScore}%</p>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Voice Confidence</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>{voice.paceWPM} WPM</p>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Speaking Pace</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>{voice.pauseCount}</p>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Pauses taken</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
                                {dominantEmotions.map(e => emotion.EMOTION_EMOJI[e]).join(' ')}
                            </p>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Dominant mood</p>
                        </div>
                    </div>
                </div>

                {/* Per-question breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                    {questions.map((q, i) => {
                        const ev = evaluations[i]
                        const qCfg = ev ? stageConfig[ev.stage] || stageConfig['Good'] : null
                        const rubric = ev?.rubric || {}
                        const modelPts = ev?.model_answer_points || []
                        const emotionNote = ev?.emotion_note || null
                        return (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: `1px solid ${qCfg ? qCfg.color + '25' : 'rgba(255,255,255,0.06)'}`,
                                borderRadius: 18, padding: '20px 24px', transition: 'all 0.3s'
                            }}>
                                {/* Question header + score badge */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                                    <p style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 13, margin: 0, lineHeight: 1.5, flex: 1 }}>
                                        <span style={{ color: 'rgba(255,255,255,0.3)', marginRight: 6 }}>Q{i + 1}</span>
                                        {q.question}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                        {ev?.score !== undefined && (
                                            <span style={{
                                                fontSize: 16, fontWeight: 800, color: qCfg?.color || '#fff'
                                            }}>{ev.score}</span>
                                        )}
                                        {qCfg && (
                                            <span style={{
                                                background: qCfg.bg, border: `1px solid ${qCfg.color}40`,
                                                color: qCfg.color, fontSize: 10, fontWeight: 700,
                                                padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap'
                                            }}>
                                                {qCfg.icon} {qCfg.label}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Feedback */}
                                {ev && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '0 0 14px', lineHeight: 1.6 }}>{ev.feedback}</p>}
                                {!ev && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>Not answered</p>}

                                {/* Rubric breakdown bars */}
                                {ev && rubric.technical_accuracy !== undefined && (
                                    <div style={{ marginBottom: 14 }}>
                                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px', fontWeight: 600 }}>Rubric Breakdown</p>
                                        <RubricBar label="Technical Accuracy" score={rubric.technical_accuracy} color="#818cf8" />
                                        <RubricBar label="Specificity" score={rubric.specificity} color="#c084fc" />
                                        <RubricBar label="Clarity" score={rubric.clarity} color="#4ade80" />
                                        <RubricBar label="Role Relevance" score={rubric.role_relevance} color="#fbbf24" />
                                    </div>
                                )}

                                {/* Strengths + Improvements */}
                                {ev && (ev.strengths?.length > 0 || ev.improvements?.length > 0) && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                                        {ev.strengths?.length > 0 && (
                                            <div>
                                                <p style={{ fontSize: 10, color: '#4ade80', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 4px' }}>✓ Strengths</p>
                                                {ev.strengths.map((s, j) => (
                                                    <p key={j} style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 2px', paddingLeft: 8 }}>• {s}</p>
                                                ))}
                                            </div>
                                        )}
                                        {ev.improvements?.length > 0 && (
                                            <div>
                                                <p style={{ fontSize: 10, color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 4px' }}>↑ Improve</p>
                                                {ev.improvements.map((s, j) => (
                                                    <p key={j} style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 2px', paddingLeft: 8 }}>• {s}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                 {/* Model answer points (revealed after evaluation) */}
                                {modelPts.length > 0 && (
                                    <div style={{
                                        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                                        borderRadius: 12, padding: '12px 14px', marginBottom: (emotionNote || ev?.hr_reframed_answer) ? 10 : 0
                                    }}>
                                        <p style={{ fontSize: 10, color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>
                                            💡 What the ideal answer should cover:
                                        </p>
                                        {modelPts.map((pt, j) => (
                                            <p key={j} style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 3px', paddingLeft: 8 }}>
                                                {j + 1}. {pt}
                                            </p>
                                        ))}
                                    </div>
                                )}

                                {/* HR & Mentor Re-framed Answer */}
                                {ev?.hr_reframed_answer && (
                                    <div style={{
                                        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
                                        borderRadius: 12, padding: '12px 14px', marginBottom: emotionNote ? 10 : 0
                                    }}>
                                        <p style={{ fontSize: 10, color: '#4ade80', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>
                                            ✨ HR & Mentor Re-framed Answer (How to phrase this for maximum impact):
                                        </p>
                                        <p style={{ fontSize: 12, color: '#d1fae5', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                                            "{ev.hr_reframed_answer}"
                                        </p>
                                    </div>
                                )}

                                {/* Emotion note */}
                                {emotionNote && (
                                    <p style={{ fontSize: 11, color: 'rgba(168,85,247,0.7)', margin: '8px 0 0', fontStyle: 'italic' }}>
                                        🎭 {emotionNote}
                                    </p>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => { setPhase('setup'); setCurrent(0); setAnswers({}); setEvaluations([]); emotionPerQuestionRef.current = {} }} style={{
                        flex: 1, padding: '14px 20px', borderRadius: 14,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#e2e8f0', cursor: 'pointer', fontSize: 14, fontWeight: 600
                    }}>
                        Retry Interview
                    </button>
                    <button onClick={() => navigate('/dashboard/roadmap')} style={{
                        flex: 1, padding: '14px 20px', borderRadius: 14,
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}>
                        View Roadmap <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER: Main Interview Phase
    // ─────────────────────────────────────────────────────────────────────────
    const q = questions[current]
    const catStyle = categoryColors[q?.category] || { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.5)' }
    const currentAnswer = answers[current] || ''
    const hasAnswer = currentAnswer.trim().length > 20

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: 'inherit' }}>
            {/* Header bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Video size={18} color="#818cf8" /> Video Interview
                    </h1>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                        Question {current + 1} of {questions.length} · {role}
                    </p>
                </div>
                {/* Progress dots & Resume */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {resumeText && (
                        <button
                            onClick={handleDownloadResume}
                            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                            style={{ display: 'flex', alignItems: 'center' }}
                        >
                            <Download size={13} /> My Resume
                        </button>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                        {questions.map((_, i) => (
                            <div key={i} style={{
                                width: i === current ? 24 : 8, height: 8, borderRadius: 4,
                                background: i < current ? '#22c55e' : i === current ? '#818cf8' : 'rgba(255,255,255,0.1)',
                                transition: 'all 0.3s'
                            }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main 2-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
                {/* LEFT: Camera + Metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Camera */}
                    <div style={{
                        background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3', position: 'relative'
                    }}>
                        <video ref={videoRef} autoPlay muted playsInline style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            display: camEnabled ? 'block' : 'none'
                        }} />
                        {!camEnabled && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <VideoOff size={32} color="rgba(255,255,255,0.15)" />
                            </div>
                        )}
                        {/* Emotion overlay */}
                        <EmotionBadge
                            emotion={emotion.dominantEmotion}
                            confidence={emotion.confidence}
                            EMOTION_EMOJI={emotion.EMOTION_EMOJI}
                            EMOTION_COLOR={emotion.EMOTION_COLOR}
                        />
                        {/* Recording indicator */}
                        <div style={{
                            position: 'absolute', top: 12, right: 12,
                            background: 'rgba(239,68,68,0.8)', borderRadius: 20,
                            padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5
                        }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />
                            <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>LIVE</span>
                        </div>
                    </div>

                    {/* Real-time metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <MetricBadge icon={Activity} label="Confidence" value={`${voice.confidenceScore}%`} color="#22c55e" />
                        <MetricBadge icon={Clock} label="Pace" value={`${voice.paceWPM} WPM`} color="#f59e0b" />
                        <MetricBadge icon={Volume2} label="Volume" value={`${voice.avgVolume}%`} color="#3b82f6" />
                        <MetricBadge icon={BarChart3} label="Pauses" value={voice.pauseCount} color="#a855f7" />
                    </div>

                    {/* Camera/Mic controls */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={toggleCamera} style={{
                            flex: 1, padding: '10px 14px', borderRadius: 12,
                            background: camEnabled ? 'rgba(99,102,241,0.15)' : 'rgba(239,68,68,0.15)',
                            border: `1px solid ${camEnabled ? 'rgba(99,102,241,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            color: camEnabled ? '#818cf8' : '#f87171', cursor: 'pointer', fontSize: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
                        }}>
                            {camEnabled ? <Video size={13} /> : <VideoOff size={13} />}
                            {camEnabled ? 'Cam On' : 'Cam Off'}
                        </button>
                        <button onClick={() => setMicEnabled(m => !m)} style={{
                            flex: 1, padding: '10px 14px', borderRadius: 12,
                            background: micEnabled ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                            border: `1px solid ${micEnabled ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            color: micEnabled ? '#4ade80' : '#f87171', cursor: 'pointer', fontSize: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
                        }}>
                            {micEnabled ? <Mic size={13} /> : <MicOff size={13} />}
                            {micEnabled ? 'Mic On' : 'Mic Off'}
                        </button>
                    </div>
                </div>

                {/* RIGHT: Interview Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* AI Interviewer */}
                    <AIInterviewerPanel
                        question={q}
                        isReading={isReading}
                        onReadQuestion={() => q && readAloud(q.question)}
                    />

                    {/* Answer input */}
                    <div style={{
                        background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 20, padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 12
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                                Your Answer {voice.isListening && <span style={{ color: '#22c55e', animation: 'pulse 1.5s infinite' }}>● Live</span>}
                            </label>
                            {micEnabled && (
                                <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>
                                    🎙️ Mic active — speak now
                                </span>
                            )}
                        </div>

                        {/* Live Transcript Box — shows exactly what was spoken */}
                        {voice.transcript && (
                            <div style={{
                                background: 'rgba(34,197,94,0.08)',
                                border: '1px solid rgba(34,197,94,0.3)',
                                borderRadius: 12, padding: '12px 14px'
                            }}>
                                <p style={{ fontSize: 10, color: '#4ade80', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                                    🎙️ Captured Speech — Cross-check what you said:
                                </p>
                                <p style={{ fontSize: 13, color: '#d1fae5', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {voice.transcript}
                                </p>
                            </div>
                        )}

                        {/* Interim — words being spoken right now */}
                        {voice.interimTranscript && (
                            <p style={{ fontSize: 12, color: '#86efac', fontStyle: 'italic', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 1s infinite', flexShrink: 0 }} />
                                Hearing: &ldquo;{voice.interimTranscript}&rdquo;
                            </p>
                        )}

                        <textarea
                            value={currentAnswer}
                            onChange={e => setAnswers(prev => ({ ...prev, [current]: e.target.value }))}
                            placeholder="Speak your answer or type here...&#10;Be specific — mention real projects, technologies, and outcomes."
                            style={{
                                flex: 1, minHeight: 130, padding: '14px 16px',
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: 14, color: '#f1f5f9', fontSize: 14,
                                lineHeight: 1.7, resize: 'vertical', outline: 'none',
                                fontFamily: 'inherit'
                            }}
                        />

                        {/* Answer quality indicator */}
                        {(() => {
                            const quality = getAnswerQuality(currentAnswer)
                            const wordCount = currentAnswer.trim().split(/\s+/).filter(Boolean).length
                            return (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                                            {wordCount} words · Aim for 80+ for a strong answer
                                        </span>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: quality.color }}>{quality.level}</span>
                                    </div>
                                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${quality.pct}%`, height: '100%',
                                            background: quality.color, borderRadius: 2,
                                            transition: 'width 0.4s ease, background 0.4s ease'
                                        }} />
                                    </div>
                                </div>
                            )
                        })()}

                        {/* Empty answer warning */}
                        {showEmptyWarning && (
                            <div style={{
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: 10, padding: '10px 14px',
                                display: 'flex', alignItems: 'center', gap: 8
                            }}>
                                <AlertCircle size={14} color="#f87171" />
                                <p style={{ fontSize: 12, color: '#fca5a5', margin: 0 }}>
                                    Your answer is very short. Click again to skip anyway, or add more detail for a better score.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={handlePrev} disabled={current === 0} style={{
                            padding: '12px 18px', borderRadius: 12,
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                            color: current === 0 ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                            cursor: current === 0 ? 'not-allowed' : 'pointer', fontSize: 13,
                            display: 'flex', alignItems: 'center', gap: 5
                        }}>
                            <ChevronLeft size={15} /> Prev
                        </button>

                        <button onClick={handleNext} style={{
                            flex: 1, padding: '12px 20px', borderRadius: 12,
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            opacity: !hasAnswer && current === questions.length - 1 ? 0.6 : 1
                        }}>
                            {current < questions.length - 1
                                ? <> Next Question <ChevronRight size={16} /></>
                                : <> <Trophy size={16} /> Finish & Get Report</>
                            }
                        </button>
                    </div>
                </div>
            </div>

            {/* Global CSS for animations */}
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
            `}</style>
        </div>
    )
}

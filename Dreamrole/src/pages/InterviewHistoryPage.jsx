import { useState, useEffect } from 'react'
import { authFetch } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    Clock, Video, MessageSquare, ChevronRight, ChevronLeft, Loader,
    Trophy, Star, AlertCircle, CheckCircle2, Brain, Activity,
    Mic, BarChart3, Lightbulb, GraduationCap
} from 'lucide-react'

const stageConfig = {
    'Excellent': { color: '#4ade80', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', gradient: 'from-emerald-500 to-emerald-700', icon: '🌟' },
    'Good': { color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', gradient: 'from-blue-500 to-blue-700', icon: '👍' },
    'Developing': { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', gradient: 'from-amber-500 to-amber-700', icon: '📈' },
    'Needs Improvement': { color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', gradient: 'from-red-500 to-red-700', icon: '💪' },
}

const modeIcons = { text: MessageSquare, voice: Mic, video: Video }

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function SessionsList({ sessions, onSelect }) {
    if (sessions.length === 0) {
        return (
            <div className="glass-card text-center space-y-4 py-12">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <Brain size={28} style={{ color: '#818cf8' }} />
                </div>
                <h3 className="text-lg font-bold text-white">No Interview Sessions Yet</h3>
                <p className="text-sm max-w-sm mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Complete your first mock interview and your session history will appear here.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {sessions.map((s) => {
                const cfg = stageConfig[s.overallStage] || stageConfig['Developing']
                const ModeIcon = modeIcons[s.mode] || MessageSquare
                return (
                    <button key={s._id} onClick={() => onSelect(s._id)}
                        className="w-full glass-card card-hover text-left group">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-white text-xl flex-shrink-0 shadow-glow`}>
                                {cfg.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-white text-sm truncate">{s.role}</h3>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                                        {s.overallStage}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                    <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(s.createdAt)}</span>
                                    <span className="flex items-center gap-1"><ModeIcon size={11} /> {s.mode}</span>
                                    <span className="flex items-center gap-1"><Activity size={11} /> {s.answeredCount} answered</span>
                                </div>
                            </div>
                            {s.dominantEmotions?.length > 0 && (
                                <div className="hidden sm:flex gap-1">
                                    {s.dominantEmotions.slice(0, 2).map(e => (
                                        <span key={e} className="text-xs px-2 py-0.5 rounded-full capitalize"
                                            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>{e}</span>
                                    ))}
                                </div>
                            )}
                            <ChevronRight size={16} className="flex-shrink-0 transition-colors" style={{ color: 'rgba(255,255,255,0.2)' }} />
                        </div>
                    </button>
                )
            })}
        </div>
    )
}

function SessionDetail({ sessionId, onBack }) {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        authFetch(`/api/interview/session/${sessionId}`)
            .then(r => r.json())
            .then(data => { if (data.session) setSession(data.session) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [sessionId])

    if (loading) return (
        <div className="glass-card flex items-center gap-3" style={{ color: '#818cf8' }}>
            <Loader size={18} className="animate-spin" />
            <span className="text-sm">Loading session details...</span>
        </div>
    )

    if (!session) return (
        <div className="glass-card text-center space-y-3">
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>Session not found.</p>
            <button onClick={onBack} className="btn-primary mx-auto">Back to History</button>
        </div>
    )

    const cfg = stageConfig[session.overallStage] || stageConfig['Developing']
    const ModeIcon = modeIcons[session.mode] || MessageSquare

    return (
        <div className="space-y-5 animate-fade-in-up">
            <button onClick={onBack} className="btn-ghost text-sm"><ChevronLeft size={15} /> Back to History</button>

            {/* Header */}
            <div className="glass-card" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)' }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-white">{session.role}</h2>
                        <div className="flex items-center gap-3 text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(session.createdAt)} at {formatTime(session.createdAt)}</span>
                            <span className="flex items-center gap-1"><ModeIcon size={12} /> {session.mode} mode</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        <span className="text-lg">{cfg.icon}</span> {session.overallStage}
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    {[
                        { val: session.answeredCount || 0, label: 'Answered', color: '#818cf8' },
                        { val: session.questions?.length || 0, label: 'Questions', color: 'rgba(255,255,255,0.7)' },
                        ...(session.voiceMetrics?.avgPaceWPM > 0 ? [{ val: Math.round(session.voiceMetrics.avgPaceWPM), label: 'WPM', color: '#a78bfa' }] : []),
                        ...(session.voiceMetrics?.avgConfidenceScore > 0 ? [{ val: `${Math.round(session.voiceMetrics.avgConfidenceScore)}%`, label: 'Confidence', color: '#4ade80' }] : []),
                    ].map(s => (
                        <div key={s.label} className="stat-pill">
                            <p className="text-xl font-bold" style={{ color: s.color }}>{s.val}</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mentor Note */}
            {session.mentorNote && (
                <div className="glass-card space-y-2" style={{ borderLeft: '3px solid #a855f7', background: 'rgba(168,85,247,0.05)' }}>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(168,85,247,0.15)' }}>
                            <GraduationCap size={16} style={{ color: '#c084fc' }} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm" style={{ color: '#c084fc' }}>Mentor Feedback</h3>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Your mentor reviewed this session</p>
                        </div>
                    </div>
                    <p className="text-sm leading-relaxed pl-10" style={{ color: 'rgba(255,255,255,0.7)' }}>{session.mentorNote}</p>
                </div>
            )}

            {/* Emotions */}
            {session.dominantEmotions?.length > 0 && (
                <div className="glass-card">
                    <h3 className="text-sm font-bold text-white/80 flex items-center gap-2 mb-3">
                        <Brain size={15} style={{ color: '#818cf8' }} /> Emotional Analysis
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {session.dominantEmotions.map(e => (
                            <span key={e} className="badge-brand capitalize">{e}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Q&A */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-white/80 flex items-center gap-2">
                    <BarChart3 size={15} style={{ color: '#818cf8' }} /> Question-by-Question Review
                </h3>
                {session.questions?.map((q, i) => {
                    const ev = session.evaluations?.[i]
                    const answer = session.answers?.[i]
                    const evCfg = ev ? stageConfig[ev.stage] || stageConfig['Developing'] : null

                    return (
                        <div key={i} className="glass-card space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                    {i + 1}
                                </div>
                                <div className="flex-1">
                                    {q.category && <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#818cf8' }}>{q.category}</span>}
                                    <p className="text-sm font-semibold text-white mt-0.5">{q.question}</p>
                                </div>
                            </div>
                            <div className="ml-10">
                                {answer?.text ? (
                                    <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Your Answer</p>
                                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{answer.text}</p>
                                    </div>
                                ) : <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.25)' }}>Not answered</p>}
                            </div>
                            {ev && evCfg && (
                                <div className="ml-10 p-3 rounded-xl space-y-2" style={{ background: evCfg.bg, border: `1px solid ${evCfg.border}` }}>
                                    <div className="flex items-center gap-2 font-bold text-sm" style={{ color: evCfg.color }}>
                                        <span>{evCfg.icon}</span> {ev.stage}
                                    </div>
                                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{ev.feedback}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {ev.strengths?.length > 0 && (
                                            <div>
                                                <p className="text-xs font-bold flex items-center gap-1 mb-1" style={{ color: '#4ade80' }}>
                                                    <CheckCircle2 size={11} /> Strengths
                                                </p>
                                                <ul className="space-y-0.5">
                                                    {ev.strengths.map((s, j) => (
                                                        <li key={j} className="text-xs flex items-start gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                                            <span style={{ color: '#4ade80' }}>✓</span> {s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {ev.improvements?.length > 0 && (
                                            <div>
                                                <p className="text-xs font-bold flex items-center gap-1 mb-1" style={{ color: '#fbbf24' }}>
                                                    <Lightbulb size={11} /> To Improve
                                                </p>
                                                <ul className="space-y-0.5">
                                                    {ev.improvements.map((imp, j) => (
                                                        <li key={j} className="text-xs flex items-start gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                                            <span style={{ color: '#fbbf24' }}>→</span> {imp}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default function InterviewHistoryPage() {
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState(null)
    const { currentUser } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!currentUser) return
        authFetch('/api/interview/my-sessions')
            .then(r => r.json())
            .then(data => { if (data.sessions) setSessions(data.sessions) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [currentUser])

    if (loading) return (
        <div className="max-w-3xl mx-auto glass-card flex items-center gap-3" style={{ color: '#818cf8' }}>
            <Loader size={18} className="animate-spin" />
            <span className="text-sm font-medium">Loading your interview history...</span>
        </div>
    )

    if (selectedId) {
        return (
            <div className="max-w-3xl mx-auto">
                <SessionDetail sessionId={selectedId} onBack={() => setSelectedId(null)} />
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-5 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="section-heading flex items-center gap-2">
                        <Trophy size={20} style={{ color: '#818cf8' }} /> Interview History
                    </h1>
                    <p className="section-sub">{sessions.length} session{sessions.length !== 1 ? 's' : ''} completed</p>
                </div>
                <button onClick={() => navigate('/dashboard/video-interview')} className="btn-primary">
                    <Video size={15} /> New Interview
                </button>
            </div>
            <SessionsList sessions={sessions} onSelect={setSelectedId} />
        </div>
    )
}

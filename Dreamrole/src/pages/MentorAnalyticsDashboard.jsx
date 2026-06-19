import { useState, useEffect } from 'react'
import { authFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import {
    GraduationCap, Users, UserPlus, ChevronRight, ChevronLeft,
    Loader2, CheckCircle2, AlertCircle, MessageSquare, TrendingUp,
    Video, Brain, Activity, Clock, BarChart3, RefreshCw, X, Plus
} from 'lucide-react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts'

// ── Tokens ────────────────────────────────────────────────────────────────────
const BG_DARK = '#09090f'
const CARD = 'rgba(255,255,255,0.04)'
const BORDER = 'rgba(255,255,255,0.08)'
const TEXT = '#f1f5f9'
const MUTED = 'rgba(255,255,255,0.4)'
const ACCENT = '#6366f1'
const GREEN = '#22c55e'
const AMBER = '#f59e0b'
const RED = '#ef4444'
const PURPLE = '#a855f7'

const stageConfig = {
    'Excellent':         { color: GREEN,  icon: '🌟', num: 4 },
    'Good':              { color: '#3b82f6', icon: '👍', num: 3 },
    'Developing':        { color: AMBER,  icon: '📈', num: 2 },
    'Needs Improvement': { color: RED,    icon: '💪', num: 1 }
}

const emotionEmoji = { happy: '😊', neutral: '😐', sad: '😟', angry: '😠', fearful: '😨', surprised: '😮', disgusted: '😒' }

function SectionTitle({ icon: Icon, title, sub, color = ACCENT }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
            </div>
            <div>
                <p style={{ fontWeight: 700, color: TEXT, margin: 0, fontSize: 15 }}>{title}</p>
                {sub && <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{sub}</p>}
            </div>
        </div>
    )
}

function StudentCard({ student, isSelected, onClick }) {
    const stage = student.lastStage
    const cfg = stageConfig[stage]
    return (
        <div onClick={onClick} style={{
            background: isSelected ? `${ACCENT}15` : CARD,
            border: `1px solid ${isSelected ? ACCENT + '50' : BORDER}`,
            borderRadius: 16, padding: '14px 18px', cursor: 'pointer',
            transition: 'all 0.2s'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: `${ACCENT}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 17, fontWeight: 700, color: '#818cf8', flexShrink: 0
                }}>
                    {student.name?.[0]?.toUpperCase() || student.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 600, color: TEXT, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {student.name || student.email}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: MUTED }}>{student.email}</p>
                </div>
                <ChevronRight size={14} color={MUTED} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <span style={{ fontSize: 11, color: MUTED }}>{student.sessionCount || 0} session{student.sessionCount !== 1 ? 's' : ''}</span>
                {cfg && (
                    <span style={{ fontSize: 11, color: cfg.color, display: 'flex', alignItems: 'center', gap: 3 }}>
                        {cfg.icon} {stage}
                    </span>
                )}
                {student.lastRole && (
                    <span style={{ fontSize: 11, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {student.lastRole}</span>
                )}
            </div>
        </div>
    )
}

function SessionCard({ session, onAddNote }) {
    const cfg = stageConfig[session.overallStage] || stageConfig['Developing']
    const [showNote, setShowNote] = useState(false)
    const [note, setNote] = useState(session.mentorNote || '')
    const [saving, setSaving] = useState(false)

    return (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        padding: '3px 10px', borderRadius: 20,
                        background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`,
                        fontSize: 11, fontWeight: 700, color: cfg.color
                    }}>
                        {cfg.icon} {session.overallStage}
                    </div>
                    <span style={{ fontSize: 11, color: MUTED, textTransform: 'capitalize' }}>
                        {session.mode} · {session.role}
                    </span>
                </div>
                <span style={{ fontSize: 11, color: MUTED }}>
                    {new Date(session.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
            </div>

            {/* Metrics row */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: TEXT, margin: 0 }}>{session.answeredCount}/{session.questions?.length || '?'}</p>
                    <p style={{ fontSize: 10, color: MUTED, margin: 0 }}>Answered</p>
                </div>
                {session.voiceMetrics?.avgConfidenceScore > 0 && (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 18, fontWeight: 800, color: GREEN, margin: 0 }}>{session.voiceMetrics.avgConfidenceScore}%</p>
                        <p style={{ fontSize: 10, color: MUTED, margin: 0 }}>Confidence</p>
                    </div>
                )}
                {session.voiceMetrics?.avgPaceWPM > 0 && (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 18, fontWeight: 800, color: AMBER, margin: 0 }}>{session.voiceMetrics.avgPaceWPM}</p>
                        <p style={{ fontSize: 10, color: MUTED, margin: 0 }}>WPM</p>
                    </div>
                )}
                {session.dominantEmotions?.length > 0 && (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 20, margin: 0 }}>{session.dominantEmotions.map(e => emotionEmoji[e] || '😐').join('')}</p>
                        <p style={{ fontSize: 10, color: MUTED, margin: 0 }}>Mood</p>
                    </div>
                )}
            </div>

            {/* Mentor note */}
            {session.mentorNote && !showNote && (
                <div style={{
                    background: `${PURPLE}10`, border: `1px solid ${PURPLE}20`,
                    borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: 12, color: '#c4b5fd'
                }}>
                    <strong>📝 Mentor note:</strong> {session.mentorNote}
                </div>
            )}

            {showNote ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    <textarea
                        value={note} onChange={e => setNote(e.target.value)}
                        placeholder="Add a note about this session..."
                        style={{
                            padding: '10px 12px', background: 'rgba(255,255,255,0.04)',
                            border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT,
                            fontSize: 13, resize: 'vertical', minHeight: 80, outline: 'none', fontFamily: 'inherit'
                        }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={async () => {
                            setSaving(true)
                            await onAddNote(session._id, note)
                            setSaving(false)
                            setShowNote(false)
                        }} style={{
                            padding: '8px 16px', borderRadius: 9, background: ACCENT,
                            border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600
                        }}>
                            {saving ? 'Saving...' : 'Save Note'}
                        </button>
                        <button onClick={() => setShowNote(false)} style={{
                            padding: '8px 14px', borderRadius: 9, background: CARD,
                            border: `1px solid ${BORDER}`, color: MUTED, cursor: 'pointer', fontSize: 12
                        }}>Cancel</button>
                    </div>
                </div>
            ) : (
                <button onClick={() => setShowNote(true)} style={{
                    padding: '7px 14px', borderRadius: 9, background: `${PURPLE}12`,
                    border: `1px solid ${PURPLE}30`, color: '#c4b5fd',
                    cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5
                }}>
                    <MessageSquare size={12} /> {session.mentorNote ? 'Edit Note' : 'Add Note'}
                </button>
            )}
        </div>
    )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function MentorAnalyticsDashboard() {
    const { currentUser } = useAuth()

    const [students, setStudents] = useState([])
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [sessionsLoading, setSessionsLoading] = useState(false)
    const [linkEmail, setLinkEmail] = useState('')
    const [linking, setLinking] = useState(false)
    const [linkError, setLinkError] = useState('')
    const [linkSuccess, setLinkSuccess] = useState('')
    const [showLinkForm, setShowLinkForm] = useState(false)

    // Fetch student list
    const fetchStudents = async () => {
        setLoading(true)
        try {
            const res = await authFetch('/api/mentor/my-students')
            const data = await res.json()
            if (data.success) setStudents(data.students || [])
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    // Fetch sessions for selected student
    const fetchSessions = async (student) => {
        setSelectedStudent(student)
        setSessionsLoading(true)
        setSessions([])
        try {
            const res = await authFetch(`/api/mentor/student/${student.uid}/sessions`)
            const data = await res.json()
            if (data.success) setSessions(data.sessions || [])
        } catch (err) { console.error(err) }
        finally { setSessionsLoading(false) }
    }

    useEffect(() => { fetchStudents() }, [])

    const handleLinkStudent = async () => {
        if (!linkEmail.trim()) return
        setLinking(true)
        setLinkError('')
        setLinkSuccess('')
        try {
            const res = await authFetch('/api/mentor/link-student', {
                method: 'POST',
                body: JSON.stringify({ studentEmail: linkEmail.trim() })
            })
            const data = await res.json()
            if (data.success) {
                setLinkSuccess(`✅ ${linkEmail} linked successfully!`)
                setLinkEmail('')
                fetchStudents()
            } else {
                setLinkError(data.error || 'Failed to link student')
            }
        } catch (err) { setLinkError(err.message) }
        finally { setLinking(false) }
    }

    const handleAddNote = async (sessionId, note) => {
        await authFetch(`/api/mentor/session/${sessionId}/note`, {
            method: 'POST',
            body: JSON.stringify({ note })
        })
        // Refresh sessions
        if (selectedStudent) fetchSessions(selectedStudent)
    }

    // Build performance chart data from sessions
    const performanceChartData = sessions.slice().reverse().map((s, i) => ({
        session: `S${i + 1}`,
        score: stageConfig[s.overallStage]?.num || 2,
        confidence: s.voiceMetrics?.avgConfidenceScore || 0,
        label: s.overallStage
    }))

    const avgStageScore = sessions.length
        ? (sessions.reduce((sum, s) => sum + (stageConfig[s.overallStage]?.num || 2), 0) / sessions.length).toFixed(1)
        : 0

    // Emotion frequency across all sessions
    const emotionCounts = {}
    sessions.forEach(s => {
        s.dominantEmotions?.forEach(e => { emotionCounts[e] = (emotionCounts[e] || 0) + 1 })
    })
    const emotionChartData = Object.entries(emotionCounts).map(([name, value]) => ({ name, value }))

    const EMOTION_COLORS = { happy: GREEN, neutral: '#64748b', sad: '#3b82f6', angry: RED, fearful: PURPLE, surprised: AMBER, disgusted: '#6b7280' }

    return (
        <div style={{ fontFamily: 'inherit', color: TEXT }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12, background: `${PURPLE}18`,
                        border: `1px solid ${PURPLE}30`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <GraduationCap size={22} color={PURPLE} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Mentor Analytics</h1>
                        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>Track your students' interview performance</p>
                    </div>
                </div>
                <button onClick={() => setShowLinkForm(f => !f)} style={{
                    padding: '10px 18px', borderRadius: 12,
                    background: showLinkForm ? CARD : `${ACCENT}18`,
                    border: `1px solid ${showLinkForm ? BORDER : ACCENT + '40'}`,
                    color: showLinkForm ? MUTED : '#818cf8', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 7
                }}>
                    {showLinkForm ? <X size={14} /> : <UserPlus size={14} />}
                    {showLinkForm ? 'Cancel' : 'Link Student'}
                </button>
            </div>

            {/* Link student form */}
            {showLinkForm && (
                <div style={{
                    background: `${ACCENT}08`, border: `1px solid ${ACCENT}25`,
                    borderRadius: 18, padding: '20px 24px', marginBottom: 20
                }}>
                    <p style={{ fontWeight: 700, color: TEXT, margin: '0 0 12px', fontSize: 14 }}>Link a Student by Email</p>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input
                            value={linkEmail} onChange={e => setLinkEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLinkStudent()}
                            placeholder="student@example.com"
                            type="email"
                            style={{
                                flex: 1, padding: '11px 14px', background: CARD,
                                border: `1px solid ${BORDER}`, borderRadius: 12,
                                color: TEXT, fontSize: 13, outline: 'none'
                            }}
                        />
                        <button onClick={handleLinkStudent} disabled={linking} style={{
                            padding: '11px 20px', borderRadius: 12,
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: 6, opacity: linking ? 0.7 : 1
                        }}>
                            <Plus size={14} /> {linking ? 'Linking...' : 'Link'}
                        </button>
                    </div>
                    {linkError && <p style={{ color: RED, fontSize: 12, margin: '10px 0 0' }}>{linkError}</p>}
                    {linkSuccess && <p style={{ color: GREEN, fontSize: 12, margin: '10px 0 0' }}>{linkSuccess}</p>}
                    <p style={{ color: MUTED, fontSize: 11, margin: '8px 0 0' }}>The student must have a DreamRole account with that email address.</p>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>
                {/* LEFT: Student list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <SectionTitle icon={Users} title="My Students" sub={`${students.length} linked`} color={ACCENT} />
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 32, color: MUTED }}>
                            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                    ) : students.length === 0 ? (
                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '32px 20px', textAlign: 'center' }}>
                            <GraduationCap size={30} color={MUTED} style={{ marginBottom: 10 }} />
                            <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>No students linked yet.<br />Click "Link Student" to get started.</p>
                        </div>
                    ) : (
                        students.map(s => (
                            <StudentCard
                                key={s.uid} student={s}
                                isSelected={selectedStudent?.uid === s.uid}
                                onClick={() => fetchSessions(s)}
                            />
                        ))
                    )}
                </div>

                {/* RIGHT: Student detail */}
                <div>
                    {!selectedStudent ? (
                        <div style={{
                            background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20,
                            padding: '60px 32px', textAlign: 'center'
                        }}>
                            <Brain size={36} color={MUTED} style={{ marginBottom: 14 }} />
                            <p style={{ fontWeight: 700, color: TEXT, margin: '0 0 6px', fontSize: 16 }}>Select a Student</p>
                            <p style={{ color: MUTED, fontSize: 13 }}>Click any student on the left to view their performance analytics.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            {/* Student header */}
                            <div style={{
                                background: `${PURPLE}10`, border: `1px solid ${PURPLE}25`,
                                borderRadius: 18, padding: '18px 22px',
                                display: 'flex', alignItems: 'center', gap: 14
                            }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    background: `${PURPLE}25`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 20, fontWeight: 700, color: '#c4b5fd'
                                }}>
                                    {selectedStudent.name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 700, color: TEXT, margin: '0 0 3px', fontSize: 16 }}>{selectedStudent.name || selectedStudent.email}</p>
                                    <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{selectedStudent.email}</p>
                                </div>
                                <div style={{ display: 'flex', gap: 20, textAlign: 'center' }}>
                                    <div>
                                        <p style={{ fontSize: 22, fontWeight: 800, color: TEXT, margin: 0 }}>{sessions.length}</p>
                                        <p style={{ fontSize: 10, color: MUTED, margin: 0 }}>Sessions</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 22, fontWeight: 800, color: ACCENT, margin: 0 }}>{avgStageScore}</p>
                                        <p style={{ fontSize: 10, color: MUTED, margin: 0 }}>Avg Score</p>
                                    </div>
                                </div>
                            </div>

                            {sessionsLoading ? (
                                <div style={{ textAlign: 'center', padding: 40, color: MUTED }}>
                                    <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
                                    <p style={{ marginTop: 10, fontSize: 13 }}>Loading sessions...</p>
                                </div>
                            ) : sessions.length === 0 ? (
                                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '40px 24px', textAlign: 'center' }}>
                                    <Video size={28} color={MUTED} style={{ marginBottom: 10 }} />
                                    <p style={{ color: MUTED, fontSize: 13 }}>No interview sessions yet.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Performance chart */}
                                    {sessions.length > 1 && (
                                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 20 }}>
                                            <SectionTitle icon={TrendingUp} title="Performance Over Time" sub="Stage score: 4=Excellent, 1=Needs Work" color={GREEN} />
                                            <ResponsiveContainer width="100%" height={160}>
                                                <LineChart data={performanceChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis dataKey="session" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                                                    <YAxis domain={[1, 4]} ticks={[1, 2, 3, 4]} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                                                    <Tooltip
                                                        content={({ active, payload }) => active && payload?.length ? (
                                                            <div style={{ background: '#0f0f1e', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
                                                                <p style={{ color: MUTED, margin: '0 0 4px' }}>{payload[0]?.payload?.label}</p>
                                                                <p style={{ color: GREEN, margin: 0, fontWeight: 700 }}>Score: {payload[0]?.value}/4</p>
                                                                {payload[1] && <p style={{ color: AMBER, margin: 0 }}>Confidence: {payload[1]?.value}%</p>}
                                                            </div>
                                                        ) : null}
                                                    />
                                                    <Line type="monotone" dataKey="score" stroke={ACCENT} strokeWidth={2.5} dot={{ fill: ACCENT, r: 4 }} name="Stage" />
                                                    <Line type="monotone" dataKey="confidence" stroke={GREEN} strokeWidth={2} dot={false} strokeDasharray="4 2" name="Confidence" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {/* Emotion heatmap across sessions */}
                                    {emotionChartData.length > 0 && (
                                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 20 }}>
                                            <SectionTitle icon={Activity} title="Emotion Profile" sub="Dominant emotions across all sessions" color={AMBER} />
                                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                {emotionChartData.sort((a, b) => b.value - a.value).map(({ name, value }) => (
                                                    <div key={name} style={{
                                                        flex: '1 1 100px', background: `${EMOTION_COLORS[name] || ACCENT}12`,
                                                        border: `1px solid ${EMOTION_COLORS[name] || ACCENT}30`,
                                                        borderRadius: 12, padding: '12px 16px', textAlign: 'center'
                                                    }}>
                                                        <p style={{ fontSize: 24, margin: '0 0 5px' }}>{emotionEmoji[name] || '😐'}</p>
                                                        <p style={{ fontWeight: 700, color: EMOTION_COLORS[name] || TEXT, margin: '0 0 2px', fontSize: 15 }}>{value}</p>
                                                        <p style={{ fontSize: 11, color: MUTED, margin: 0, textTransform: 'capitalize' }}>{name}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Session cards */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <SectionTitle icon={Video} title="Interview Sessions" sub={`${sessions.length} total`} color={PURPLE} />
                                        {sessions.map(s => (
                                            <SessionCard key={s._id} session={s} onAddNote={handleAddNote} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

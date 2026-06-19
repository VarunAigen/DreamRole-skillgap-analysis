import { useState, useEffect } from 'react'
import { authFetch } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import {
    GraduationCap, Users, MessageSquare, Download, Search, Award,
    Briefcase, ExternalLink, FileText, RefreshCw, User, Mail, Plus,
    Trash2, AlertCircle, Calendar, TrendingUp, CheckCircle2, ChevronRight,
    Clipboard, BookOpen, AlertTriangle
} from 'lucide-react'

// ── Design tokens (Dark Glassmorphism) ─────────────────────────────────────────
const BG = '#09090f'
const CARD = 'rgba(255,255,255,0.03)'
const BORDER = 'rgba(255,255,255,0.06)'
const TEXT = '#f1f5f9'
const MUTED = 'rgba(255,255,255,0.45)'
const ACCENT = '#6366f1'
const GREEN = '#22c55e'
const RED = '#ef4444'
const AMBER = '#f59e0b'
const PURPLE = '#a855f7'

const STAGE_COLORS = {
    'Excellent': '#22c55e',
    'Good': '#3b82f6',
    'Developing': '#f59e0b',
    'Needs Improvement': '#ef4444',
    'Unknown': '#64748b'
}

export default function MentorDashboard() {
    const navigate = useNavigate()

    // Dashboard State
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStudentUid, setSelectedStudentUid] = useState(null)
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [studentProfile, setStudentProfile] = useState(null)
    const [sessions, setSessions] = useState([])
    const [sessionsLoading, setSessionsLoading] = useState(false)
    const [profileLoading, setProfileLoading] = useState(false)
    
    // Tab switching inside details
    const [detailTab, setDetailTab] = useState('profile') // 'profile' or 'sessions'

    // Form state for linking a student
    const [linkEmail, setLinkEmail] = useState('')
    const [linking, setLinking] = useState(false)
    const [linkError, setLinkError] = useState('')
    const [linkSuccess, setLinkSuccess] = useState('')

    // Feedback Note state
    const [editingSessionId, setEditingSessionId] = useState(null)
    const [sessionNoteText, setSessionNoteText] = useState('')
    const [savingNote, setSavingNote] = useState(false)

    // Load linked students
    const loadStudents = async (selectUid = null) => {
        try {
            const res = await authFetch('/api/mentor/my-students')
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setStudents(data.students || [])
                    // Auto-select first student if none selected and students exist
                    const targetUid = selectUid || (data.students.length > 0 ? data.students[0].uid : null)
                    if (targetUid) {
                        const matched = data.students.find(s => s.uid === targetUid)
                        if (matched) {
                            setSelectedStudentUid(targetUid)
                            setSelectedStudent(matched)
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load mentees:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadStudents()
    }, [])

    // Load student profile & sessions when selection changes
    useEffect(() => {
        if (!selectedStudentUid) {
            setStudentProfile(null)
            setSessions([])
            return
        }

        const fetchStudentDetails = async () => {
            setProfileLoading(true)
            setSessionsLoading(true)
            try {
                // Fetch profile details
                const profileRes = await authFetch(`/api/mentor/mentee/${selectedStudentUid}`)
                if (profileRes.ok) {
                    const profileData = await profileRes.json()
                    if (profileData.success) {
                        setStudentProfile(profileData.profile)
                    }
                } else {
                    setStudentProfile(null)
                }

                // Fetch sessions
                const sessionsRes = await authFetch(`/api/mentor/student/${selectedStudentUid}/sessions`)
                if (sessionsRes.ok) {
                    const sessionsData = await sessionsRes.json()
                    if (sessionsData.success) {
                        setSessions(sessionsData.sessions || [])
                    }
                } else {
                    setSessions([])
                }
            } catch (err) {
                console.error('Error fetching student details:', err)
            } finally {
                setProfileLoading(false)
                setSessionsLoading(false)
            }
        }

        fetchStudentDetails()
    }, [selectedStudentUid])

    // Link a new student
    const handleLinkStudent = async (e) => {
        e.preventDefault()
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
                setLinkSuccess(`Successfully linked student!`)
                setLinkEmail('')
                // Reload and select this new student
                if (data.link && data.link.students) {
                    const newStudent = data.link.students[data.link.students.length - 1]
                    loadStudents(newStudent?.uid)
                } else {
                    loadStudents()
                }
            } else {
                setLinkError(data.error || 'Failed to link student')
            }
        } catch (err) {
            setLinkError(err.message)
        } finally {
            setLinking(false)
            setTimeout(() => {
                setLinkSuccess('')
                setLinkError('')
            }, 5000)
        }
    }

    // Unlink a student
    const handleUnlinkStudent = async (studentUid) => {
        if (!window.confirm('Are you sure you want to unlink this student? You will no longer see their progress or resume details.')) return
        try {
            const res = await authFetch(`/api/mentor/unlink-student/${studentUid}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            if (data.success) {
                // If we unlinked the current selected student, clear selection
                if (selectedStudentUid === studentUid) {
                    setSelectedStudentUid(null)
                    setSelectedStudent(null)
                }
                loadStudents()
            } else {
                alert(data.error || 'Failed to unlink student')
            }
        } catch (err) {
            alert(err.message)
        }
    }

    // Download Resume text file
    const handleDownloadResume = async (studentUid, studentName) => {
        try {
            const res = await authFetch(`/api/mentor/mentee/${studentUid}/resume`)
            if (!res.ok) throw new Error('No resume text found or download failed')
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `resume_${studentName.replace(/\s+/g, '_')}.txt`
            document.body.appendChild(a)
            a.click()
            a.remove()
        } catch (err) {
            alert(err.message)
        }
    }

    // Edit and save session note
    const handleStartEditNote = (session) => {
        setEditingSessionId(session._id)
        setSessionNoteText(session.mentorNote || '')
    }

    const handleSaveNote = async (sessionId) => {
        setSavingNote(true)
        try {
            const res = await authFetch(`/api/mentor/session/${sessionId}/note`, {
                method: 'POST',
                body: JSON.stringify({ note: sessionNoteText })
            })
            const data = await res.json()
            if (data.success) {
                // Update local sessions state
                setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, mentorNote: data.session.mentorNote } : s))
                setEditingSessionId(null)
            } else {
                alert(data.error || 'Failed to save note')
            }
        } catch (err) {
            alert(err.message)
        } finally {
            setSavingNote(false)
        }
    }

    // Filter students list locally by search
    const filteredStudents = students.filter(s => {
        const query = searchQuery.toLowerCase()
        return (
            s.name?.toLowerCase().includes(query) ||
            s.email?.toLowerCase().includes(query) ||
            s.lastRole?.toLowerCase().includes(query)
        )
    })

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, color: ACCENT }}>
                <RefreshCw size={30} className="animate-spin" />
                <span style={{ fontSize: 13, color: MUTED }}>Loading mentees dashboard...</span>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minHeight: 'calc(100vh - 80px)', color: TEXT }}>
            {/* Header */}
            <div>
                <h1 className="section-heading flex items-center gap-2">
                    <GraduationCap size={22} className="text-indigo-400" /> Mentor Dashboard
                </h1>
                <p className="section-sub">Manage linked students, view resumes, track interview performance, and add feedback notes.</p>
            </div>

            {/* Split Screen Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'stretch' }}>
                
                {/* ── LEFT COLUMN: Mentees Sidebar ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 16 }}>
                    
                    {/* Link Student Form */}
                    <div style={{ borderBottom: `1px solid ${BORDER}`, pb: 16, paddingBottom: 16 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: MUTED, marginBottom: 8 }}>Link Student by Email</p>
                        <form onSubmit={handleLinkStudent} style={{ display: 'flex', gap: 8 }}>
                            <input
                                type="email"
                                placeholder="student@example.com"
                                value={linkEmail}
                                onChange={e => setLinkEmail(e.target.value)}
                                style={{
                                    flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.25)',
                                    border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 12, outline: 'none'
                                }}
                                required
                            />
                            <button
                                type="submit"
                                disabled={linking}
                                style={{
                                    padding: '8px 12px', borderRadius: 10, background: ACCENT, border: 'none',
                                    color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                }}
                            >
                                {linking ? '...' : <Plus size={14} />}
                            </button>
                        </form>
                        {linkSuccess && <p style={{ fontSize: 11, color: GREEN, margin: '6px 0 0' }}>{linkSuccess}</p>}
                        {linkError && <p style={{ fontSize: 11, color: RED, margin: '6px 0 0' }}>{linkError}</p>}
                    </div>

                    {/* Mentees Search */}
                    <div style={{ position: 'relative' }}>
                        <Search size={14} color={MUTED} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', padding: '8px 12px 8px 30px', background: 'rgba(0,0,0,0.15)',
                                border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 12, outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Mentees List */}
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '500px' }}>
                        {filteredStudents.map(student => {
                            const active = selectedStudentUid === student.uid
                            const initials = student.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST'
                            return (
                                <div
                                    key={student.uid}
                                    onClick={() => {
                                        setSelectedStudentUid(student.uid)
                                        setSelectedStudent(student)
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12,
                                        background: active ? 'rgba(99,102,241,0.08)' : 'transparent',
                                        border: `1px solid ${active ? 'rgba(99,102,241,0.2)' : 'transparent'}`,
                                        cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
                                    }}
                                    onMouseEnter={e => {
                                        if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                                    }}
                                    onMouseLeave={e => {
                                        if (!active) e.currentTarget.style.background = 'transparent'
                                    }}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                                        display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center',
                                        fontSize: 12, fontWeight: 700, color: '#fff'
                                    }}>
                                        {initials}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: TEXT, truncate: true }}>{student.name}</p>
                                        <p style={{ margin: 0, fontSize: 11, color: MUTED, truncate: true }}>{student.email}</p>
                                        {student.lastRole && (
                                            <p style={{ margin: '2px 0 0', fontSize: 10, color: ACCENT }}>Role: {student.lastRole}</p>
                                        )}
                                    </div>
                                    <ChevronRight size={14} color={active ? ACCENT : MUTED} />
                                </div>
                            )
                        })}

                        {filteredStudents.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '24px 10px', color: MUTED, fontSize: 12 }}>
                                <Users size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                                No linked students found.
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT COLUMN: Mentee Details Panel ── */}
                <div style={{ minHeight: 460 }}>
                    {selectedStudent ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            
                            {/* Card 1: Student Header Card */}
                            <div style={{
                                background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 20,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{
                                        width: 50, height: 50, borderRadius: 14,
                                        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
                                        border: `1px solid rgba(99,102,241,0.25)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <User size={22} color="#818cf8" />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT, margin: '0 0 3px' }}>{selectedStudent.name}</h2>
                                        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{selectedStudent.email}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button
                                        onClick={() => navigate(`/dashboard/chat?recipientId=${selectedStudent.uid}&name=${encodeURIComponent(selectedStudent.name)}`)}
                                        style={{
                                            padding: '9px 16px', borderRadius: 10, background: 'rgba(99,102,241,0.15)',
                                            border: `1px solid rgba(99,102,241,0.25)`, color: '#a5b4fc', fontSize: 12,
                                            fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                                        }}
                                    >
                                        <MessageSquare size={13} /> Chat with Student
                                    </button>
                                    <button
                                        onClick={() => handleDownloadResume(selectedStudent.uid, selectedStudent.name)}
                                        style={{
                                            padding: '9px 16px', borderRadius: 10, background: CARD,
                                            border: `1px solid ${BORDER}`, color: TEXT, fontSize: 12,
                                            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                                        }}
                                    >
                                        <Download size={13} /> Download Resume
                                    </button>
                                    <button
                                        onClick={() => handleUnlinkStudent(selectedStudent.uid)}
                                        style={{
                                            padding: '9px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.05)',
                                            border: `1px solid rgba(239,68,68,0.15)`, color: '#fca5a5', fontSize: 12,
                                            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                                        }}
                                    >
                                        <Trash2 size={13} /> Unlink
                                    </button>
                                </div>
                            </div>

                            {/* Navigation Tabs (Profile vs Sessions) */}
                            <div style={{ display: 'flex', gap: 4, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 3, width: 'fit-content' }}>
                                <button
                                    onClick={() => setDetailTab('profile')}
                                    style={{
                                        padding: '7px 16px', borderRadius: 8, border: 'none',
                                        background: detailTab === 'profile' ? ACCENT : 'transparent',
                                        color: detailTab === 'profile' ? '#fff' : MUTED, cursor: 'pointer',
                                        fontSize: 12, fontWeight: detailTab === 'profile' ? 700 : 400, transition: 'all 0.2s'
                                    }}
                                >
                                    Profile & Background
                                </button>
                                <button
                                    onClick={() => setDetailTab('sessions')}
                                    style={{
                                        padding: '7px 16px', borderRadius: 8, border: 'none',
                                        background: detailTab === 'sessions' ? ACCENT : 'transparent',
                                        color: detailTab === 'sessions' ? '#fff' : MUTED, cursor: 'pointer',
                                        fontSize: 12, fontWeight: detailTab === 'sessions' ? 700 : 400, transition: 'all 0.2s'
                                    }}
                                >
                                    Interview sessions ({sessions.length})
                                </button>
                            </div>

                            {/* ── TAB 1: Profile & Background ── */}
                            {detailTab === 'profile' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    {profileLoading ? (
                                        <div style={{ padding: 40, textAlign: 'center', color: MUTED }}>
                                            <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                                            <span>Loading profile background...</span>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Target Role & Education */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'stretch' }}>
                                                {/* Target Role */}
                                                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 18 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                        <BookOpen size={16} className="text-indigo-400" />
                                                        <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Career Target</span>
                                                    </div>
                                                    <p style={{ fontSize: 11, color: MUTED, margin: '0 0 2px' }}>Desired Role / Pathway:</p>
                                                    <p style={{ fontSize: 16, fontWeight: 800, color: '#a5b4fc', margin: 0 }}>
                                                        {studentProfile?.selected_role || 'Not set'}
                                                    </p>
                                                </div>

                                                {/* Educational background */}
                                                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 18 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                        <GraduationCap size={16} className="text-indigo-400" />
                                                        <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Education</span>
                                                    </div>
                                                    {studentProfile?.collegeDetails?.collegeName ? (
                                                        <div>
                                                            <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>{studentProfile.collegeDetails.collegeName}</p>
                                                            <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>
                                                                {studentProfile.collegeDetails.degree}
                                                                {studentProfile.collegeDetails.gradYear ? ` · Class of ${studentProfile.collegeDetails.gradYear}` : ''}
                                                            </p>
                                                            {studentProfile.collegeDetails.gpa && (
                                                                <p style={{ fontSize: 11, color: ACCENT, margin: '2px 0 0', fontWeight: 600 }}>GPA: {studentProfile.collegeDetails.gpa}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>No educational details added by the student.</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Projects */}
                                            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 20 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                                    <Clipboard size={16} className="text-indigo-400" />
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Academic & Personal Projects</span>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                    {studentProfile?.projects?.map((proj, idx) => (
                                                        <div key={idx} style={{ padding: 12, background: 'rgba(255,255,255,0.01)', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
                                                            <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: '0 0 3px' }}>{proj.title}</p>
                                                            <p style={{ fontSize: 11, color: MUTED, margin: '0 0 6px', lineHeight: 1.5 }}>{proj.description}</p>
                                                            {proj.github && (
                                                                <a href={proj.github} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
                                                                    <ExternalLink size={10} /> GitHub
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {(!studentProfile?.projects || studentProfile.projects.length === 0) && (
                                                        <p style={{ fontSize: 12, color: MUTED, gridColumn: 'span 2', margin: 0 }}>No projects listed.</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Internships & Certifications split */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'stretch' }}>
                                                {/* Work Experiences */}
                                                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 18 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                        <Briefcase size={16} className="text-indigo-400" />
                                                        <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Work/Internship Experience</span>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                        {studentProfile?.internships?.map((intern, idx) => (
                                                            <div key={idx} style={{ paddingBottom: idx < studentProfile.internships.length - 1 ? 10 : 0, borderBottom: idx < studentProfile.internships.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                                                                <p style={{ fontSize: 12, fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>{intern.role} · {intern.company}</p>
                                                                <p style={{ fontSize: 10, color: ACCENT, margin: '0 0 4px', fontWeight: 600 }}>{intern.duration}</p>
                                                                <p style={{ fontSize: 11, color: MUTED, margin: 0, lineHeight: 1.4 }}>{intern.description}</p>
                                                            </div>
                                                        ))}
                                                        {(!studentProfile?.internships || studentProfile.internships.length === 0) && (
                                                            <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>No work experience listed.</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Certifications */}
                                                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 18 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                        <Award size={16} className="text-indigo-400" />
                                                        <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Certifications</span>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                        {studentProfile?.certifications?.map((cert, idx) => (
                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div>
                                                                    <p style={{ fontSize: 12, fontWeight: 700, color: TEXT, margin: 0 }}>{cert.title}</p>
                                                                    <p style={{ fontSize: 10, color: MUTED, margin: 0 }}>{cert.platform}</p>
                                                                </div>
                                                                {cert.link && (
                                                                    <a href={cert.link} target="_blank" rel="noreferrer" style={{ color: MUTED, cursor: 'pointer' }}>
                                                                        <ExternalLink size={12} />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {(!studentProfile?.certifications || studentProfile.certifications.length === 0) && (
                                                            <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>No professional certifications.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Resume snippet */}
                                            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 20 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                    <FileText size={16} className="text-indigo-400" />
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Analyzed Resume Text</span>
                                                </div>
                                                {studentProfile?.resume_text ? (
                                                    <div style={{
                                                        background: 'rgba(0,0,0,0.3)', border: `1px solid ${BORDER}`,
                                                        borderRadius: 12, padding: 14, fontSize: 12, color: 'rgba(255,255,255,0.7)',
                                                        maxHeight: 180, overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6
                                                    }}>
                                                        {studentProfile.resume_text}
                                                    </div>
                                                ) : (
                                                    <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>No resume uploaded by the student yet.</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ── TAB 2: Sessions / Mock History ── */}
                            {detailTab === 'sessions' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {sessionsLoading ? (
                                        <div style={{ padding: 40, textAlign: 'center', color: MUTED }}>
                                            <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                                            <span>Loading sessions list...</span>
                                        </div>
                                    ) : (
                                        <>
                                            {sessions.map((session) => {
                                                const formattedDate = new Date(session.createdAt).toLocaleDateString() + ' ' + new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                const isEditingNote = editingSessionId === session._id
                                                const badgeColor = STAGE_COLORS[session.overallStage] || '#6366f1'
                                                
                                                return (
                                                    <div key={session._id} style={{
                                                        background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 18,
                                                        display: 'flex', flexDirection: 'column', gap: 12
                                                    }}>
                                                        {/* Header */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                                                            <div>
                                                                <h4 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: '0 0 3px' }}>
                                                                    {session.role} Practice Session
                                                                </h4>
                                                                <p style={{ fontSize: 11, color: MUTED, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <Calendar size={12} /> {formattedDate}
                                                                </p>
                                                            </div>

                                                            {/* Status Badge */}
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <span style={{
                                                                    fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                                                                    background: `${badgeColor}18`, color: badgeColor, border: `1px solid ${badgeColor}30`,
                                                                    textTransform: 'uppercase', letterSpacing: '0.04em'
                                                                }}>{session.overallStage || 'Completed'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Metrics summary */}
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, background: 'rgba(0,0,0,0.15)', borderRadius: 12, padding: 10 }}>
                                                            <div style={{ textAlign: 'center' }}>
                                                                <p style={{ fontSize: 10, color: MUTED, margin: '0 0 2px' }}>Accuracy</p>
                                                                <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>{session.accuracyScore || 'N/A'}</p>
                                                            </div>
                                                            <div style={{ textAlign: 'center' }}>
                                                                <p style={{ fontSize: 10, color: MUTED, margin: '0 0 2px' }}>Total Questions</p>
                                                                <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>{session.questions?.length || 0}</p>
                                                            </div>
                                                            <div style={{ textAlign: 'center' }}>
                                                                <p style={{ fontSize: 10, color: MUTED, margin: '0 0 2px' }}>Mode</p>
                                                                <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0, textTransform: 'capitalize' }}>
                                                                    {session.mode || 'text'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Feedback Note Panel */}
                                                        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                            <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, margin: 0 }}>Mentor Notes & Guidance</p>
                                                            
                                                            {isEditingNote ? (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                                    <textarea
                                                                        value={sessionNoteText}
                                                                        onChange={e => setSessionNoteText(e.target.value)}
                                                                        placeholder="Provide custom feedback, suggested reading, or areas of improvement..."
                                                                        rows={3}
                                                                        style={{
                                                                            width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)',
                                                                            border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 12, outline: 'none',
                                                                            resize: 'vertical', boxSizing: 'border-box'
                                                                        }}
                                                                    />
                                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                                        <button
                                                                            onClick={() => handleSaveNote(session._id)}
                                                                            disabled={savingNote}
                                                                            style={{
                                                                                padding: '6px 12px', borderRadius: 8, background: GREEN, border: 'none',
                                                                                color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            {savingNote ? 'Saving...' : 'Save Feedback'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEditingSessionId(null)}
                                                                            style={{
                                                                                padding: '6px 12px', borderRadius: 8, background: CARD, border: `1px solid ${BORDER}`,
                                                                                color: TEXT, fontSize: 11, fontWeight: 600, cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                                                                    <p style={{ fontSize: 12, color: session.mentorNote ? TEXT : MUTED, margin: 0, fontStyle: session.mentorNote ? 'normal' : 'italic', lineHeight: 1.5 }}>
                                                                        {session.mentorNote || 'No feedback notes recorded yet for this session.'}
                                                                    </p>
                                                                    <button
                                                                        onClick={() => handleStartEditNote(session)}
                                                                        style={{
                                                                            padding: '4px 10px', borderRadius: 6, background: CARD, border: `1px solid ${BORDER}`,
                                                                            color: '#a5b4fc', fontSize: 10, fontWeight: 600, cursor: 'pointer', flexShrink: 0
                                                                        }}
                                                                    >
                                                                        {session.mentorNote ? 'Edit Note' : 'Add Note'}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}

                                            {sessions.length === 0 && (
                                                <div style={{ textAlign: 'center', padding: '40px 10px', color: MUTED }}>
                                                    <AlertTriangle size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                                                    <p style={{ fontSize: 12, margin: 0 }}>This student has not completed any mock interview practice sessions yet.</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                        </div>
                    ) : (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            minHeight: 460, background: CARD, border: `1px dashed ${BORDER}`, borderRadius: 20, padding: 40, textAlign: 'center', color: MUTED
                        }}>
                            <GraduationCap size={44} style={{ opacity: 0.25, marginBottom: 14 }} color={ACCENT} />
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>No Mentee Selected</h3>
                            <p style={{ fontSize: 12, maxWidth: 380, margin: 0, lineHeight: 1.6 }}>
                                Select a student from the sidebar directory to inspect their target career path, background profiles, certifications, and mock interview attempts.
                            </p>
                        </div>
                    )}
                </div>

            </div>
            
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}

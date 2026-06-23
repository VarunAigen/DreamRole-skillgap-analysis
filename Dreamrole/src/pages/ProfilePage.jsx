import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { authFetch } from '../lib/api'
import {
    User, Mail, Shield, Target, FileText, Trash2, Award, CheckCircle2,
    RefreshCw, Plus, Edit2, Check, X, GraduationCap, Briefcase, ExternalLink, Loader, LogOut, Download
} from 'lucide-react'

// ── Design tokens ─────────────────────────────────────────────────────────────
const CARD = 'rgba(255,255,255,0.03)'
const BORDER = 'rgba(255,255,255,0.06)'
const TEXT = '#f1f5f9'
const MUTED = 'rgba(255,255,255,0.45)'
const ACCENT = '#6366f1'
const GREEN = '#22c55e'
const RED = '#ef4444'

export default function ProfilePage() {
    const { currentUser, userRole, logout } = useAuth()
    const navigate = useNavigate()
    const {
        resumeText,
        extractedSkills,
        selectedRole, setSelectedRole,
        clearSession
    } = useApp()

    // Status state
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [err, setErr] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [reloadKey, setReloadKey] = useState(0)

    // ── Student-specific background state ──────────────────────────────────────
    const [roleInput, setRoleInput] = useState(selectedRole || '')
    const [college, setCollege] = useState({ collegeName: '', degree: '', gradYear: '', gpa: '' })
    const [projects, setProjects] = useState([])
    const [certifications, setCertifications] = useState([])
    const [internships, setInternships] = useState([])

    // Item creation/edit temporary states
    const [newProj, setNewProj] = useState({ title: '', description: '', github: '' })
    const [newCert, setNewCert] = useState({ title: '', platform: '', link: '' })
    const [newIntern, setNewIntern] = useState({ company: '', role: '', duration: '', description: '' })

    // ── Mentor-specific profile state ──────────────────────────────────────────
    const [mentorProfile, setMentorProfile] = useState({
        designation: '', company: '', skills: '', profileInfo: ''
    })

    const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'DreamRole User'
    const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    const photoURL = currentUser?.photoURL

    // ── Load Data ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const loadProfileData = async () => {
            setLoading(true)
            try {
                if (userRole === 'mentor') {
                    // Fetch mentor profile
                    const res = await authFetch('/api/mentor/profile')
                    if (res.ok) {
                        const data = await res.json()
                        if (data.profile) {
                            setMentorProfile({
                                designation: data.profile.designation || '',
                                company: data.profile.company || '',
                                skills: data.profile.skills?.join(', ') || '',
                                profileInfo: data.profile.profileInfo || ''
                            })
                        }
                    }
                } else if (userRole === 'student') {
                    // Fetch student UserProfile
                    const res = await authFetch('/api/profile')
                    if (res.ok) {
                        const data = await res.json()
                        if (data.profile) {
                            setCollege(data.profile.collegeDetails || { collegeName: '', degree: '', gradYear: '', gpa: '' })
                            setProjects(data.profile.projects || [])
                            setCertifications(data.profile.certifications || [])
                            setInternships(data.profile.internships || [])
                            if (data.profile.selected_role) {
                                setRoleInput(data.profile.selected_role)
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load profile data:', error)
            } finally {
                setLoading(false)
            }
        }
        if (userRole) loadProfileData()
    }, [userRole, reloadKey])

    // ── Student: Save Preference & Background ─────────────────────────────────
    const handleSaveStudentProfile = async (e) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')
        setErr('')
        try {
            // Update context role
            setSelectedRole(roleInput)

            // Save details to MongoDB
            const res = await authFetch('/api/profile', {
                method: 'PATCH',
                body: JSON.stringify({
                    selected_role: roleInput,
                    collegeDetails: college,
                    projects,
                    certifications,
                    internships
                })
            })
            if (res.ok) {
                setMessage('Profile information saved successfully!')
                setTimeout(() => setMessage(''), 3000)
            } else {
                throw new Error('Save request failed')
            }
        } catch (error) {
            setErr('Failed to save profile: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    // ── Student: Reset All Data ────────────────────────────────────────────────
    const handleClearData = async () => {
        if (window.confirm('Are you sure you want to clear your resume and background profile data? This will wipe your projects, certifications, and internships.')) {
            try {
                await clearSession()
                setRoleInput('')
                setCollege({ collegeName: '', degree: '', gradYear: '', gpa: '' })
                setProjects([])
                setCertifications([])
                setInternships([])
                setMessage('Profile data cleared!')
                setTimeout(() => setMessage(''), 3000)
            } catch (error) {
                setErr('Failed to clear data: ' + error.message)
            }
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
            setErr(error.message)
        }
    }

    const handleViewResume = async () => {
        try {
            const res = await authFetch('/api/profile/resume/download')
            if (!res.ok) throw new Error('No resume PDF available to view.')
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            window.open(url, '_blank')
        } catch (error) {
            setErr(error.message)
        }
    }

    // ── Mentor: Save Profile ──────────────────────────────────────────────────
    const handleSaveMentorProfile = async (e) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')
        setErr('')
        try {
            const res = await authFetch('/api/mentor/profile', {
                method: 'PATCH',
                body: JSON.stringify(mentorProfile)
            })
            if (res.ok) {
                setMessage('Mentor profile saved successfully!')
                setTimeout(() => setMessage(''), 3000)
            } else {
                throw new Error('Update failed')
            }
        } catch (error) {
            setErr('Failed to save profile: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    // ── List Item Operations ──────────────────────────────────────────────────
    const addProject = () => {
        if (!newProj.title.trim()) return
        setProjects(p => [...p, { ...newProj }])
        setNewProj({ title: '', description: '', github: '' })
    }
    const removeProject = (idx) => {
        setProjects(p => p.filter((_, i) => i !== idx))
    }

    const addCertification = () => {
        if (!newCert.title.trim()) return
        setCertifications(c => [...c, { ...newCert }])
        setNewCert({ title: '', platform: '', link: '' })
    }
    const removeCertification = (idx) => {
        setCertifications(c => c.filter((_, i) => i !== idx))
    }

    const addInternship = () => {
        if (!newIntern.company.trim()) return
        setInternships(i => [...i, { ...newIntern }])
        setNewIntern({ company: '', role: '', duration: '', description: '' })
    }
    const removeInternship = (idx) => {
        setInternships(i => i.filter((_, i) => i !== idx))
    }

    // ── Loading state render ──────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 12, color: ACCENT }}>
                <Loader size={30} className="animate-spin" />
                <span style={{ fontSize: 13, color: MUTED }}>Loading profile data...</span>
            </div>
        )
    }

    return (
        <div style={{ maxWidth: 840, margin: '0 auto', padding: '10px 20px', fontFamily: 'inherit' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 100%)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <User size={20} color="#818cf8" />
                </div>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT, margin: 0 }}>My Profile</h1>
                    <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
                        {userRole === 'admin' ? 'Administrative Settings' : userRole === 'mentor' ? 'Manage your Professional Bio & Credentials' : 'Manage your resume, projects, and target role'}
                    </p>
                </div>
            </div>

            {/* Notifications */}
            {message && (
                <div style={{
                    background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 12, padding: '12px 16px', marginBottom: 20,
                    display: 'flex', alignItems: 'center', gap: 8, color: '#4ade80', fontSize: 13
                }}>
                    <CheckCircle2 size={16} />
                    <span>{message}</span>
                </div>
            )}
            {err && (
                <div style={{
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 12, padding: '12px 16px', marginBottom: 20,
                    display: 'flex', alignItems: 'center', gap: 8, color: '#fca5a5', fontSize: 13
                }}>
                    <Trash2 size={16} />
                    <span>{err}</span>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 👤 Card 1: General Info */}
                <div style={{
                    background: CARD, border: `1px solid ${BORDER}`,
                    borderRadius: 20, padding: 24,
                    display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap'
                }}>
                    {photoURL ? (
                        <img src={photoURL} alt={displayName} style={{
                            width: 64, height: 64, borderRadius: '50%',
                            objectFit: 'cover', border: `3px solid ${ACCENT}40`
                        }} referrerPolicy="no-referrer" />
                    ) : (
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22, fontWeight: 'bold', color: '#fff'
                        }}>
                            {initials}
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>{displayName}</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <p style={{ fontSize: 12, color: MUTED, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Mail size={12} /> {currentUser?.email || 'N/A'}
                            </p>
                            <p style={{ fontSize: 12, color: MUTED, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Shield size={12} /> Role: <span style={{
                                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                    background: userRole === 'admin' ? 'rgba(239,68,68,0.15)' : userRole === 'mentor' ? 'rgba(168,85,247,0.15)' : 'rgba(99,102,241,0.15)',
                                    color: userRole === 'admin' ? '#f87171' : userRole === 'mentor' ? '#c084fc' : '#818cf8',
                                    textTransform: 'uppercase', letterSpacing: '0.04em'
                                }}>{userRole || 'student'}</span>
                            </p>
                        </div>
                    </div>
                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginLeft: 'auto' }}>
                        {userRole !== 'admin' && (
                            !isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '8px 16px', borderRadius: 10,
                                        background: 'rgba(99,102,241,0.15)',
                                        border: `1px solid ${ACCENT}40`,
                                        color: '#a5b4fc', fontSize: 12, fontWeight: 600,
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    <Edit2 size={14} />
                                    Edit Profile
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={async (e) => {
                                            if (userRole === 'mentor') {
                                                await handleSaveMentorProfile(e);
                                            } else {
                                                await handleSaveStudentProfile(e);
                                            }
                                            setIsEditing(false);
                                        }}
                                        disabled={saving}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '8px 16px', borderRadius: 10,
                                            background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
                                            border: 'none',
                                            color: '#fff', fontSize: 12, fontWeight: 700,
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        <Check size={14} />
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setReloadKey(k => k + 1);
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '8px 16px', borderRadius: 10,
                                            background: 'rgba(255,255,255,0.05)',
                                            border: `1px solid ${BORDER}`,
                                            color: TEXT, fontSize: 12, fontWeight: 600,
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        <X size={14} />
                                        Cancel
                                    </button>
                                </>
                            )
                        )}
                        <button
                            onClick={async () => { await logout(); navigate('/') }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 16px', borderRadius: 10,
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                color: '#f87171', fontSize: 12, fontWeight: 600,
                                cursor: 'pointer', flexShrink: 0,
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)' }}
                        >
                            <LogOut size={14} />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* 👑 ADMIN SPECIFIC PROFILE */}
                {userRole === 'admin' && (
                    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24, textAlign: 'center', color: MUTED }}>
                        <Shield size={40} color={RED} style={{ margin: '0 auto 12px' }} />
                        <h3 style={{ color: TEXT, fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>System Administrator Profile</h3>
                        <p style={{ fontSize: 13, maxWidth: 460, margin: '0 auto 14px', lineHeight: 1.6 }}>
                            You have root administrative privileges. Please use the Admin Dashboard in the sidebar to add real mentors, monitor API logs, inspect users, and manage cache parameters.
                        </p>
                        <a href="/admin" style={{ display: 'inline-block', background: 'rgba(239,68,68,0.15)', border: `1px solid ${RED}30`, color: '#fca5a5', padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                            Go to Admin Dashboard
                        </a>
                    </div>
                )}

                {/* 🎓 MENTOR SPECIFIC PROFILE FORM */}
                {userRole === 'mentor' && (
                    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <Briefcase size={18} color={ACCENT} />
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: 0 }}>Mentor Biography & Info</h3>
                        </div>
                        {!isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div style={{ padding: 14, background: 'rgba(255,255,255,0.01)', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
                                        <span style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Designation</span>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{mentorProfile.designation || 'Not specified'}</span>
                                    </div>
                                    <div style={{ padding: 14, background: 'rgba(255,255,255,0.01)', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
                                        <span style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Company / Organization</span>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{mentorProfile.company || 'Not specified'}</span>
                                    </div>
                                </div>
                                <div style={{ padding: 14, background: 'rgba(255,255,255,0.01)', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
                                    <span style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 8 }}>Skills</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {mentorProfile.skills ? mentorProfile.skills.split(',').map((skill, i) => (
                                            <span key={i} style={{
                                                fontSize: 11, padding: '4px 10px', borderRadius: 8,
                                                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                                                color: '#a5b4fc'
                                            }}>{skill.trim()}</span>
                                        )) : <span style={{ fontSize: 13, color: MUTED }}>No skills listed</span>}
                                    </div>
                                </div>
                                <div style={{ padding: 14, background: 'rgba(255,255,255,0.01)', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
                                    <span style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 6 }}>Professional Biography / Introduction</span>
                                    <p style={{ fontSize: 13, color: TEXT, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                        {mentorProfile.profileInfo || 'No biography written yet.'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveMentorProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Designation</label>
                                        <input value={mentorProfile.designation} onChange={e => setMentorProfile(p => ({ ...p, designation: e.target.value }))} placeholder="E.g. Senior Software Architect" style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${BORDER}`, borderRadius: 12, color: TEXT, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Company / Organization</label>
                                        <input value={mentorProfile.company} onChange={e => setMentorProfile(p => ({ ...p, company: e.target.value }))} placeholder="E.g. Microsoft" style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${BORDER}`, borderRadius: 12, color: TEXT, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Skills (comma-separated)</label>
                                    <input value={mentorProfile.skills} onChange={e => setMentorProfile(p => ({ ...p, skills: e.target.value }))} placeholder="E.g. React, Systems Design, Go, Python" style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${BORDER}`, borderRadius: 12, color: TEXT, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Professional Biography / Introduction</label>
                                    <textarea value={mentorProfile.profileInfo} onChange={e => setMentorProfile(p => ({ ...p, profileInfo: e.target.value }))} placeholder="Tell your mentees about your career journey, guidance areas, and background..." rows={5} style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${BORDER}`, borderRadius: 12, color: TEXT, fontSize: 13, outline: 'none', resize: 'vertical', lineHighlight: 1.6, boxSizing: 'border-box' }} />
                                </div>
                                <button type="submit" disabled={saving} style={{ padding: '12px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {saving && <RefreshCw size={14} className="animate-spin" />} Save Bio Details
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* 🎒 STUDENT SPECIFIC PROFILE FORM */}
                {userRole === 'student' && (
                    <form onSubmit={handleSaveStudentProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        
                        {/* Target Role Prefer */}
                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <Target size={18} color="#818cf8" />
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, margin: 0 }}>Career Goal Preference</h3>
                            </div>
                            {!isEditing ? (
                                <div style={{ padding: 14, background: 'rgba(255,255,255,0.01)', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
                                    <span style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Target Career Role</span>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{roleInput || 'Not specified'}</span>
                                </div>
                            ) : (
                                <div>
                                    <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 6 }}>What is your Target Career Role?</label>
                                    <input
                                        value={roleInput}
                                        onChange={e => setRoleInput(e.target.value)}
                                        placeholder="E.g. Full Stack Developer, Data Scientist..."
                                        style={{
                                            width: '100%', padding: '12px 16px',
                                            background: 'rgba(0,0,0,0.3)', border: `1px solid ${BORDER}`,
                                            borderRadius: 12, color: TEXT, fontSize: 13, outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* College Details */}
                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <GraduationCap size={18} color="#818cf8" />
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, margin: 0 }}>College / Educational Details</h3>
                            </div>
                            {!isEditing ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.01)', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
                                        <span style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>College / University Name</span>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{college.collegeName || 'Not specified'}</span>
                                    </div>
                                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.01)', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
                                        <span style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Degree & Major</span>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{college.degree || 'Not specified'}</span>
                                    </div>
                                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.01)', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
                                        <span style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Graduation Year</span>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{college.gradYear || 'Not specified'}</span>
                                    </div>
                                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.01)', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
                                        <span style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>GPA / Grade Percentage</span>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{college.gpa || 'Not specified'}</span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                                    <div>
                                        <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>College / University Name</label>
                                        <input value={college.collegeName} onChange={e => setCollege(c => ({ ...c, collegeName: e.target.value }))} placeholder="E.g. Stanford University" style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${BORDER}`, borderRadius: 12, color: TEXT, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Degree & Major</label>
                                        <input value={college.degree} onChange={e => setCollege(c => ({ ...c, degree: e.target.value }))} placeholder="E.g. B.S. in Computer Science" style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${BORDER}`, borderRadius: 12, color: TEXT, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Graduation Year</label>
                                        <input value={college.gradYear} onChange={e => setCollege(c => ({ ...c, gradYear: e.target.value }))} placeholder="E.g. 2026" style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${BORDER}`, borderRadius: 12, color: TEXT, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>GPA / Grade Percentage</label>
                                        <input value={college.gpa} onChange={e => setCollege(c => ({ ...c, gpa: e.target.value }))} placeholder="E.g. 3.8/4.0 or 85%" style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${BORDER}`, borderRadius: 12, color: TEXT, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Projects editor */}
                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <Award size={18} color="#818cf8" />
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, margin: 0 }}>Academic & Personal Projects</h3>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: isEditing && projects.length > 0 ? 16 : 0 }}>
                                {projects.map((proj, idx) => (
                                    <div key={idx} style={{ padding: 14, background: 'rgba(255,255,255,0.01)', border: `1px solid ${BORDER}`, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1, marginRight: 16 }}>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: '0 0 3px' }}>{proj.title}</p>
                                            <p style={{ fontSize: 12, color: MUTED, margin: '0 0 6px', lineHeight: 1.5 }}>{proj.description}</p>
                                            {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}><ExternalLink size={11} /> GitHub Link</a>}
                                        </div>
                                        {isEditing && (
                                            <button type="button" onClick={() => removeProject(idx)} style={{ background: 'transparent', border: 'none', color: RED, cursor: 'pointer' }}><Trash2 size={14} /></button>
                                        )}
                                    </div>
                                ))}
                                {projects.length === 0 && (
                                    <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>No projects listed.</p>
                                )}
                            </div>

                            {isEditing && (
                                <div style={{ background: 'rgba(0,0,0,0.15)', border: `1px dashed ${BORDER}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: TEXT, margin: 0 }}>Add New Project</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <input value={newProj.title} onChange={e => setNewProj(p => ({ ...p, title: e.target.value }))} placeholder="Project Title" style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12, outline: 'none' }} />
                                        <input value={newProj.github} onChange={e => setNewProj(p => ({ ...p, github: e.target.value }))} placeholder="GitHub Repository URL" style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12, outline: 'none' }} />
                                    </div>
                                    <input value={newProj.description} onChange={e => setNewProj(p => ({ ...p, description: e.target.value }))} placeholder="Project Description (technologies, scope, results)" style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12, outline: 'none' }} />
                                    <button type="button" onClick={addProject} style={{ padding: '7px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', border: `1px solid ${ACCENT}30`, color: '#a5b4fc', fontSize: 12, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={13} /> Add to List</button>
                                </div>
                            )}
                        </div>

                        {/* Certifications editor */}
                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <Award size={18} color="#818cf8" />
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, margin: 0 }}>Professional Certifications</h3>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: isEditing && certifications.length > 0 ? 16 : 0 }}>
                                {certifications.map((cert, idx) => (
                                    <div key={idx} style={{ padding: 12, background: 'rgba(255,255,255,0.01)', border: `1px solid ${BORDER}`, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1, marginRight: 16 }}>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>{cert.title}</p>
                                            <p style={{ fontSize: 12, color: MUTED, margin: '0 0 4px' }}>Platform: {cert.platform || 'N/A'}</p>
                                            {cert.link && <a href={cert.link} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}><ExternalLink size={11} /> Credential URL</a>}
                                        </div>
                                        {isEditing && (
                                            <button type="button" onClick={() => removeCertification(idx)} style={{ background: 'transparent', border: 'none', color: RED, cursor: 'pointer' }}><Trash2 size={14} /></button>
                                        )}
                                    </div>
                                ))}
                                {certifications.length === 0 && (
                                    <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>No certifications listed.</p>
                                )}
                            </div>

                            {isEditing && (
                                <div style={{ background: 'rgba(0,0,0,0.15)', border: `1px dashed ${BORDER}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: TEXT, margin: 0 }}>Add New Certification</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <input value={newCert.title} onChange={e => setNewCert(c => ({ ...c, title: e.target.value }))} placeholder="Certification Title (e.g. AWS Cloud Practitioner)" style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12, outline: 'none' }} />
                                        <input value={newCert.platform} onChange={e => setNewCert(c => ({ ...c, platform: e.target.value }))} placeholder="Platform / Provider (e.g. Coursera, Amazon)" style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12, outline: 'none' }} />
                                    </div>
                                    <input value={newCert.link} onChange={e => setNewCert(c => ({ ...c, link: e.target.value }))} placeholder="Verification Link URL" style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12, outline: 'none' }} />
                                    <button type="button" onClick={addCertification} style={{ padding: '7px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', border: `1px solid ${ACCENT}30`, color: '#a5b4fc', fontSize: 12, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={13} /> Add to List</button>
                                </div>
                            )}
                        </div>

                        {/* Internship Experience */}
                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <Briefcase size={18} color="#818cf8" />
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, margin: 0 }}>Internship & Work Experience</h3>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: isEditing && internships.length > 0 ? 16 : 0 }}>
                                {internships.map((intern, idx) => (
                                    <div key={idx} style={{ padding: 14, background: 'rgba(255,255,255,0.01)', border: `1px solid ${BORDER}`, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1, marginRight: 16 }}>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>{intern.role} · {intern.company}</p>
                                            <p style={{ fontSize: 11, color: ACCENT, fontWeight: 600, margin: '0 0 6px' }}>{intern.duration}</p>
                                            <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.5 }}>{intern.description}</p>
                                        </div>
                                        {isEditing && (
                                            <button type="button" onClick={() => removeInternship(idx)} style={{ background: 'transparent', border: 'none', color: RED, cursor: 'pointer' }}><Trash2 size={14} /></button>
                                        )}
                                    </div>
                                ))}
                                {internships.length === 0 && (
                                    <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>No work experience listed.</p>
                                )}
                            </div>

                            {isEditing && (
                                <div style={{ background: 'rgba(0,0,0,0.15)', border: `1px dashed ${BORDER}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: TEXT, margin: 0 }}>Add Work/Internship Record</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                        <input value={newIntern.company} onChange={e => setNewIntern(i => ({ ...i, company: e.target.value }))} placeholder="Company / Org Name" style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12, outline: 'none' }} />
                                        <input value={newIntern.role} onChange={e => setNewIntern(i => ({ ...i, role: e.target.value }))} placeholder="Role (e.g. Frontend Intern)" style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12, outline: 'none' }} />
                                        <input value={newIntern.duration} onChange={e => setNewIntern(i => ({ ...i, duration: e.target.value }))} placeholder="Duration (e.g. 3 Months)" style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12, outline: 'none' }} />
                                    </div>
                                    <input value={newIntern.description} onChange={e => setNewIntern(i => ({ ...i, description: e.target.value }))} placeholder="Describe your responsibilities, metrics, and outcomes..." style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12, outline: 'none' }} />
                                    <button type="button" onClick={addInternship} style={{ padding: '7px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', border: `1px solid ${ACCENT}30`, color: '#a5b4fc', fontSize: 12, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={13} /> Add to List</button>
                                </div>
                            )}
                        </div>

                        {/* Resume Status */}
                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <FileText size={18} color="#818cf8" />
                                    <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, margin: 0 }}>Resume & Extracted Data</h3>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {resumeText && (
                                        <button type="button" onClick={handleDownloadResume} style={{
                                            padding: '6px 12px', borderRadius: 8,
                                            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                                            color: '#a5b4fc', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 4
                                        }}>
                                            <Download size={12} /> Download PDF
                                        </button>
                                    )}
                                    {isEditing && resumeText && (
                                        <button type="button" onClick={handleClearData} style={{
                                            padding: '6px 12px', borderRadius: 8,
                                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                            color: '#f87171', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 4
                                        }}>
                                            <Trash2 size={12} /> Clear Resume Data
                                        </button>
                                    )}
                                </div>
                            </div>

                            {resumeText ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{
                                        background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)',
                                        borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10
                                    }}>
                                        <CheckCircle2 size={16} color="#4ade80" />
                                        <p style={{ color: '#d1fae5', fontSize: 13, margin: 0 }}>
                                            Your resume has been uploaded and analyzed. You're ready for mock interviews!
                                        </p>
                                    </div>

                                    {extractedSkills?.length > 0 && (
                                        <div>
                                            <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Award size={13} /> Extracted Skills ({extractedSkills.length})
                                            </p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                {extractedSkills.map(skill => (
                                                    <span key={skill} style={{
                                                        fontSize: 11, padding: '4px 10px', borderRadius: 8,
                                                        background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                                                        color: '#a5b4fc'
                                                    }}>{skill}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <button type="button" onClick={handleViewResume} style={{
                                            padding: '8px 16px', borderRadius: 10,
                                            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                                            color: '#a5b4fc', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                            display: 'inline-flex', alignItems: 'center', gap: 6
                                        }}>
                                            <ExternalLink size={14} /> View Resume PDF
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    textAlign: 'center', padding: '30px 10px',
                                    border: `1px dashed ${BORDER}`, borderRadius: 14,
                                    color: MUTED
                                }}>
                                    <p style={{ fontSize: 13, margin: '0 0 10px' }}>No resume uploaded yet</p>
                                    <a href="/dashboard/workflow" style={{
                                        display: 'inline-block', fontSize: 12, color: '#818cf8', fontWeight: 600,
                                        textDecoration: 'none', borderBottom: '1px solid #818cf8'
                                    }}>
                                        Go to Onboarding Workflow to upload one
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Save Button for Students */}
                        {isEditing && (
                            <button type="submit" disabled={saving} style={{
                                padding: '14px 28px', borderRadius: 14,
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: '0 8px 24px rgba(99,102,241,0.25)', transition: 'all 0.2s',
                                alignSelf: 'flex-end', marginTop: 10
                            }}>
                                {saving ? <RefreshCw size={16} className="animate-spin" /> : null}
                                Save All Profile Information
                            </button>
                        )}
                    </form>
                )}
            </div>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}

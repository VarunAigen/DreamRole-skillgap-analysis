import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { authFetch } from '../lib/api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
    const [resumeText, setResumeText] = useState('')
    const [resumePdfName, setResumePdfName] = useState('')
    const [extractedSkills, setExtractedSkills] = useState([])
    const [selectedRole, setSelectedRole] = useState('')
    const [analysisResult, setAnalysisResult] = useState(null)
    const [evaluationStatus, setEvaluationStatus] = useState('pending')
    const [profileLoaded, setProfileLoaded] = useState(false)

    // ── Load profile from MongoDB on first mount (after Firebase auth is ready) ──
    const loadProfile = useCallback(async () => {
        try {
            const res = await authFetch('/api/profile')
            if (!res.ok) return
            const { profile } = await res.json()
            if (!profile) return

            // Restore state only if current session is empty (don't overwrite active session)
            if (!resumeText && profile.resume_text)    setResumeText(profile.resume_text)
            if (!resumePdfName && profile.resume_pdf_name) setResumePdfName(profile.resume_pdf_name)
            if (!extractedSkills.length && profile.extracted_skills?.length)
                setExtractedSkills(profile.extracted_skills)
            if (!selectedRole && profile.selected_role) setSelectedRole(profile.selected_role)
        } catch (err) {
            // Non-fatal — app works without the profile
            console.warn('[AppContext] Profile load failed:', err.message)
        } finally {
            setProfileLoaded(true)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        loadProfile()
    }, [loadProfile])

    // ── Debounced helper to PATCH profile fields ──────────────────────────────
    const saveTimerRef = useRef(null)

    const saveProfileFields = useCallback((fields) => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(async () => {
            try {
                await authFetch('/api/profile', {
                    method: 'PATCH',
                    body: JSON.stringify(fields)
                })
            } catch (err) {
                console.warn('[AppContext] Profile save failed:', err.message)
            }
        }, 800) // wait 800ms after last change before sending
    }, [])

    // ── Wrapped setters that persist to MongoDB automatically ─────────────────
    const setResumeTextPersisted = useCallback((text) => {
        setResumeText(text)
        if (profileLoaded) saveProfileFields({ resume_text: text })
    }, [profileLoaded, saveProfileFields])

    const setExtractedSkillsPersisted = useCallback((skills) => {
        setExtractedSkills(skills)
        if (profileLoaded) saveProfileFields({ extracted_skills: skills })
    }, [profileLoaded, saveProfileFields])

    const setSelectedRolePersisted = useCallback((role) => {
        setSelectedRole(role)
        if (profileLoaded) saveProfileFields({ selected_role: role })
    }, [profileLoaded, saveProfileFields])

    // ── Clear session ─────────────────────────────────────────────────────────
    const clearSession = useCallback(async () => {
        setResumeText('')
        setResumePdfName('')
        setExtractedSkills([])
        setSelectedRole('')
        setAnalysisResult(null)
        setEvaluationStatus('pending')
        try {
            await authFetch('/api/profile/clear', { method: 'DELETE' })
        } catch (err) {
            console.warn('[AppContext] Profile clear failed:', err.message)
        }
    }, [])

    return (
        <AppContext.Provider value={{
            resumeText,      setResumeText: setResumeTextPersisted,
            resumePdfName,   setResumePdfName,
            extractedSkills, setExtractedSkills: setExtractedSkillsPersisted,
            selectedRole,    setSelectedRole: setSelectedRolePersisted,
            analysisResult,  setAnalysisResult,
            evaluationStatus, setEvaluationStatus,
            profileLoaded,
            clearSession
        }}>
            {children}
        </AppContext.Provider>
    )
}

export function useApp() {
    const ctx = useContext(AppContext)
    if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
    return ctx
}

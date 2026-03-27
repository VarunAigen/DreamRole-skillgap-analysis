import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
    const [resumeText, setResumeText] = useState('')
    const [extractedSkills, setExtractedSkills] = useState([])
    const [selectedRole, setSelectedRole] = useState('')
    const [analysisResult, setAnalysisResult] = useState(null)
    // analysisResult shape:
    // { matched_skills, missing_skills, alignment_stage, feedback, projects, certifications }

    const clearSession = () => {
        setResumeText('')
        setExtractedSkills([])
        setSelectedRole('')
        setAnalysisResult(null)
    }

    return (
        <AppContext.Provider value={{
            resumeText, setResumeText,
            extractedSkills, setExtractedSkills,
            selectedRole, setSelectedRole,
            analysisResult, setAnalysisResult,
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

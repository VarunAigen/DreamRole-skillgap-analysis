import { useState, useEffect, useRef } from 'react'
import { authFetch } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import SkillList from '../components/SkillList'
import { ArrowRight, AlertCircle, CheckCircle2, Loader, MessageSquare, X, BarChart, Route } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function SkillGapPage() {
  const navigate = useNavigate()
  const { extractedSkills, selectedRole, analysisResult, setAnalysisResult, resumeText, setEvaluationStatus } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSkipModal, setShowSkipModal] = useState(false)

  const analysisCalledRef = useRef(false)
  useEffect(() => {
    if (!analysisResult && !analysisCalledRef.current && extractedSkills.length > 0 && selectedRole) {
      analysisCalledRef.current = true
      runAnalysis()
    }
  }, [])

  const runAnalysis = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_skills: extractedSkills,
          role: selectedRole,
          resume_text: resumeText,
          user_id: 'user_' + Date.now()
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setAnalysisResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSkipSelect = async (destinationPath) => {
    setEvaluationStatus('skipped')
    
    // Save progress as skipped before navigating
    try {
      // Mock passing auth token since user handles it contextually or via cookies natively 
      // in previous refactors. Assuming standard fetch is fine as it uses credentials or JWT wrapper elsewhere.
      await authFetch('/api/progress', {
        method: 'POST',
        body: JSON.stringify({
          role: selectedRole,
          alignment_stage: analysisResult?.alignment_stage,
          missing_skills: analysisResult?.missing_skills,
          matched_skills: analysisResult?.matched_skills,
          evaluation_status: 'skipped'
        })
      });
    } catch (err) {
      console.warn("Failed to register skip status, proceeding anyway:", err);
    }
    
    navigate(destinationPath)
  }

  if (!extractedSkills.length || !selectedRole) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="section-heading">Skill Gap Analysis</h1>
        <div className="card text-center space-y-3">
          <p className="text-white/60">Please complete the resume upload and role selection first.</p>
          <button onClick={() => navigate('/dashboard/resume')} className="btn-primary mx-auto">Go to Resume Upload</button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto card flex items-center gap-3 text-indigo-400">
        <Loader size={20} className="animate-spin" />
        <span className="text-sm font-medium">Analyzing your skill gap with AI...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="section-heading">Skill Gap Analysis</h1>
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>
        <button onClick={runAnalysis} className="btn-primary">Try Again</button>
      </div>
    )
  }

  if (!analysisResult) return null

  const { matched_skills = [], missing_skills = [], alignment_stage = 'Developing Stage', feedback = '', weak_areas = [], resume_improvements = [] } = analysisResult

  const stageColors = {
    'Foundation Stage': 'bg-amber-100 text-amber-800',
    'Developing Stage': 'bg-blue-100 text-blue-800',
    'Skilled Stage': 'bg-purple-100 text-purple-800',
    'Role Ready Stage': 'bg-emerald-100 text-emerald-800'
  }
  const badgeClass = stageColors[alignment_stage] || 'bg-blue-100 text-blue-800'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="section-heading">Skill Gap Analysis</h1>
        <p className="section-sub">Comparing your resume skills against <strong>{selectedRole}</strong> requirements.</p>
      </div>

      {/* Alignment Stage */}
      <div className="card bg-gradient-to-br from-brand-50 to-white border-indigo-500/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-white/60">Dream Role Skill Alignment</p>
            <p className="text-lg font-bold text-indigo-300 mt-1">{selectedRole}</p>
          </div>
          <span className={`badge text-sm px-4 py-2 rounded-full font-bold ${badgeClass}`}>
            {alignment_stage}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center mt-2">
          <div className="p-3 bg-transparent rounded-xl border border-white/[0.06]">
            <p className="text-xl font-bold text-emerald-400">{matched_skills?.length || 0}</p>
            <p className="text-xs text-white/40 mt-0.5">Matched</p>
          </div>
          <div className="p-3 bg-transparent rounded-xl border border-white/[0.06]">
            <p className="text-xl font-bold text-red-400">{missing_skills?.length || 0}</p>
            <p className="text-xs text-white/40 mt-0.5">Missing</p>
          </div>
          <div className="p-3 bg-transparent rounded-xl border border-white/[0.06]">
            <p className="text-xl font-bold text-white/80">{analysisResult.total_required || 0}</p>
            <p className="text-xs text-white/40 mt-0.5">Required Total</p>
          </div>
        </div>
      </div>

      {/* AI Feedback */}
      {feedback && (
        <div className="card space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={16} className="text-indigo-400" />
              <h3 className="font-semibold text-white/80 text-sm">AI Analysis</h3>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">{feedback}</p>
          </div>
          
          {weak_areas && weak_areas.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-white/80 mb-2">Focus Areas</h4>
              <div className="flex flex-wrap gap-2">
                {weak_areas.map((area, i) => (
                  <span key={i} className="px-3 py-1 bg-amber-500/10 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {resume_improvements && resume_improvements.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-white/80 mb-2">Actionable Resume Improvements</h4>
              <ul className="text-sm text-white/60 space-y-1.5 pl-4 list-disc marker:text-brand-400">
                {resume_improvements.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Categorized Skill Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white/90">Detailed Skill Breakdown</h2>
        {analysisResult.category_breakdown && Object.keys(analysisResult.category_breakdown).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(analysisResult.category_breakdown).map(([catKey, data]) => {
              if (!data || data.total === 0) return null;
              
              const catLabels = {
                core_skills: "Core Skills",
                programming_languages: "Languages",
                frameworks_and_libraries: "Frameworks",
                tools_and_technologies: "Tools",
                platforms_and_cloud: "Cloud & Platforms",
                methodologies_and_practices: "Methodologies",
                soft_skills: "Soft Skills"
              };
              
              const label = catLabels[catKey] || catKey;
              
              return (
                <div key={catKey} className="card p-5 space-y-4">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-white/80 text-sm">{label}</h3>
                    <span className="text-xs font-semibold text-white/40">{data.matched || 0} / {data.total || 0}</span>
                  </div>
                  
                  <div className="w-full rounded-full h-1.5 bg-white/5">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${data.percentage || 0}%` }}></div>
                  </div>
                  
                  <div className="space-y-2 mt-3">
                    {data.matched_skills && data.matched_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {data.matched_skills.map((s, i) => (
                          <span key={`match-${i}`} className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                            <CheckCircle2 size={10} /> {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {data.missing_skills && data.missing_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {data.missing_skills.map((s, i) => (
                          <span key={`miss-${i}`} className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-medium flex items-center gap-1">
                            <X size={10} /> {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <h3 className="font-semibold text-white/80 text-sm">Matched Skills</h3>
                <span className="ml-auto text-xs font-bold text-emerald-400">{matched_skills?.length || 0}</span>
              </div>
              <SkillList skills={matched_skills} variant="matched" />
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={18} className="text-red-400" />
                <h3 className="font-semibold text-white/80 text-sm">Missing Skills</h3>
                <span className="ml-auto text-xs font-bold text-red-400">{missing_skills?.length || 0}</span>
              </div>
              <SkillList skills={missing_skills} variant="missing" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => navigate('/dashboard/test')} className="btn-primary flex-1 justify-center">
          Take Evaluation Test <ArrowRight size={16} />
        </button>
        <button onClick={() => navigate('/dashboard/roadmap')} className="btn-secondary flex-1 justify-center">
          View Improvement Roadmap
        </button>
      </div>
    </div>
  )
}

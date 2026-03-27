import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SkillList from '../components/SkillList'
import { ArrowRight, AlertCircle, CheckCircle2, Loader, MessageSquare } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function SkillGapPage() {
  const navigate = useNavigate()
  const { extractedSkills, selectedRole, analysisResult, setAnalysisResult, resumeText } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!analysisResult && extractedSkills.length > 0 && selectedRole) {
      runAnalysis()
    }
  }, [])

  const runAnalysis = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/analysis', {
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

  if (!extractedSkills.length || !selectedRole) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="section-heading">Skill Gap Analysis</h1>
        <div className="card text-center space-y-3">
          <p className="text-slate-600">Please complete the resume upload and role selection first.</p>
          <button onClick={() => navigate('/dashboard/resume')} className="btn-primary mx-auto">Go to Resume Upload</button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto card flex items-center gap-3 text-brand-600">
        <Loader size={20} className="animate-spin" />
        <span className="text-sm font-medium">Analyzing your skill gap with AI...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="section-heading">Skill Gap Analysis</h1>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        <button onClick={runAnalysis} className="btn-primary">Try Again</button>
      </div>
    )
  }

  if (!analysisResult) return null

  const { matched_skills, missing_skills, alignment_stage, feedback, weak_areas, resume_improvements } = analysisResult

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
      <div className="card bg-gradient-to-br from-brand-50 to-white border-brand-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-slate-600">Dream Role Skill Alignment</p>
            <p className="text-lg font-bold text-brand-700 mt-1">{selectedRole}</p>
          </div>
          <span className={`badge text-sm px-4 py-2 rounded-full font-bold ${badgeClass}`}>
            {alignment_stage}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center mt-2">
          <div className="p-3 bg-white rounded-xl border border-surface-200">
            <p className="text-xl font-bold text-emerald-600">{matched_skills.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Matched</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-surface-200">
            <p className="text-xl font-bold text-red-500">{missing_skills.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Missing</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-surface-200">
            <p className="text-xl font-bold text-slate-700">{analysisResult.total_required}</p>
            <p className="text-xs text-slate-500 mt-0.5">Required Total</p>
          </div>
        </div>
      </div>

      {/* AI Feedback */}
      {feedback && (
        <div className="card space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={16} className="text-brand-600" />
              <h3 className="font-semibold text-slate-700 text-sm">AI Analysis</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{feedback}</p>
          </div>
          
          {weak_areas && weak_areas.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Focus Areas</h4>
              <div className="flex flex-wrap gap-2">
                {weak_areas.map((area, i) => (
                  <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {resume_improvements && resume_improvements.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Actionable Resume Improvements</h4>
              <ul className="text-sm text-slate-600 space-y-1.5 pl-4 list-disc marker:text-brand-400">
                {resume_improvements.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Two-column skill comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <h3 className="font-semibold text-slate-700 text-sm">Matched Skills</h3>
            <span className="ml-auto text-xs font-bold text-emerald-600">{matched_skills.length}</span>
          </div>
          <SkillList skills={matched_skills} variant="matched" />
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={18} className="text-red-400" />
            <h3 className="font-semibold text-slate-700 text-sm">Missing Skills</h3>
            <span className="ml-auto text-xs font-bold text-red-500">{missing_skills.length}</span>
          </div>
          <SkillList skills={missing_skills} variant="missing" />
        </div>
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

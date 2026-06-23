import { useState, useEffect, useRef } from 'react'
import { authFetch } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, Target, Cpu, Target as TargetIcon, ArrowRight, ArrowLeft, ChevronDown, CheckCircle2, AlertCircle, Loader, Trophy, MessageSquare, Lightbulb, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import UploadBox from '../components/UploadBox'
import SkillList from '../components/SkillList'
import TestQuestion from '../components/TestQuestion'

const STEPS = [
  { id: 'upload', title: 'Upload Resume', icon: UploadCloud },
  { id: 'role', title: 'Select Dream Role', icon: Target },
  { id: 'extract', title: 'Extracted Skills', icon: Cpu },
  { id: 'gap', title: 'Skill Gap', icon: TargetIcon },
  { id: 'test', title: 'Evaluation Test', icon: CheckCircle2 },
]

export default function WorkflowPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState([])
  const { resumeText, setResumeText, resumePdfName, setResumePdfName, extractedSkills, setExtractedSkills, selectedRole, setSelectedRole, analysisResult, setAnalysisResult } = useApp()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Attempt to recover step based on state
    if (!resumeText) setCurrentStep(0)
    else if (!selectedRole && !analysisResult) setCurrentStep(1)
    else if (extractedSkills.length > 0 && !analysisResult) setCurrentStep(2) // although usually we jump to gap if role presents
    else if (analysisResult) setCurrentStep(3)
  }, [])

  const markStepComplete = (idx) => {
    if (!completedSteps.includes(idx)) {
      setCompletedSteps([...completedSteps, idx])
    }
  }

  const goNext = () => {
    markStepComplete(currentStep)
    setCurrentStep(c => Math.min(STEPS.length - 1, c + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setCurrentStep(c => Math.max(0, c - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Stepper */}
      <div className="bg-transparent w-full px-12 min-h-[220px] flex flex-col justify-center rounded-2xl border border-gray-200 shadow-md mb-6">
        <h1 className="text-xl font-bold text-white mb-2">Your Career Journey</h1>
        <p className="text-sm text-white/40 mb-6">Complete these steps to get your personalized roadmap.</p>

        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/[0.04] -translate-y-1/2 rounded-full z-0"></div>
          {STEPS.map((step, idx) => {
            const Icon = step.icon
            const isCompleted = completedSteps.includes(idx) || currentStep > idx
            const isActive = currentStep === idx

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-brand-600 text-white shadow-lg scale-110 ring-4 ring-brand-100' :
                  isCompleted ? 'bg-emerald-500/100 text-white' : 'bg-white/[0.06] text-white/30'
                  }`}>
                  {isCompleted && !isActive ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                </div>
                <span className={`text-xs font-semibold hidden sm:block absolute -bottom-6 w-32 text-center ${isActive ? 'text-indigo-300' : isCompleted ? 'text-white/60' : 'text-white/30'
                  }`}>
                  {step.title}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content Content */}
      <div className="min-h-[400px]">
        {currentStep === 0 && <StepUpload goNext={goNext} setResumeText={setResumeText} setResumePdfName={setResumePdfName} setExtractedSkills={setExtractedSkills} extractedSkills={extractedSkills} />}
        {currentStep === 1 && <StepRole goNext={goNext} selectedRole={selectedRole} setSelectedRole={setSelectedRole} goBack={goBack} />}
        {currentStep === 2 && <StepExtraction goNext={goNext} extractedSkills={extractedSkills} goBack={goBack} />}
        {currentStep === 3 && <StepGap goNext={goNext} goBack={goBack} />}
        {currentStep === 4 && <StepTest goBack={goBack} />}
      </div>
    </div>
  )
}

// ==================== STEP 1 ====================
function StepUpload({ goNext, setResumeText, setResumePdfName, setExtractedSkills, extractedSkills }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('resume', file)
      const uploadRes = await authFetch('/api/resume/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed')
      setResumeText(uploadData.resume_text)
      setResumePdfName(uploadData.filename)

      const skillRes = await authFetch('/api/skills/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: uploadData.resume_text })
      })
      const skillData = await skillRes.json()
      if (!skillRes.ok) throw new Error(skillData.error || 'Skill extraction failed')
      setExtractedSkills(skillData.skills)
      goNext()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">Upload Your Resume</h2>
        <p className="text-white/40 text-sm mt-1">We'll use AI to quickly extract your current skills.</p>
      </div>

      <UploadBox
        file={file}
        onFileAccepted={setFile}
        onClear={() => { setFile(null); setExtractedSkills([]); setResumeText('') }}
      />

      {error && <div className="p-3 bg-red-500/10 text-red-400 rounded-xl text-sm">{error}</div>}

      {loading && (
        <div className="flex items-center gap-3 text-indigo-400 p-4 bg-indigo-500/10 rounded-xl justify-center">
          <Loader size={20} className="animate-spin" />
          <span className="text-sm font-semibold">Extracting skills with AI...</span>
        </div>
      )}

      {file && !loading && (
        <div className="flex justify-end">
          <button onClick={handleAnalyze} className="btn-primary w-full sm:w-auto">
            Extract Skills <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

// ==================== STEP 2 ====================
function StepRole({ goNext, selectedRole, setSelectedRole, goBack }) {
  const [domains, setDomains] = useState([])
  const [rolesByDomain, setRolesByDomain] = useState({})
  const [selectedDomain, setSelectedDomain] = useState('')
  const [localRole, setLocalRole] = useState(selectedRole || '')
  const [custom, setCustom] = useState('')
  const [loading, setLoading] = useState(true)

  const finalRole = custom.trim() || localRole

  useEffect(() => {
    authFetch('/api/recommendations?grouped=true')
      .then(r => r.json())
      .then(data => {
        if (data.domains) setDomains(data.domains)
        if (data.rolesByDomain) setRolesByDomain(data.rolesByDomain)
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const handleProceed = () => {
    if (!finalRole) return
    setSelectedRole(finalRole)
    goNext()
  }

  const availableRoles = selectedDomain && rolesByDomain[selectedDomain] ? rolesByDomain[selectedDomain] : []

  return (
    <div className="card space-y-5 animate-fade-in max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">Select Dream Role</h2>
        <p className="text-white/40 text-sm mt-1">What position are you aiming for?</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white/80 mb-2">1. Select Domain</label>
        <div className="relative">
          <select
            value={selectedDomain}
            onChange={(e) => { setSelectedDomain(e.target.value); setLocalRole(''); setCustom(''); }}
            className="input-field appearance-none pr-10"
            disabled={loading}
          >
            <option value="">-- Choose a Domain --</option>
            {domains.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white/80 mb-2">2. Choose Role</label>
        <div className="relative">
          <select
            value={localRole}
            onChange={(e) => { setLocalRole(e.target.value); setCustom('') }}
            className="input-field appearance-none pr-10"
            disabled={!selectedDomain || loading}
          >
            <option value="">-- Choose a Role --</option>
            {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-xs text-white/30 font-medium tracking-widest">OR</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-white/80 mb-2">Custom Role</label>
        <input
          type="text"
          placeholder="e.g. Prompt Engineer"
          className="input-field"
          value={custom}
          onChange={(e) => { setCustom(e.target.value); setLocalRole(''); setSelectedDomain('') }}
        />
      </div>

      <div className="flex justify-between mt-6 pt-4 border-t border-white/[0.04]">
        <button onClick={goBack} className="btn-ghost text-white/40 hover:text-white/80"><ArrowLeft size={16} /> Back</button>
        <button onClick={handleProceed} disabled={!finalRole} className={`btn-primary ${!finalRole ? 'opacity-50' : ''}`}>
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ==================== STEP 3 ====================
function StepExtraction({ goNext, extractedSkills, goBack }) {
  return (
    <div className="card space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
        <Cpu size={24} className="text-indigo-400" />
        <div>
          <p className="font-semibold text-brand-800">AI Extraction Complete</p>
          <p className="text-sm text-indigo-400">We found {extractedSkills.length} relevant skills from your resume.</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Detected Skills</p>
        <SkillList skills={extractedSkills} variant="default" />
      </div>

      <div className="p-4 bg-amber-500/10 rounded-xl flex items-start gap-3">
        <Lightbulb size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-700">Next, we'll match these against your Dream Role requirements to identify your skill gaps.</p>
      </div>

      <div className="flex justify-between mt-6 pt-4 border-t border-white/[0.04]">
        <button onClick={goBack} className="btn-ghost text-white/40 hover:text-white/80"><ArrowLeft size={16} /> Back</button>
        <button onClick={goNext} className="btn-primary">Analyze Gap <ArrowRight size={16} /></button>
      </div>
    </div>
  )
}

// ==================== STEP 4 ====================
function StepGap({ goNext, goBack }) {
  const { extractedSkills, selectedRole, analysisResult, setAnalysisResult, resumeText } = useApp()
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const runCalled = useRef(false)
  useEffect(() => {
    if (!analysisResult && !runCalled.current) {
      runCalled.current = true
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
          user_id: currentUser?.uid || 'anonymous'
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

  if (loading || !analysisResult) {
    return (
      <div className="max-w-2xl mx-auto card flex items-center justify-center py-12 text-indigo-400 gap-3">
        <Loader size={24} className="animate-spin" />
        <span className="font-semibold">Analyzing your skill gap...</span>
      </div>
    )
  }

  const { matched_skills = [], missing_skills = [], alignment_stage = 'Developing Stage', feedback = '' } = analysisResult
  const badgeClass = {
    'Foundation Stage': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    'Developing Stage': 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    'Skilled Stage': 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    'Role Ready Stage': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
  }[alignment_stage] || 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card bg-gradient-to-br from-white/[0.02] to-white/[0.01]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <div>
            <p className="text-sm font-semibold text-white/60">Alignment: {selectedRole}</p>
          </div>
          <span className={`badge text-sm px-4 py-1.5 font-bold ${badgeClass}`}>{alignment_stage}</span>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center mt-4">
          <div className="p-3 bg-transparent rounded-xl shadow-sm border border-white/[0.06]">
            <p className="text-2xl font-bold text-emerald-400">{matched_skills?.length || 0}</p>
            <p className="text-xs text-white/40 mt-1">Matched</p>
          </div>
          <div className="p-3 bg-transparent rounded-xl shadow-sm border border-white/[0.06]">
            <p className="text-2xl font-bold text-red-400">{missing_skills?.length || 0}</p>
            <p className="text-xs text-white/40 mt-1">Missing</p>
          </div>
          <div className="p-3 bg-transparent rounded-xl shadow-sm border border-white/[0.06]">
            <p className="text-2xl font-bold text-white/80">{analysisResult.total_required || 0}</p>
            <p className="text-xs text-white/40 mt-1">Required</p>
          </div>
        </div>
      </div>

      {/* Categorized Skill Breakdown */}
      <div className="space-y-4">
        <h3 className="font-bold text-white/90 text-sm mb-3">Detailed Skill Breakdown</h3>
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
                <div key={catKey} className="card p-4 space-y-3 shadow-sm bg-white/[0.01]">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-white/80 text-sm">{label}</h3>
                    <span className="text-xs font-semibold text-white/40">{data.matched || 0} / {data.total || 0}</span>
                  </div>
                  
                  <div className="w-full rounded-full h-1 bg-white/5">
                    <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${data.percentage || 0}%` }}></div>
                  </div>
                  
                  <div className="space-y-1.5 mt-2">
                    {data.matched_skills && data.matched_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {data.matched_skills.map((s, i) => (
                          <span key={`match-${i}`} className="px-1.5 py-0.5 rounded border border-emerald-500/20 text-emerald-400 text-[10px] font-medium flex items-center gap-1 bg-emerald-500/10">
                            <CheckCircle2 size={8} /> {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {data.missing_skills && data.missing_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {data.missing_skills.map((s, i) => (
                          <span key={`miss-${i}`} className="px-1.5 py-0.5 rounded border border-red-500/20 text-red-400 text-[10px] font-medium flex items-center gap-1 bg-red-500/10">
                            <X size={8} /> {s}
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
            <div className="card shadow-sm bg-white/[0.01]">
              <h3 className="font-bold text-emerald-400 text-sm mb-3 flex items-center gap-2"><CheckCircle2 size={16} /> Matched Skills</h3>
              <SkillList skills={matched_skills} variant="matched" />
            </div>
            <div className="card shadow-sm bg-white/[0.01]">
              <h3 className="font-bold text-red-400 text-sm mb-3 flex items-center gap-2"><AlertCircle size={16} /> Missing Skills</h3>
              <SkillList skills={missing_skills} variant="missing" />
            </div>
          </div>
        )}
      </div>

      <div className="card space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2"><MessageSquare size={16} className="text-indigo-400" /> AI Feedback</h3>
        <p className="text-sm text-white/60">{feedback}</p>
      </div>

      <div className="flex justify-between mt-6 pt-4 border-t border-white/[0.06]">
        <button onClick={goBack} className="btn-ghost text-white/40"><ArrowLeft size={16} /> Back</button>
        <button onClick={goNext} className="btn-primary">Evaluation Test <ArrowRight size={16} /></button>
      </div>
    </div>
  )
}

// ==================== STEP 5 ====================
function StepTest({ goBack }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const { selectedRole, analysisResult, resumeText } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    authFetch('/api/test/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: selectedRole || 'General',
        missing_skills: analysisResult?.missing_skills || [],
        resume_text: resumeText,
        count: 5
      })
    })
      .then(r => r.json())
      .then(data => {
        if (data.questions?.length > 0) setQuestions(data.questions)
        else throw new Error('No questions returned')
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="card max-w-2xl mx-auto flex justify-center text-indigo-400 py-12"><Loader size={24} className="animate-spin" /></div>
  if (error) return <div className="card max-w-2xl mx-auto text-red-400">{error}</div>

  if (submitted) {
    const score = questions.reduce((acc, q, i) => acc + (answers[i] !== undefined && q.options[answers[i]] === q.correct_answer ? 1 : 0), 0)
    return (
      <div className="card max-w-lg mx-auto text-center space-y-6 animate-fade-in shadow-md">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
          <Trophy size={36} className="text-amber-300" />
        </div>
        <h2 className="text-2xl font-bold text-white">Test Complete!</h2>
        <div className="p-6 bg-transparent rounded-2xl border border-white/[0.06]">
          <p className="text-5xl font-extrabold text-indigo-400">{score}<span className="text-2xl text-white/30">/{questions.length}</span></p>
          <p className="text-sm font-semibold text-white/40 mt-2">Questions Correct</p>
        </div>
        <button onClick={() => navigate('/dashboard/roadmap')} className="btn-primary w-full justify-center shadow-lg hover:-translate-y-0.5 transition-all">
          View Improvement Roadmap <ArrowRight size={18} />
        </button>
      </div>
    )
  }

  const currentQ = questions[current]
  return (
    <div className="card max-w-2xl mx-auto space-y-6 animate-fade-in shadow-sm">
      <div className="flex justify-between items-center mb-6 border-b border-white/[0.04] pb-4">
        <h3 className="font-bold text-white">Question {current + 1} of {questions.length}</h3>
        <span className="badge-brand">{selectedRole}</span>
      </div>

      <TestQuestion
        question={currentQ.question}
        options={currentQ.options}
        selected={answers[current]}
        onSelect={(optIdx) => setAnswers({ ...answers, [current]: optIdx })}
        index={current}
      />

      <div className="flex justify-between pt-6 mt-4 border-t border-white/[0.04]">
        <button onClick={() => setCurrent(c => c - 1)} disabled={current === 0} className={`btn-ghost ${current === 0 ? 'opacity-40' : ''}`}><ArrowLeft size={16} /> Prev</button>
        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent(c => c + 1)} className="btn-primary">Next <ArrowRight size={16} /></button>
        ) : (
          <button onClick={() => setSubmitted(true)} className="btn-primary bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 size={16} /> Submit</button>
        )}
      </div>
    </div>
  )
}

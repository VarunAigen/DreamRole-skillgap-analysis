import { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, FileText, Briefcase, Award, FolderHeart, Loader, Upload, Type, ShieldCheck, ShieldAlert, ShieldQuestion, Target, Lightbulb, TrendingUp } from 'lucide-react'
import UploadBox from '../components/UploadBox'
import { authFetch } from '../lib/api'

const statusConfig = {
  met: { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: ShieldCheck, label: 'MET' },
  not_met: { color: 'bg-red-500/15 text-red-400 border-red-500/20', icon: ShieldAlert, label: 'NOT MET' },
  unclear: { color: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: ShieldQuestion, label: 'UNCLEAR' }
}

const likelihoodConfig = {
  high: { color: 'bg-emerald-500/20 text-emerald-400', label: 'High Chance' },
  medium: { color: 'bg-amber-500/20 text-amber-400', label: 'Medium Chance' },
  low: { color: 'bg-red-500/20 text-red-400', label: 'Low Chance' }
}

export default function JdAnalyzerPage() {
  const [file, setFile] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [jdText, setJdText] = useState('')
  const [jdFile, setJdFile] = useState(null)
  const [jdMode, setJdMode] = useState('paste')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isExtractingJd, setIsExtractingJd] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => { fetchHistory() }, [])

  const fetchHistory = async () => {
    try {
      const res = await authFetch('/api/jd/history')
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history || [])
      }
    } catch (err) { console.error('Failed to fetch JD history:', err) }
  }

  const loadHistoryItem = async (id) => {
    try {
      setIsAnalyzing(true)
      const res = await authFetch(`/api/jd/${id}`)
      if (res.ok) {
        const data = await res.json()
        setResult(data.analysis)
        setJdText(data.analysis.jd_text)
      }
    } catch (err) { console.error(err) }
    finally { setIsAnalyzing(false) }
  }

  const handleFileUpload = async (acceptedFile) => {
    setFile(acceptedFile)
    setIsExtracting(true)
    setError('')
    const formData = new FormData()
    formData.append('resume', acceptedFile)
    try {
      const res = await authFetch('/api/resume/upload?sessionOnly=true', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to extract resume text')
      setResumeText(data.resume_text)
    } catch (err) { setError(err.message); setFile(null) }
    finally { setIsExtracting(false) }
  }

  const handleJdFileUpload = async (acceptedFile) => {
    setJdFile(acceptedFile)
    setIsExtractingJd(true)
    setError('')
    const formData = new FormData()
    formData.append('resume', acceptedFile)
    try {
      const res = await authFetch('/api/resume/upload?sessionOnly=true', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to extract JD text')
      setJdText(data.resume_text)
    } catch (err) { setError(err.message); setJdFile(null) }
    finally { setIsExtractingJd(false) }
  }

  const handleAnalyze = async () => {
    if (!resumeText) { setError('Please upload a resume first'); return }
    if (!jdText.trim()) { setError('Please provide a job description'); return }
    setIsAnalyzing(true)
    setError('')
    setResult(null)
    try {
      const res = await authFetch('/api/jd/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text: jdText, resume_text: resumeText, job_title: 'Target Role', company_name: 'Target Company' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
      fetchHistory()
    } catch (err) { setError(err.message) }
    finally { setIsAnalyzing(false) }
  }

  const score = result?.overall_score ?? result?.match_score ?? 0
  const likelihood = likelihoodConfig[result?.shortlist_likelihood] || likelihoodConfig.medium

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">JD Gap Analyzer</h1>
        <p className="text-white/60 mt-2">Upload your resume and a job description to get an honest, rubric-based gap analysis with actionable next steps.</p>
      </div>

      {!result ? (
        <div className="space-y-6">
          {/* Upload & JD Input */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={18} className="text-indigo-400" />
                <h3 className="font-semibold text-white/90">Step 1: Upload Resume</h3>
              </div>
              {isExtracting ? (
                <div className="flex items-center justify-center p-12 bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
                  <div className="flex flex-col items-center gap-3">
                    <Loader className="animate-spin text-indigo-400" size={32} />
                    <p className="text-white/60 text-sm font-medium">Extracting resume text...</p>
                  </div>
                </div>
              ) : (
                <UploadBox file={file} onFileAccepted={handleFileUpload} onClear={() => { setFile(null); setResumeText('') }} />
              )}
            </div>

            <div className="card space-y-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Briefcase size={18} className="text-emerald-400" />
                  <h3 className="font-semibold text-white/90">Step 2: Job Description</h3>
                </div>
                <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <button onClick={() => setJdMode('paste')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${jdMode === 'paste' ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/40 hover:text-white/60'}`}>
                    <Type size={12} /> Paste
                  </button>
                  <button onClick={() => setJdMode('upload')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${jdMode === 'upload' ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/40 hover:text-white/60'}`}>
                    <Upload size={12} /> Upload
                  </button>
                </div>
              </div>
              {jdMode === 'paste' ? (
                <textarea className="w-full flex-1 min-h-[200px] p-4 bg-black/20 border border-white/10 rounded-xl text-white/80 placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 resize-none custom-scrollbar" placeholder="Paste the full job description here..." value={jdText} onChange={(e) => setJdText(e.target.value)} />
              ) : isExtractingJd ? (
                <div className="flex items-center justify-center p-12 bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
                  <div className="flex flex-col items-center gap-3">
                    <Loader className="animate-spin text-emerald-400" size={32} />
                    <p className="text-white/60 text-sm font-medium">Extracting JD text...</p>
                  </div>
                </div>
              ) : (
                <>
                  <UploadBox file={jdFile} onFileAccepted={handleJdFileUpload} onClear={() => { setJdFile(null); setJdText('') }} />
                  {jdText && jdFile && <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> JD text extracted</p>}
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={handleAnalyze} disabled={!resumeText || !jdText.trim() || isAnalyzing} className="btn-primary">
              {isAnalyzing ? (<><Loader size={18} className="animate-spin" /> Analyzing...</>) : 'Analyze Gap'}
            </button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="card space-y-4">
              <h3 className="text-sm font-bold text-white/90 flex items-center gap-2"><Briefcase size={16} className="text-indigo-400" /> Past Analyses</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {history.map((h, i) => {
                  const hScore = h.overall_score ?? h.match_score ?? 0
                  return (
                    <div key={i} onClick={() => loadHistoryItem(h._id)} className="p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] rounded-xl cursor-pointer transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-bold text-white/90 truncate pr-2">{h.company_name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold ${hScore >= 70 ? 'bg-emerald-500/20 text-emerald-400' : hScore >= 45 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                          {hScore}%
                        </span>
                      </div>
                      <p className="text-xs text-white/50 truncate">{h.job_title}</p>
                      <p className="text-[10px] text-white/30 mt-2">{new Date(h.createdAt).toLocaleDateString()}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => setResult(null)} className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 mb-2">
            ← Back to Input
          </button>

          {/* ═══ Score + Shortlist Verdict ═══ */}
          <div className="card bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border-indigo-500/20 flex flex-col sm:flex-row items-center gap-6 p-6">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444'} strokeWidth="3" strokeDasharray={`${score}, 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-white">{score}</span>
                <span className="text-[10px] text-white/40 font-semibold">/ 100</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-white">Gap Analysis Score</h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${likelihood.color}`}>{likelihood.label}</span>
              </div>
              <p className="text-white/60 text-sm">{result.shortlist_reasoning}</p>
              <p className="text-[10px] text-white/30 mt-2 italic">Scoring: Hard Reqs 40% · Core Tech 35% · Preferred 15% · Soft Skills 10%</p>
            </div>
          </div>

          {/* ═══ Hard Requirement Flags ═══ */}
          {result.hard_requirement_flags?.length > 0 && (
            <div className="card space-y-4">
              <h3 className="font-semibold text-white/90 flex items-center gap-2">
                <ShieldCheck size={16} className="text-indigo-400" /> Hard Requirement Check
              </h3>
              <div className="space-y-2">
                {result.hard_requirement_flags.map((flag, i) => {
                  const cfg = statusConfig[flag.status] || statusConfig.unclear
                  const Icon = cfg.icon
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.color}`}>
                      <Icon size={16} className="shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{flag.requirement}</p>
                          <span className="text-[10px] font-bold uppercase shrink-0">{cfg.label}</span>
                        </div>
                        {flag.note && <p className="text-xs opacity-70 mt-1">{flag.note}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ═══ Keyword Match Map ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched + Adjacent */}
            <div className="card space-y-4">
              <h3 className="font-semibold text-white/90 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" /> Matched Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.matched_keywords?.map((kw, i) => (
                  <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">{kw}</span>
                ))}
                {result.adjacent_matches?.map((am, i) => (
                  <span key={`adj-${i}`} className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/20" title={`${am.resume_term} → ${am.jd_term}: ${am.note}`}>
                    {am.resume_term} ≈ {am.jd_term}
                  </span>
                ))}
                {(!result.matched_keywords?.length && !result.adjacent_matches?.length) && (
                  <span className="text-sm text-white/50">No direct keyword matches found</span>
                )}
              </div>
            </div>

            {/* Missing */}
            <div className="card space-y-4">
              <h3 className="font-semibold text-white/90 flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-400" /> Missing Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missing_keywords?.map((kw, i) => (
                  <span key={i} className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-semibold rounded-full border border-red-500/20">{kw}</span>
                ))}
                {!result.missing_keywords?.length && <span className="text-sm text-white/50">No major gaps!</span>}
              </div>
            </div>
          </div>

          {/* ═══ Formatting Issues ═══ */}
          {result.formatting_issues?.length > 0 && (
            <div className="card space-y-4">
              <h3 className="font-semibold text-white/90 flex items-center gap-2">
                <FileText size={16} className="text-red-400" /> Formatting Issues
              </h3>
              <ul className="space-y-2 text-sm text-white/60">
                {result.formatting_issues.map((issue, i) => (
                  <li key={i} className="flex gap-2"><span className="text-red-400">•</span> {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ═══ Actionable Suggestions ═══ */}
          {result.actionable_suggestions?.length > 0 && (
            <div className="card space-y-4">
              <h3 className="font-semibold text-white/90 flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-400" /> Actionable Suggestions
              </h3>
              <div className="space-y-3">
                {result.actionable_suggestions.map((s, i) => (
                  <div key={i} className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 font-bold uppercase shrink-0 mt-0.5">
                        {(s.type || 'tip').replace(/_/g, ' ')}
                      </span>
                      <p className="text-sm text-white/80">{s.suggestion}</p>
                    </div>
                    {s.honesty_note && (
                      <p className="text-[11px] text-white/30 mt-2 italic pl-1">⚠ {s.honesty_note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Projects & Certifications ═══ */}
          {(result.projects?.length > 0 || result.certifications?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.projects?.length > 0 && (
                <div className="card space-y-4">
                  <h3 className="font-semibold text-white/90 flex items-center gap-2">
                    <FolderHeart size={16} className="text-indigo-400" /> Suggested Projects
                  </h3>
                  {result.projects.map((proj, i) => (
                    <div key={i} className="p-3 bg-black/20 rounded-lg border border-white/5">
                      <h4 className="text-sm font-bold text-white">{proj.title}</h4>
                      <p className="text-xs text-white/60 mt-1">{proj.description}</p>
                      {proj.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {proj.tags.map((t, j) => <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300">{t}</span>)}
                        </div>
                      )}
                      {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline mt-2 inline-block">View Reference →</a>}
                    </div>
                  ))}
                </div>
              )}
              {result.certifications?.length > 0 && (
                <div className="card space-y-4">
                  <h3 className="font-semibold text-white/90 flex items-center gap-2">
                    <Award size={16} className="text-amber-400" /> Recommended Certifications
                  </h3>
                  {result.certifications.map((cert, i) => (
                    <div key={i} className="p-3 bg-black/20 rounded-lg border border-white/5">
                      <h4 className="text-sm font-bold text-white">{cert.title}</h4>
                      <p className="text-xs text-white/60 mt-1">{cert.platform}</p>
                      {cert.link && <a href={cert.link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline mt-2 inline-block">View Course →</a>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

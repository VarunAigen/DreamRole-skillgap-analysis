import { useState } from 'react'
import { authFetch } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import UploadBox from '../components/UploadBox'
import SkillList from '../components/SkillList'
import { ArrowRight, Cpu, Loader } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function ResumeUploadPage() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { resumeText, setResumeText, extractedSkills, setExtractedSkills } = useApp()
  const navigate = useNavigate()

  const analyzed = extractedSkills.length > 0

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setError('')

    try {
      // Step 1: Upload resume
      const formData = new FormData()
      formData.append('resume', file)
      const uploadRes = await authFetch('/api/resume/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed')
      setResumeText(uploadData.resume_text)

      // Step 2: Extract skills
      const skillRes = await authFetch('/api/skills/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: uploadData.resume_text })
      })
      const skillData = await skillRes.json()
      if (!skillRes.ok) throw new Error(skillData.error || 'Skill extraction failed')
      setExtractedSkills(skillData.skills)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="section-heading">Resume Upload</h1>
        <p className="section-sub">Upload your PDF resume and we'll extract your skills automatically.</p>
      </div>

      <UploadBox
        file={file}
        onFileAccepted={setFile}
        onClear={() => { setFile(null); setExtractedSkills([]); setResumeText('') }}
      />

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>
      )}

      {file && !analyzed && !loading && (
        <div className="flex justify-end">
          <button onClick={handleAnalyze} className="btn-primary">
            <Cpu size={16} /> Parse Resume
          </button>
        </div>
      )}

      {loading && (
        <div className="card text-center space-y-4 animate-pulse-slow">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-500/25 border-t-brand-600 rounded-full animate-spin"></div>
              <Cpu size={24} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-400" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white">Processing Document...</h3>
            <p className="text-sm text-indigo-400 font-medium mt-1 animate-pulse">Running AI extraction model...</p>
          </div>
        </div>
      )}

      {analyzed && (
        <div className="card space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-emerald-400">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold">✓</div>
            <span className="text-sm font-semibold">Resume parsed successfully!</span>
          </div>

          <div>
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-3">Detected Skills ({extractedSkills.length})</p>
            <SkillList skills={extractedSkills} variant="matched" />
          </div>

          <button onClick={() => navigate('/dashboard/workflow')} className="btn-primary w-full justify-center">
            Proceed to Role Selection <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

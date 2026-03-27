import { useState } from 'react'
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
      const uploadRes = await fetch('/api/resume/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed')
      setResumeText(uploadData.resume_text)

      // Step 2: Extract skills
      const skillRes = await fetch('/api/skills/extract', {
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
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
      )}

      {file && !analyzed && !loading && (
        <div className="flex justify-end">
          <button onClick={handleAnalyze} className="btn-primary">
            <Cpu size={16} /> Parse Resume
          </button>
        </div>
      )}

      {loading && (
        <div className="card flex items-center gap-3 text-brand-600">
          <Loader size={20} className="animate-spin" />
          <span className="text-sm font-medium">Extracting skills with AI... This may take a moment.</span>
        </div>
      )}

      {analyzed && (
        <div className="card space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-emerald-600">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold">✓</div>
            <span className="text-sm font-semibold">Resume parsed successfully!</span>
          </div>

          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Detected Skills ({extractedSkills.length})</p>
            <SkillList skills={extractedSkills} variant="matched" />
          </div>

          <button onClick={() => navigate('/dashboard/role')} className="btn-primary w-full justify-center">
            Proceed to Role Selection <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

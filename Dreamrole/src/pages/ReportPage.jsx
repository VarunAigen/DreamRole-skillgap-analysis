import { useState, useEffect } from 'react'
import { authFetch } from '../lib/api'
import SkillList from '../components/SkillList'
import { Download, FileBarChart, CheckCircle2, AlertCircle, Trophy, Lightbulb, Award, Loader } from 'lucide-react'
import { useApp } from '../context/AppContext'

function Section({ icon: Icon, title, iconColor, children }) {
  return (
    <div className="card space-y-3 print:shadow-none">
      <div className="flex items-center gap-2 pb-2 border-b border-white/[0.04]">
        <Icon size={17} className={iconColor} />
        <h2 className="font-semibold text-white text-sm">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function ReportPage() {
  const [projects, setProjects] = useState([])
  const [certifications, setCertifications] = useState([])
  const [downloading, setDownloading] = useState(false)
  const { selectedRole, analysisResult, extractedSkills } = useApp()

  const role = selectedRole || 'Unknown Role'
  const matched = analysisResult?.matched_skills || []
  const missing = analysisResult?.missing_skills || []
  const stage = analysisResult?.alignment_stage || 'Developing Stage'
  const feedback = analysisResult?.feedback || ''
  const weak_areas = analysisResult?.weak_areas || []
  const resume_improvements = analysisResult?.resume_improvements || []

  useEffect(() => {
    if (!selectedRole) return
    authFetch(`/api/recommendations?role=${encodeURIComponent(selectedRole)}`)
      .then(r => r.json())
      .then(data => {
        if (data.projects) setProjects(data.projects)
        if (data.certifications) setCertifications(data.certifications)
      })
      .catch(console.error)
  }, [selectedRole])

  const stageColors = {
    'Foundation Stage': 'badge-amber',
    'Developing Stage': 'badge-brand',
    'Skilled Stage': 'badge-brand',
    'Role Ready Stage': 'badge-green'
  }
  const badgeClass = stageColors[stage] || 'badge-brand'

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await authFetch('/api/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          alignment_stage: stage,
          detected_skills: extractedSkills,
          matched_skills: matched,
          missing_skills: missing,
          feedback,
          weak_areas,
          resume_improvements,
          projects,
          certifications
        })
      })
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `DreamRole_Report_${role.replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      window.print() // fallback
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-heading flex items-center gap-2"><FileBarChart size={22} className="text-indigo-400" /> Career Report</h1>
          <p className="section-sub">Generated on {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
        </div>
        <button onClick={handleDownload} disabled={downloading} className="btn-primary">
          {downloading ? <Loader size={15} className="animate-spin" /> : <Download size={15} />}
          {downloading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>

      {/* Role & Stage */}
      <Section icon={Trophy} title="Dream Role & Alignment" iconColor="text-amber-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white/80">Target Role</p>
            <p className="text-lg font-bold text-indigo-400">{role}</p>
          </div>
          <span className={`${badgeClass} text-sm px-3 py-1.5`}>{stage}</span>
        </div>
      </Section>

      {/* Detected Skills */}
      <Section icon={CheckCircle2} title="Detected Skills from Resume" iconColor="text-emerald-500">
        {extractedSkills.length > 0
          ? <SkillList skills={extractedSkills} variant="matched" />
          : <p className="text-sm text-white/30 italic">No skills detected yet</p>}
      </Section>

      {/* Skill Gaps */}
      <Section icon={AlertCircle} title="Identified Skill Gaps" iconColor="text-red-400">
        {missing.length > 0
          ? <SkillList skills={missing} variant="missing" />
          : <p className="text-sm text-emerald-400 italic">🎉 No skill gaps – great alignment!</p>}
      </Section>

      {/* AI Feedback */}
      {feedback && (
        <Section icon={FileBarChart} title="AI Analysis" iconColor="text-brand-500">
          <p className="text-sm text-white/60 leading-relaxed">{feedback}</p>

          {weak_areas && weak_areas.length > 0 && (
            <div className="pt-3 mt-3 border-t border-slate-100">
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
            <div className="pt-3 mt-3 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-white/80 mb-2">Actionable Resume Improvements</h4>
              <ul className="text-sm text-white/60 space-y-1 pl-4 list-disc marker:text-brand-400">
                {resume_improvements.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* Recommended Projects */}
      <Section icon={Lightbulb} title="Recommended Projects" iconColor="text-purple-500">
        <ul className="space-y-2">
          {projects.slice(0, 4).map((p) => (
            <li key={p.title} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 text-sm text-white/80">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/100 flex-shrink-0" />
                <span className="font-medium">{p.title}</span>
              </div>
              {p.github && <a href={p.github} target="_blank" rel="noreferrer" className="ml-3.5 text-xs text-brand-500 hover:underline truncate">{p.github}</a>}
            </li>
          ))}
        </ul>
      </Section>

      {/* Certifications */}
      <Section icon={Award} title="Recommended Certifications" iconColor="text-amber-500">
        <ul className="space-y-2">
          {certifications.slice(0, 4).map((c) => (
            <li key={c.title} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 text-sm text-white/80">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/100 flex-shrink-0" />
                <span className="font-medium">{c.title}</span>
                <span className="text-xs text-white/30 ml-auto">{c.platform}</span>
              </div>
              {c.link && <a href={c.link} target="_blank" rel="noreferrer" className="ml-3.5 text-xs text-brand-500 hover:underline truncate">{c.link}</a>}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

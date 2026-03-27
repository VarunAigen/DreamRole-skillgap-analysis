import { useNavigate } from 'react-router-dom'
import SkillList from '../components/SkillList'
import { Cpu, ArrowRight, Lightbulb } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function SkillExtractionPage() {
  const navigate = useNavigate()
  const { extractedSkills } = useApp()

  if (extractedSkills.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="section-heading">Skill Extraction</h1>
        <div className="card text-center space-y-3">
          <p className="text-slate-600">No skills extracted yet. Please upload your resume first.</p>
          <button onClick={() => navigate('/dashboard/resume')} className="btn-primary mx-auto">Go to Resume Upload</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="section-heading">Skill Extraction</h1>
        <p className="section-sub">Here are the skills we detected from your resume.</p>
      </div>

      <div className="card space-y-5">
        <div className="flex items-center gap-3 p-3 bg-brand-50 border border-brand-100 rounded-xl">
          <Cpu size={18} className="text-brand-600" />
          <div>
            <p className="text-sm font-semibold text-brand-700">Analysis complete</p>
            <p className="text-xs text-brand-500">We found {extractedSkills.length} skills in your resume</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Detected Skills from Resume</p>
          <SkillList skills={extractedSkills} variant="default" />
        </div>

        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
          <Lightbulb size={17} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Tip:</strong> The more detailed your resume, the more accurate your skill extraction will be. Consider listing specific frameworks, tools, and technologies you've used.
          </p>
        </div>

        <button onClick={() => navigate('/dashboard/gap')} className="btn-primary w-full justify-center">
          Compare With Role Requirements <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

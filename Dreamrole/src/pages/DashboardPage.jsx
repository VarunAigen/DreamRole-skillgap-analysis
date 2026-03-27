import { useNavigate } from 'react-router-dom'
import {
  UploadCloud, Target, BarChart3, TrendingUp,
  Award, Zap, ArrowRight, Trophy, ChevronRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'

const actions = [
  { icon: UploadCloud, title: 'Upload Resume', desc: 'Parse your skills automatically', to: '/dashboard/resume', color: 'bg-brand-600' },
  { icon: Target, title: 'Select Dream Role', desc: 'Choose your target position', to: '/dashboard/role', color: 'bg-purple-600' },
  { icon: BarChart3, title: 'Start Skill Analysis', desc: 'Compare resume vs role', to: '/dashboard/gap', color: 'bg-emerald-600' },
  { icon: TrendingUp, title: 'View Progress', desc: 'Track your improvement', to: '/dashboard/progress', color: 'bg-amber-600' },
]

const stageConfig = {
  'Expert': { bg: 'from-emerald-600 to-emerald-800', hint: "You're at the top — keep it up!", icon: '🌟' },
  'Advanced': { bg: 'from-blue-600 to-blue-800', hint: 'Almost there — push through!', icon: '🚀' },
  'Developing': { bg: 'from-brand-600 to-brand-800', hint: 'Good progress — keep learning!', icon: '📈' },
  'Beginner': { bg: 'from-amber-500 to-orange-700', hint: "Great start — you're on your way!", icon: '🌱' },
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { analysisResult, selectedRole, extractedSkills } = useApp()

  // Derive display name — real Firebase name, or first part of email, or fallback
  const firstName = (currentUser?.displayName || currentUser?.email?.split('@')[0] || 'there')
    .split(' ')[0]

  // Real data from context (null if user hasn't done analysis yet)
  const hasAnalysis = !!analysisResult
  const stage = analysisResult?.alignment_stage || null
  const stageCfg = stage ? (stageConfig[stage] || stageConfig['Developing']) : null
  const matched = analysisResult?.matched_skills || []
  const missing = analysisResult?.missing_skills || []
  const total = (matched.length + missing.length) || 1
  const alignPct = Math.round((matched.length / total) * 100)
  const role = analysisResult?.role || selectedRole || null

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome back, {firstName} 👋</h1>
        <p className="text-slate-500 text-sm mt-1">
          {hasAnalysis
            ? `Here's your career development overview for ${role}.`
            : "Complete the steps below to get your personalized career analysis."}
        </p>
      </div>

      {/* Stats — real or empty */}
      {hasAnalysis ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Alignment card */}
          <div className="card flex flex-col gap-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-700 text-sm">Skill Alignment Overview</p>
              {role && <span className="badge-brand">{role}</span>}
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Role Alignment</span>
                <span className="font-semibold text-slate-700">{alignPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-surface-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                  style={{ width: `${alignPct}%` }}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-1">
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600">{matched.length}</p>
                <p className="text-xs text-slate-500">Matched</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-500">{missing.length}</p>
                <p className="text-xs text-slate-500">Missing</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-700">{total}</p>
                <p className="text-xs text-slate-500">Required</p>
              </div>
            </div>
          </div>

          {/* Stage card */}
          <div className={`card flex flex-col items-center justify-center gap-3 text-center bg-gradient-to-br ${stageCfg?.bg || 'from-brand-600 to-brand-800'} text-white border-0`}>
            <span className="text-4xl">{stageCfg?.icon || '📈'}</span>
            <div>
              <p className="text-lg font-bold text-white/70 uppercase tracking-widest text-xs">Stage</p>
              <p className="text-2xl font-extrabold mt-0.5">{stage}</p>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">{stageCfg?.hint}</p>
          </div>
        </div>
      ) : (
        /* Empty state — new user not done analysis yet */
        <div className="card border-dashed border-2 border-surface-300 text-center py-8 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 flex items-center justify-center">
            <Trophy size={28} className="text-brand-400" />
          </div>
          <h3 className="font-bold text-slate-700">No analysis yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Upload your resume and select your dream role to get personalized skill gap analysis, roadmap, and interview prep.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button onClick={() => navigate('/dashboard/resume')} className="btn-primary">
              Get Started <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Zap size={16} className="text-brand-500" /> Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => (
            <button
              key={action.title}
              onClick={() => navigate(action.to)}
              className="card card-hover text-left group"
            >
              <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center text-white mb-3 shadow group-hover:scale-110 transition-transform`}>
                <action.icon size={20} />
              </div>
              <p className="font-semibold text-slate-800 text-sm">{action.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{action.desc}</p>
              <div className="flex items-center gap-1 text-xs font-medium text-brand-600 mt-3 group-hover:gap-2 transition-all">
                Go <ArrowRight size={12} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Skill Gaps — only show if we have real data */}
      {hasAnalysis && missing.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <Award size={16} className="text-red-400" /> Skills to Develop
            </h2>
            <button onClick={() => navigate('/dashboard/gap')} className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1">
              View Full Analysis <ArrowRight size={11} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {missing.slice(0, 8).map((skill) => (
              <span key={skill} className="badge bg-red-50 text-red-600 border border-red-100">{skill}</span>
            ))}
            {missing.length > 8 && (
              <span className="badge bg-surface-100 text-slate-500">+{missing.length - 8} more</span>
            )}
          </div>
        </div>
      )}

      {/* Matched skills highlight if analysis done */}
      {hasAnalysis && matched.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <Award size={16} className="text-emerald-500" /> Your Matched Skills
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {matched.slice(0, 8).map((skill) => (
              <span key={skill} className="badge bg-emerald-50 text-emerald-700 border border-emerald-100">{skill}</span>
            ))}
            {matched.length > 8 && (
              <span className="badge bg-surface-100 text-slate-500">+{matched.length - 8} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import {
  UploadCloud, Target, BarChart3, TrendingUp,
  Award, Zap, ArrowRight, Trophy, ChevronRight, Sparkles
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'

const actions = [
  { icon: Sparkles, title: 'Start Journey', desc: 'Begin your skills workflow', to: '/dashboard/workflow', gradient: 'from-indigo-500 to-violet-600' },
  { icon: TrendingUp, title: 'View Progress', desc: 'Track your improvement', to: '/dashboard/progress', gradient: 'from-amber-500 to-orange-600' },
  { icon: Target, title: 'Mock Interview', desc: 'Practice with AI', to: '/dashboard/interview', gradient: 'from-violet-500 to-purple-600' },
  { icon: BarChart3, title: 'View Reports', desc: 'See your analytics', to: '/dashboard/analytics', gradient: 'from-emerald-500 to-teal-600' },
]

const stageConfig = {
  'Expert': { gradient: 'from-emerald-500 to-emerald-700', hint: "You're at the top — keep it up!", icon: '🌟' },
  'Advanced': { gradient: 'from-blue-500 to-blue-700', hint: 'Almost there — push through!', icon: '🚀' },
  'Developing': { gradient: 'from-indigo-500 to-violet-700', hint: 'Good progress — keep learning!', icon: '📈' },
  'Beginner': { gradient: 'from-amber-500 to-orange-600', hint: "Great start — you're on your way!", icon: '🌱' },
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { analysisResult, selectedRole, extractedSkills } = useApp()

  const firstName = (currentUser?.displayName || currentUser?.email?.split('@')[0] || 'there').split(' ')[0]
  const hasAnalysis = !!analysisResult
  const stage = analysisResult?.alignment_stage || null
  const stageCfg = stage ? (stageConfig[stage] || stageConfig['Developing']) : null
  const matched = analysisResult?.matched_skills || []
  const missing = analysisResult?.missing_skills || []
  const total = (matched.length + missing.length) || 1
  const alignPct = Math.round((matched.length / total) * 100)
  const role = analysisResult?.role || selectedRole || null

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back, {firstName} 👋</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {hasAnalysis
            ? `Here's your career development overview for ${role}.`
            : "Complete the steps below to get your personalized career analysis."}
        </p>
      </div>

      {/* Stats */}
      {hasAnalysis ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Alignment card */}
          <div className="glass-card lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white/80 text-sm">Skill Alignment Overview</p>
              {role && <span className="badge-brand">{role}</span>}
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <span>Role Alignment</span>
                <span className="font-semibold text-white/80">{alignPct}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${alignPct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
              </div>
            </div>
            <div className="flex gap-6 mt-1">
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: '#4ade80' }}>{matched.length}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Matched</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: '#f87171' }}>{missing.length}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Missing</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white/80">{total}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Required</p>
              </div>
            </div>
          </div>

          {/* Stage card */}
          <div className={`glass-card flex flex-col items-center justify-center gap-3 text-center`}
            style={{
              background: `linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))`,
              border: '1px solid rgba(99,102,241,0.2)',
            }}>
            <span className="text-4xl">{stageCfg?.icon || '📈'}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Stage</p>
              <p className="text-2xl font-extrabold text-white mt-0.5">{stage}</p>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{stageCfg?.hint}</p>
          </div>
        </div>
      ) : (
        <div className="glass-card text-center py-10 space-y-4" style={{ borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <Trophy size={28} style={{ color: '#818cf8' }} />
          </div>
          <h3 className="font-bold text-white">No analysis yet</h3>
          <p className="text-sm max-w-sm mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Upload your resume and select your dream role to get personalized skill gap analysis, roadmap, and interview prep.
          </p>
          <button onClick={() => navigate('/dashboard/workflow')} className="btn-primary mx-auto">
            Get Started <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-bold text-white/80 mb-3 flex items-center gap-2">
          <Zap size={16} style={{ color: '#818cf8' }} /> Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => (
            <button
              key={action.title}
              onClick={() => navigate(action.to)}
              className="glass-card card-hover text-left group"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white mb-3 shadow-glow group-hover:scale-110 transition-transform`}>
                <action.icon size={20} />
              </div>
              <p className="font-semibold text-white text-sm">{action.title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{action.desc}</p>
              <div className="flex items-center gap-1 text-xs font-medium mt-3 group-hover:gap-2 transition-all" style={{ color: '#818cf8' }}>
                Go <ArrowRight size={12} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Skills to develop */}
      {hasAnalysis && missing.length > 0 && (
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white/80 text-sm flex items-center gap-2">
              <Award size={16} style={{ color: '#f87171' }} /> Skills to Develop
            </h2>
            <button onClick={() => navigate('/dashboard/workflow')}
              className="text-xs font-medium flex items-center gap-1 hover:underline" style={{ color: '#818cf8' }}>
              View Full Analysis <ArrowRight size={11} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {missing.slice(0, 8).map((skill) => (
              <span key={skill} className="badge-red">{skill}</span>
            ))}
            {missing.length > 8 && (
              <span className="badge" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                +{missing.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Matched skills */}
      {hasAnalysis && matched.length > 0 && (
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white/80 text-sm flex items-center gap-2">
              <Award size={16} style={{ color: '#4ade80' }} /> Your Matched Skills
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {matched.slice(0, 8).map((skill) => (
              <span key={skill} className="badge-green">{skill}</span>
            ))}
            {matched.length > 8 && (
              <span className="badge" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                +{matched.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

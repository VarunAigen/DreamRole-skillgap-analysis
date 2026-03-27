import ChartContainer from '../components/ChartContainer'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts'
import { AlertCircle, BarChart3, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const priorityStyles = {
  High: 'badge-red',
  Medium: 'badge-amber',
  Low: 'badge-brand',
}

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const { analysisResult, selectedRole } = useApp()

  // No data yet — show empty state
  if (!analysisResult) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="section-heading">Analytics</h1>
          <p className="section-sub">Visual insights into your skill alignment and performance trends.</p>
        </div>
        <div className="card border-dashed border-2 border-surface-300 text-center py-12 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 flex items-center justify-center">
            <BarChart3 size={28} className="text-brand-400" />
          </div>
          <h3 className="font-bold text-slate-700">No data to display yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Complete a skill gap analysis first to see your alignment trends, skill distribution, and learning priorities here.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button onClick={() => navigate('/dashboard/resume')} className="btn-secondary">
              Upload Resume <ChevronRight size={15} />
            </button>
            <button onClick={() => navigate('/dashboard/gap')} className="btn-primary">
              Start Analysis <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Build real chart data from analysis result
  const matched = analysisResult.matched_skills || []
  const missing = analysisResult.missing_skills || []
  const total = matched.length + missing.length || 1
  const alignPct = Math.round((matched.length / total) * 100)
  const role = analysisResult.role || selectedRole || 'Target Role'
  const stage = analysisResult.alignment_stage || 'Developing'

  // Pie chart data
  const gapData = [
    { name: 'Matched', value: matched.length, color: '#10b981' },
    { name: 'Missing', value: missing.length, color: '#f43f5e' },
  ]

  // Skill bar chart - matched skills with their "strength" represented as full vs partial
  const skillBarData = [
    ...matched.slice(0, 5).map(s => ({ skill: s.length > 12 ? s.slice(0, 12) + '…' : s, status: 'Matched', value: 100 })),
    ...missing.slice(0, 5).map(s => ({ skill: s.length > 12 ? s.slice(0, 12) + '…' : s, status: 'Missing', value: 0 })),
  ]

  // Priority list from missing skills
  const skillsToImprove = missing.slice(0, 6).map((skill, i) => ({
    skill,
    priority: i < 2 ? 'High' : i < 4 ? 'Medium' : 'Low'
  }))

  // Single-point trend — one analysis completed
  const trendData = [
    { attempt: 'Before', alignment: 0 },
    { attempt: 'Now', alignment: alignPct },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">Analytics</h1>
        <p className="section-sub">
          Skill insights for <span className="font-semibold text-brand-600">{role}</span> · Stage: <span className="font-semibold">{stage}</span>
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Alignment', value: `${alignPct}%`, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Matched Skills', value: matched.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Missing Skills', value: missing.length, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Stage', value: stage, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className={`card ${s.bg} border-0 text-center p-4`}>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alignment snapshot */}
        <ChartContainer title="Skill Alignment Snapshot" subtitle="Your current role alignment">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="attempt" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Line type="monotone" dataKey="alignment" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 6 }} />
          </LineChart>
        </ChartContainer>

        {/* Skill status bar chart */}
        <ChartContainer title="Top Skills Status" subtitle="Matched (100%) vs Missing (0%)">
          <BarChart data={skillBarData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="skill" tick={{ fontSize: 11 }} width={90} />
            <Tooltip formatter={(v, n, props) => [props.payload.status, 'Status']} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {skillBarData.map((entry, i) => (
                <Cell key={i} fill={entry.status === 'Matched' ? '#10b981' : '#f43f5e'} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <ChartContainer title="Skill Gap Distribution" subtitle="Matched vs. Missing skills">
          <PieChart>
            <Pie
              data={gapData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {gapData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ChartContainer>

        {/* Skills to improve */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={18} className="text-red-400" />
            <h3 className="font-semibold text-slate-800 text-sm">Priority Skills to Learn</h3>
          </div>
          {skillsToImprove.length > 0 ? (
            <div className="space-y-3">
              {skillsToImprove.map(({ skill, priority }) => (
                <div key={skill} className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0">
                  <span className="text-sm font-medium text-slate-700">{skill}</span>
                  <span className={priorityStyles[priority]}>{priority}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-emerald-600 font-medium">🎉 You have all required skills!</p>
          )}
        </div>
      </div>
    </div>
  )
}

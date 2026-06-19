import ChartContainer from '../components/ChartContainer'
import RecommendedRoles from '../components/RecommendedRoles'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts'
import { AlertCircle, BarChart3, ChevronRight, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const priorityStyles = {
  High: 'bg-red-100 text-red-700 border-red-500/20',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low: 'bg-indigo-100 text-indigo-700 border-indigo-200',
}

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const { analysisResult, selectedRole } = useApp()

  // No data yet — show premium empty state
  if (!analysisResult) {
    return (
      <div className="space-y-8 animate-fade-in relative">
        {/* Soft gradient background mesh for header */}
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-r from-indigo-50 via-white to-purple-50 -z-10 rounded-3xl blur-3xl opacity-60 pointer-events-none"></div>

        <div>
          <h1 className="tracking-tight font-extrabold text-3xl text-white">Analytics</h1>
          <p className="text-gray-500 mt-1">Visual insights into your skill alignment and performance trends.</p>
        </div>

        <RecommendedRoles />

        {/* Hero-style Empty State */}
        <div className="relative overflow-hidden card bg-transparent/60 backdrop-blur-xl border border-white/60 text-center py-20 px-6 rounded-[2rem] shadow-2xl shadow-indigo-500/5 transition-all duration-500 hover:shadow-indigo-500/10">
          
          {/* Subtle Background Blobs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-4000"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-6 shadow-inner animate-bounce">
              <BarChart3 size={36} strokeWidth={2.5} />
            </div>
            
            <h3 className="tracking-tight font-extrabold text-2xl text-white mb-3">No data to display yet</h3>
            <p className="text-white/40 max-w-sm mx-auto mb-8 text-sm leading-relaxed">
              Complete a skill gap analysis first to see your alignment trends, skill distribution, and learning priorities here.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => navigate('/dashboard/workflow')} className="w-full sm:w-auto px-6 py-3 rounded-full font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all duration-300 active:scale-95 text-sm">
                Upload Resume
              </button>
              <button 
                onClick={() => navigate('/dashboard/workflow')} 
                className="w-full sm:w-auto px-6 py-3 rounded-full font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-300 active:scale-95 text-sm flex items-center justify-center gap-2"
              >
                Start Analysis <ChevronRight size={16} />
              </button>
            </div>
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
    <div className="space-y-8 animate-fade-in relative z-0">
      {/* Header section dynamic background */}
      <div className="absolute top-[-2rem] left-[-2rem] right-[-2rem] h-[500px] bg-gradient-to-br from-indigo-50 via-white to-purple-50 -z-10 blur-3xl opacity-70 pointer-events-none rounded-[5rem]"></div>

      <div>
        <h1 className="tracking-tight font-extrabold text-3xl text-white">Analytics</h1>
        <p className="text-gray-500 mt-1">
          Skill insights for <span className="font-bold text-indigo-600">{role}</span> &middot; Stage: <span className="font-bold text-white/80">{stage}</span>
        </p>
      </div>

      <RecommendedRoles />

      {/* Summary stat cards (Glassmorphism) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Alignment', value: `${alignPct}%`, color: 'text-indigo-600', dot: 'bg-indigo-400' },
          { label: 'Matched Skills', value: matched.length, color: 'text-emerald-500', dot: 'bg-emerald-400' },
          { label: 'Missing Skills', value: missing.length, color: 'text-red-400', dot: 'bg-red-400' },
          { label: 'Stage', value: stage, color: 'text-purple-400', dot: 'bg-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-transparent/80 backdrop-blur-md border border-white/50 shadow-xl shadow-indigo-500/5 rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className={`absolute top-0 right-0 w-24 h-24 ${s.dot} opacity-[0.05] rounded-bl-[100px]`}></div>
            <p className={`text-3xl tracking-tight font-black ${s.color} mb-1 drop-shadow-sm`}>{s.value}</p>
            <p className="text-sm font-medium text-white/40">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Alignment snapshot */}
        <div className="bg-transparent/80 backdrop-blur-md border border-white/50 shadow-xl shadow-indigo-500/5 rounded-3xl p-2 transition-all hover:shadow-indigo-500/10">
          <ChartContainer title="Skill Alignment Snapshot" subtitle="Your current role alignment">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
              <XAxis dataKey="attempt" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="alignment" stroke="#4f46e5" strokeWidth={4} activeDot={{ r: 8, fill: '#4f46e5', stroke: '#fff', strokeWidth: 3 }} dot={{ fill: '#4f46e5', r: 5 }} />
            </LineChart>
          </ChartContainer>
        </div>

        {/* Skill status bar chart */}
        <div className="bg-transparent/80 backdrop-blur-md border border-white/50 shadow-xl shadow-indigo-500/5 rounded-3xl p-2 transition-all hover:shadow-indigo-500/10">
          <ChartContainer title="Top Skills Status" subtitle="Matched (100%) vs Missing (0%)">
            <BarChart data={skillBarData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="skill" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} width={90} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(v, n, props) => [props.payload.status, 'Status']} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                {skillBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.status === 'Matched' ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 pb-8">
        {/* Pie chart */}
        <div className="bg-transparent/80 backdrop-blur-md border border-white/50 shadow-xl shadow-indigo-500/5 rounded-3xl p-2 transition-all hover:shadow-indigo-500/10">
          <ChartContainer title="Skill Gap Distribution" subtitle="Matched vs. Missing skills">
            <PieChart>
              <Pie
                data={gapData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={105}
                paddingAngle={6}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                stroke="none"
              >
                {gapData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip cursor={false} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
            </PieChart>
          </ChartContainer>
        </div>

        {/* Skills to improve */}
        <div className="bg-transparent/80 backdrop-blur-md border border-white/50 shadow-xl shadow-indigo-500/5 rounded-3xl p-6 sm:p-8 flex flex-col transition-all hover:shadow-indigo-500/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <AlertCircle size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold tracking-tight text-white text-lg">Priority Skills to Learn</h3>
              <p className="text-xs font-medium text-white/40">Based on your highest skill gaps</p>
            </div>
          </div>
          
          <div className="flex-1">
            {skillsToImprove.length > 0 ? (
              <div className="space-y-4">
                {skillsToImprove.map(({ skill, priority }) => (
                  <div key={skill} className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <span className="text-sm font-semibold text-white/80 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-400"></div>
                      {skill}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${priorityStyles[priority]}`}>{priority}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center pb-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h4 className="font-bold text-white">All Set!</h4>
                <p className="text-sm text-emerald-400 font-medium max-w-[200px] mt-1 text-center">You have matched all required core skills for this role.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

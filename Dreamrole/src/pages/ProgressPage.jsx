import { useState, useEffect } from 'react'
import { authFetch } from '../lib/api'
import ChartContainer from '../components/ChartContainer'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { TrendingUp, Loader } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

export default function ProgressPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const { selectedRole } = useApp()
  const { currentUser } = useAuth()

  useEffect(() => {
    if (!currentUser?.uid) { setLoading(false); return }
    authFetch(`/api/progress?user_id=${currentUser.uid}`)
      .then(r => r.json())
      .then(data => { if (data.progress) setRecords(data.progress) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [currentUser])

  const stageToNum = { 'Foundation Stage': 1, 'Developing Stage': 2, 'Skilled Stage': 3, 'Role Ready Stage': 4 }
  const chartData = records.map((r, i) => ({
    attempt: `Attempt ${i + 1}`,
    stage: stageToNum[r.alignment_stage] || 1,
    stage_label: r.alignment_stage,
    role: r.role,
    date: new Date(r.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }))

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="section-heading">Progress Tracking</h1>
        <p className="section-sub">Your improvement history over time.</p>
      </div>

      {loading ? (
        <div className="glass-card flex items-center gap-3" style={{ color: '#818cf8' }}>
          <Loader size={20} className="animate-spin" />
          <span className="text-sm font-medium">Loading progress records...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="glass-card text-center space-y-2 py-10">
          <TrendingUp size={28} className="mx-auto" style={{ color: 'rgba(255,255,255,0.2)' }} />
          <p className="font-medium text-white/70">No progress records yet</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Complete a skill gap analysis to start tracking your progress.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="stat-pill">
              <p className="text-3xl font-extrabold" style={{ color: '#818cf8' }}>{records.length}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Total Attempts</p>
            </div>
            <div className="stat-pill">
              <p className="text-xl font-extrabold capitalize" style={{ color: '#4ade80' }}>{records[records.length - 1]?.alignment_stage || '—'}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Latest Stage</p>
            </div>
            <div className="stat-pill col-span-2 lg:col-span-1">
              <p className="text-xl font-extrabold" style={{ color: '#a78bfa' }}>{records[records.length - 1]?.role || '—'}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Latest Role</p>
            </div>
          </div>

          {chartData.length > 1 && (
            <ChartContainer title="Alignment Stage Over Time" subtitle="Progress across evaluation attempts" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="stageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="attempt" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} stroke="rgba(255,255,255,0.06)" />
                <YAxis domain={[0, 4]} tickFormatter={(v) => ['', 'Foundation', 'Developing', 'Skilled', 'Ready'][v] || v}
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} stroke="rgba(255,255,255,0.06)" />
                <Tooltip contentStyle={{ background: 'rgba(15,15,20,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }}
                  formatter={(v) => ['', 'Foundation Stage', 'Developing Stage', 'Skilled Stage', 'Role Ready Stage'][v] || v} />
                <Area type="monotone" dataKey="stage" stroke="#6366f1" strokeWidth={2.5} fill="url(#stageGrad)" />
              </AreaChart>
            </ChartContainer>
          )}

          <div className="glass-card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={17} style={{ color: '#818cf8' }} />
              <h3 className="font-semibold text-white/80 text-sm">Attempt History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Date</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Time</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Role</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Stage</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Missing Skills</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.id || i} className="transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="py-3 px-3 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{new Date(r.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                      <td className="py-3 px-3 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{new Date(r.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</td>
                      <td className="py-3 px-3 font-medium text-white/80">{r.role}</td>
                      <td className="py-3 px-3 text-center"><span className="badge-brand text-xs">{r.alignment_stage}</span></td>
                      <td className="py-3 px-3 text-center text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.missing_skills?.length || 0} skills</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

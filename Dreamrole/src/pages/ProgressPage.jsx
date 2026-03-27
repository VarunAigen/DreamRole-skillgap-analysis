import { useState, useEffect } from 'react'
import ChartContainer from '../components/ChartContainer'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { TrendingUp, Loader } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function ProgressPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const { selectedRole } = useApp()

  useEffect(() => {
    fetch('/api/progress')
      .then(r => r.json())
      .then(data => { if (data.progress) setRecords(data.progress) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const stageToNum = {
    'Foundation Stage': 1,
    'Developing Stage': 2,
    'Skilled Stage': 3,
    'Role Ready Stage': 4
  }

  const chartData = records.map((r, i) => ({
    attempt: `Attempt ${i + 1}`,
    stage: stageToNum[r.alignment_stage] || 1,
    stage_label: r.alignment_stage,
    role: r.role,
    date: new Date(r.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">Progress Tracking</h1>
        <p className="section-sub">Your improvement history over time.</p>
      </div>

      {loading ? (
        <div className="card flex items-center gap-3 text-brand-600">
          <Loader size={20} className="animate-spin" />
          <span className="text-sm font-medium">Loading progress records...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="card text-center space-y-2">
          <TrendingUp size={28} className="text-slate-300 mx-auto" />
          <p className="text-slate-500 font-medium">No progress records yet</p>
          <p className="text-sm text-slate-400">Complete a skill gap analysis to start tracking your progress.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-3xl font-extrabold text-brand-600">{records.length}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">Total Attempts</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-extrabold text-emerald-600 capitalize">{records[records.length - 1]?.alignment_stage || '—'}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">Latest Stage</p>
            </div>
            <div className="card text-center col-span-2 lg:col-span-1">
              <p className="text-2xl font-extrabold text-purple-600">{records[records.length - 1]?.role || '—'}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">Latest Role</p>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 1 && (
            <ChartContainer title="Alignment Stage Over Time" subtitle="Progress across evaluation attempts" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="stageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="attempt" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 4]} tickFormatter={(v) => ['', 'Foundation', 'Developing', 'Skilled', 'Ready'][v] || v} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v) => ['', 'Foundation Stage', 'Developing Stage', 'Skilled Stage', 'Role Ready Stage'][v] || v} />
                <Area type="monotone" dataKey="stage" stroke="#6366f1" strokeWidth={2.5} fill="url(#stageGrad)" />
              </AreaChart>
            </ChartContainer>
          )}

          {/* History Table */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={17} className="text-brand-500" />
              <h3 className="font-semibold text-slate-800 text-sm">Attempt History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Missing Skills</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.id || i} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                      <td className="py-3 px-3 text-slate-500 text-xs">{new Date(r.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                      <td className="py-3 px-3 font-medium text-slate-700">{r.role}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="badge-brand text-xs">{r.alignment_stage}</span>
                      </td>
                      <td className="py-3 px-3 text-center text-xs text-slate-500">{r.missing_skills?.length || 0} skills</td>
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

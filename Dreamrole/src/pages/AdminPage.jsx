import { useState, useEffect } from 'react'
import { authFetch } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    ShieldAlert, Users, Activity, DollarSign, Zap, Database,
    TrendingUp, Clock, AlertTriangle, RefreshCw, ChevronDown,
    Search, Settings, BarChart2, Cpu, Trash2
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG = '#09090f'
const CARD = 'rgba(255,255,255,0.04)'
const BORDER = 'rgba(255,255,255,0.08)'
const TEXT = '#f1f5f9'
const MUTED = 'rgba(255,255,255,0.4)'
const ACCENT = '#6366f1'
const GREEN = '#22c55e'
const AMBER = '#f59e0b'
const RED = '#ef4444'
const PURPLE = '#a855f7'

const STAGE_COLORS = {
    'Excellent': '#22c55e', 'Good': '#3b82f6',
    'Developing': '#f59e0b', 'Needs Improvement': '#ef4444', 'Unknown': '#64748b'
}

function StatCard({ icon: Icon, label, value, sub, color = ACCENT }) {
    return (
        <div style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 18, padding: '20px 22px',
            borderTop: `2px solid ${color}40`
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Icon size={17} color={color} />
                </div>
                <p style={{ fontSize: 12, color: MUTED, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
            </div>
            <p style={{ fontSize: 30, fontWeight: 800, color: TEXT, margin: '0 0 4px' }}>{value}</p>
            {sub && <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{sub}</p>}
        </div>
    )
}

function SectionTitle({ icon: Icon, title, subtitle, color = ACCENT }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
            </div>
            <div>
                <p style={{ fontWeight: 700, color: TEXT, margin: 0, fontSize: 15 }}>{title}</p>
                {subtitle && <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{subtitle}</p>}
            </div>
        </div>
    )
}

function RoleChip({ role }) {
    const colors = { admin: [RED, `${RED}18`], mentor: [PURPLE, `${PURPLE}18`], student: [ACCENT, `${ACCENT}18`] }
    const [text, bg] = colors[role] || [MUTED, CARD]
    return (
        <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
            background: bg, color: text, textTransform: 'uppercase', letterSpacing: '0.06em'
        }}>{role}</span>
    )
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    return (
        <div style={{
            background: '#0f0f1e', border: `1px solid ${BORDER}`,
            borderRadius: 10, padding: '10px 14px', fontSize: 12, color: TEXT
        }}>
            <p style={{ margin: '0 0 6px', color: MUTED }}>{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ margin: '2px 0', color: p.color || TEXT, fontWeight: 600 }}>
                    {p.name}: {typeof p.value === 'number' && p.value < 1 ? `$${p.value.toFixed(4)}` : p.value}
                </p>
            ))}
        </div>
    )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminPage() {
    const { currentUser } = useAuth()
    const navigate = useNavigate()

    const [stats, setStats] = useState(null)
    const [users, setUsers] = useState([])
    const [usage, setUsage] = useState([])
    const [dailyTrend, setDailyTrend] = useState([])
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [usersLoading, setUsersLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [activeTab, setActiveTab] = useState('overview')
    const [flushing, setFlushing] = useState(false)
    const [error, setError] = useState('')

    // Mentors management state
    const [mentors, setMentors] = useState([])
    const [mentorsLoading, setMentorsLoading] = useState(false)
    const [addingMentor, setAddingMentor] = useState(false)
    const [mentorError, setMentorError] = useState('')
    const [mentorSuccess, setMentorSuccess] = useState('')
    const [mentorForm, setMentorForm] = useState({
        name: '', email: '', password: '', designation: '', company: '', skills: '', profileInfo: ''
    })

    // Fetch all data
    const fetchData = async () => {
        setLoading(true)
        setError('')
        try {
            const [statsRes, usageRes, logsRes] = await Promise.all([
                authFetch('/api/admin/stats'),
                authFetch('/api/admin/api-usage?days=7'),
                authFetch('/api/admin/logs')
            ])

            if (!statsRes.ok) {
                const statsData = await statsRes.json().catch(() => ({}));
                throw new Error(statsData.error || `Stats request failed (${statsRes.status})`);
            }
            if (!usageRes.ok) {
                const usageData = await usageRes.json().catch(() => ({}));
                throw new Error(usageData.error || `API usage request failed (${usageRes.status})`);
            }
            if (!logsRes.ok) {
                const logsData = await logsRes.json().catch(() => ({}));
                throw new Error(logsData.error || `Logs request failed (${logsRes.status})`);
            }

            const [statsData, usageData, logsData] = await Promise.all([
                statsRes.json(), usageRes.json(), logsRes.json()
            ])
            if (statsData.success) setStats(statsData)
            if (usageData.success) { setUsage(usageData.usage || []); setDailyTrend(usageData.dailyTrend || []) }
            if (logsData.success) setLogs(logsData.logs || [])
        } catch (err) {
            setError('Failed to load admin data: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async () => {
        setUsersLoading(true)
        try {
            const res = await authFetch('/api/admin/users')
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || `Users request failed (${res.status})`);
            }
            if (data.success) setUsers(data.users || [])
        } catch (err) {
            console.error('Users fetch error:', err.message)
            setError(prev => prev ? prev + ' | ' + err.message : 'Failed to load users: ' + err.message)
        } finally {
            setUsersLoading(false)
        }
    }

    const fetchMentors = async () => {
        setMentorsLoading(true)
        try {
            const res = await authFetch('/api/admin/mentors')
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || `Mentors request failed (${res.status})`);
            }
            if (data.success) setMentors(data.mentors || [])
        } catch (err) {
            console.error('Mentors fetch error:', err.message)
            setError(prev => prev ? prev + ' | ' + err.message : 'Failed to load mentors: ' + err.message)
        } finally {
            setMentorsLoading(false)
        }
    }

    const handleAddMentor = async (e) => {
        e.preventDefault()
        setAddingMentor(true)
        setMentorError('')
        setMentorSuccess('')
        try {
            const res = await authFetch('/api/admin/mentor', {
                method: 'POST',
                body: JSON.stringify(mentorForm)
            })
            const data = await res.json()
            if (data.success) {
                setMentorSuccess('Mentor added successfully!')
                setMentorForm({ name: '', email: '', password: '', designation: '', company: '', skills: '', profileInfo: '' })
                fetchMentors()
            } else {
                setMentorError(data.error || 'Failed to add mentor')
            }
        } catch (err) {
            setMentorError(err.message)
        } finally {
            setAddingMentor(false)
        }
    }

    const handleDeleteMentor = async (uid) => {
        if (window.confirm('Are you sure you want to delete this mentor?')) {
            try {
                const res = await authFetch(`/api/admin/mentor/${uid}`, { method: 'DELETE' })
                const data = await res.json()
                if (data.success) {
                    fetchMentors()
                } else {
                    alert(data.error || 'Failed to delete mentor')
                }
            } catch (err) {
                alert(err.message)
            }
        }
    }

    useEffect(() => { fetchData(); fetchUsers(); fetchMentors() }, [])

    const handleFlushCache = async () => {
        setFlushing(true)
        await authFetch('/api/admin/cache/flush', { method: 'POST' })
        setTimeout(() => { setFlushing(false); fetchData() }, 800)
    }

    const handleRoleChange = async (uid, newRole) => {
        await authFetch(`/api/admin/user/${uid}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role: newRole })
        })
        fetchUsers()
    }

    // Derived data
    const filteredUsers = users.filter(u => {
        const matchSearch = !search || u.email.includes(search) || u.name?.toLowerCase().includes(search.toLowerCase())
        const matchRole = roleFilter === 'all' || u.role === roleFilter
        return matchSearch && matchRole
    })

    const stageChartData = stats?.stageDistribution
        ? Object.entries(stats.stageDistribution).map(([name, value]) => ({ name, value }))
        : []

    const usageChartData = usage.slice(0, 8).map(u => ({
        name: u._id.replace('/api/', '').replace('/', '·'),
        calls: u.calls, cost: parseFloat((u.cost || 0).toFixed(4)),
        tokens: u.tokens
    }))

    const tabs = ['overview', 'users', 'mentors', 'api-usage', 'logs']

    // ── Dark page wrapper ──────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'inherit' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                            width: 46, height: 46, borderRadius: 14, background: `${RED}18`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `1px solid ${RED}30`
                        }}>
                            <ShieldAlert size={22} color={RED} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT, margin: 0 }}>Admin Dashboard</h1>
                            <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>DreamRole Platform Analytics</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={fetchData} style={{
                            padding: '9px 16px', borderRadius: 10, background: CARD,
                            border: `1px solid ${BORDER}`, color: TEXT, cursor: 'pointer', fontSize: 12,
                            display: 'flex', alignItems: 'center', gap: 6
                        }}>
                            <RefreshCw size={13} /> Refresh
                        </button>
                        <button onClick={handleFlushCache} disabled={flushing} style={{
                            padding: '9px 16px', borderRadius: 10,
                            background: flushing ? CARD : `${AMBER}18`,
                            border: `1px solid ${flushing ? BORDER : AMBER + '40'}`,
                            color: flushing ? MUTED : AMBER, cursor: 'pointer', fontSize: 12,
                            display: 'flex', alignItems: 'center', gap: 6
                        }}>
                            <Trash2 size={13} /> {flushing ? 'Flushing...' : 'Flush Cache'}
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div style={{ background: `${RED}10`, border: `1px solid ${RED}30`, borderRadius: 12, padding: '12px 18px', marginBottom: 20, color: '#fca5a5', fontSize: 13 }}>
                        {error}
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 4, marginBottom: 24, width: 'fit-content' }}>
                    {tabs.map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} style={{
                            padding: '8px 18px', borderRadius: 10, border: 'none',
                            background: activeTab === t ? ACCENT : 'transparent',
                            color: activeTab === t ? '#fff' : MUTED, cursor: 'pointer',
                            fontSize: 13, fontWeight: activeTab === t ? 700 : 400,
                            textTransform: 'capitalize', transition: 'all 0.2s'
                        }}>{t.replace('-', ' ')}</button>
                    ))}
                </div>

                {loading && (
                    <div style={{ textAlign: 'center', padding: 60, color: MUTED }}>
                        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                        <p>Loading platform data...</p>
                    </div>
                )}

                {/* ── OVERVIEW TAB ──────────────────────────────────────────── */}
                {!loading && activeTab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Stat cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                            <StatCard icon={Users} label="Total Users" value={users.length || '—'} sub="Firebase Auth" color={ACCENT} />
                            <StatCard icon={Activity} label="Total Sessions" value={stats?.totalSessions ?? '—'} sub="Interview sessions" color={GREEN} />
                            <StatCard icon={Zap} label="API Calls Today" value={stats?.apiCallsToday ?? '—'} sub={`${stats?.todayTokens?.toLocaleString() || 0} tokens`} color={AMBER} />
                            <StatCard icon={DollarSign} label="Cost Today" value={`$${stats?.todayCostUSD ?? '0.00'}`} sub={`$${stats?.totalCostAllTime ?? '0.00'} all time`} color={RED} />
                        </div>

                        {/* Stage distribution + Cache stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                            {/* Stage donut */}
                            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 22 }}>
                                <SectionTitle icon={BarChart2} title="Interview Stage Distribution" subtitle="All time" />
                                {stageChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie data={stageChartData} dataKey="value" nameKey="name"
                                                cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                                                paddingAngle={3}>
                                                {stageChartData.map((entry) => (
                                                    <Cell key={entry.name} fill={STAGE_COLORS[entry.name] || '#6366f1'} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: 12, color: MUTED }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: MUTED, fontSize: 13 }}>No session data yet</div>
                                )}
                            </div>

                            {/* Cache stats */}
                            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 22 }}>
                                <SectionTitle icon={Database} title="OpenAI Cache Stats" subtitle="node-cache · 6hr TTL" color={PURPLE} />
                                {stats?.cacheStats ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {[
                                            { label: 'Cache Hits', value: stats.cacheStats.hits, color: GREEN },
                                            { label: 'Cache Misses', value: stats.cacheStats.misses, color: AMBER },
                                            { label: 'Stored Keys', value: stats.cacheStats.keys, color: ACCENT },
                                            { label: 'Hit Rate', value: stats.cacheStats.hits + stats.cacheStats.misses > 0
                                                ? `${Math.round(stats.cacheStats.hits / (stats.cacheStats.hits + stats.cacheStats.misses) * 100)}%`
                                                : '—', color: PURPLE }
                                        ].map(({ label, value, color }) => (
                                            <div key={label} style={{
                                                background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}>
                                                <p style={{ margin: 0, fontSize: 13, color: MUTED }}>{label}</p>
                                                <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color }}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: MUTED, fontSize: 13 }}>Cache not available</div>
                                )}
                            </div>
                        </div>

                        {/* Daily trend chart */}
                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 22 }}>
                            <SectionTitle icon={TrendingUp} title="Daily API Activity (Last 7 days)" subtitle="Calls & estimated cost" color={GREEN} />
                            {dailyTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={dailyTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="_id" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="calls" stroke={ACCENT} strokeWidth={2} dot={false} name="Calls" />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: MUTED, fontSize: 13 }}>No trend data yet</div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── USERS TAB ─────────────────────────────────────────────── */}
                {!loading && activeTab === 'users' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {/* Filters */}
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Search size={14} color={MUTED} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by email or name..."
                                    style={{
                                        width: '100%', padding: '10px 14px 10px 34px',
                                        background: CARD, border: `1px solid ${BORDER}`,
                                        borderRadius: 12, color: TEXT, fontSize: 13, outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            {['all', 'student', 'mentor', 'admin'].map(r => (
                                <button key={r} onClick={() => setRoleFilter(r)} style={{
                                    padding: '9px 16px', borderRadius: 10, border: `1px solid ${roleFilter === r ? ACCENT + '60' : BORDER}`,
                                    background: roleFilter === r ? `${ACCENT}18` : CARD,
                                    color: roleFilter === r ? '#818cf8' : MUTED, cursor: 'pointer', fontSize: 12,
                                    fontWeight: roleFilter === r ? 700 : 400, textTransform: 'capitalize'
                                }}>{r}</button>
                            ))}
                        </div>

                        {/* Users table */}
                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
                                <p style={{ margin: 0, fontSize: 13, color: MUTED }}>
                                    {usersLoading ? 'Loading users...' : `${filteredUsers.length} users`}
                                </p>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                        <tr>
                                            {['User', 'Role', 'Sessions', 'Last Session', 'Last Sign In', 'Actions'].map(h => (
                                                <th key={h} style={{ padding: '12px 18px', textAlign: 'left', color: MUTED, fontWeight: 600, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((u, i) => (
                                            <tr key={u.uid} style={{ borderBottom: i < filteredUsers.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                                                <td style={{ padding: '14px 18px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{
                                                            width: 32, height: 32, borderRadius: '50%',
                                                            background: `${ACCENT}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: 13, fontWeight: 700, color: '#818cf8'
                                                        }}>
                                                            {u.name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <p style={{ margin: 0, color: TEXT, fontWeight: 600 }}>{u.name || '—'}</p>
                                                            <p style={{ margin: 0, color: MUTED, fontSize: 11 }}>{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 18px' }}><RoleChip role={u.role} /></td>
                                                <td style={{ padding: '14px 18px', color: TEXT, fontWeight: 600 }}>{u.sessions}</td>
                                                <td style={{ padding: '14px 18px', color: MUTED, fontSize: 12 }}>
                                                    {u.lastSession ? new Date(u.lastSession).toLocaleDateString() : '—'}
                                                </td>
                                                <td style={{ padding: '14px 18px', color: MUTED, fontSize: 12 }}>
                                                    {u.lastSignIn ? new Date(u.lastSignIn).toLocaleDateString() : '—'}
                                                </td>
                                                <td style={{ padding: '14px 18px' }}>
                                                    <select
                                                        value={u.role}
                                                        onChange={e => handleRoleChange(u.uid, e.target.value)}
                                                        style={{
                                                            background: CARD, border: `1px solid ${BORDER}`,
                                                            color: TEXT, borderRadius: 8, padding: '5px 10px', fontSize: 12, cursor: 'pointer'
                                                        }}
                                                    >
                                                        <option value="student">Student</option>
                                                        <option value="mentor">Mentor</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredUsers.length === 0 && !usersLoading && (
                                            <tr>
                                                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: MUTED }}>
                                                    No users found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── MENTORS TAB ────────────────────────────────────────────── */}
                {!loading && activeTab === 'mentors' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
                        {/* Left: Add Mentor Form */}
                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 22, height: 'fit-content' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: '0 0 16px' }}>Add Real Mentor</h3>
                            
                            {mentorSuccess && <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80', padding: 10, borderRadius: 10, fontSize: 12, marginBottom: 14 }}>{mentorSuccess}</div>}
                            {mentorError && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', padding: 10, borderRadius: 10, fontSize: 12, marginBottom: 14 }}>{mentorError}</div>}
                            
                            <form onSubmit={handleAddMentor} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Full Name</label>
                                    <input value={mentorForm.name} onChange={e => setMentorForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" style={{ width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 12, outline: 'none' }} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Email</label>
                                    <input type="email" value={mentorForm.email} onChange={e => setMentorForm(f => ({ ...f, email: e.target.value }))} placeholder="john@company.com" style={{ width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 12, outline: 'none' }} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Password</label>
                                    <input type="password" value={mentorForm.password} onChange={e => setMentorForm(f => ({ ...f, password: e.target.value }))} placeholder="At least 6 chars" style={{ width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 12, outline: 'none' }} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Designation</label>
                                    <input value={mentorForm.designation} onChange={e => setMentorForm(f => ({ ...f, designation: e.target.value }))} placeholder="E.g. Tech Lead" style={{ width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 12, outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Company</label>
                                    <input value={mentorForm.company} onChange={e => setMentorForm(f => ({ ...f, company: e.target.value }))} placeholder="E.g. Google" style={{ width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 12, outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Skills (comma-separated)</label>
                                    <input value={mentorForm.skills} onChange={e => setMentorForm(f => ({ ...f, skills: e.target.value }))} placeholder="React, Node.js, Systems" style={{ width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 12, outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Biography</label>
                                    <textarea value={mentorForm.profileInfo} onChange={e => setMentorForm(f => ({ ...f, profileInfo: e.target.value }))} placeholder="A short description..." rows={3} style={{ width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 12, outline: 'none', resize: 'vertical' }} />
                                </div>
                                <button type="submit" disabled={addingMentor} style={{ padding: '10px 14px', borderRadius: 10, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 6 }}>
                                    {addingMentor ? 'Adding...' : 'Add Mentor'}
                                </button>
                            </form>
                        </div>

                        {/* Right: Mentors List */}
                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
                                <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT, margin: 0 }}>Real Mentor Directory</h3>
                                <p style={{ fontSize: 11, color: MUTED, margin: '2px 0 0' }}>{mentorsLoading ? 'Loading mentors...' : `${mentors.length} active mentors`}</p>
                            </div>
                            
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                                            {['Mentor', 'Details', 'Expertise', 'Actions'].map(h => (
                                                <th key={h} style={{ padding: '12px 18px', textAlign: 'left', color: MUTED, fontWeight: 600 }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mentors.map((m, i) => (
                                            <tr key={m.uid} style={{ borderBottom: i < mentors.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                                                <td style={{ padding: '14px 18px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                                                            {m.name[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p style={{ margin: 0, color: TEXT, fontWeight: 600 }}>{m.name}</p>
                                                            <p style={{ margin: 0, color: MUTED, fontSize: 11 }}>{m.email}</p>
                                                            <p style={{ margin: '2px 0 0', color: ACCENT, fontSize: 10, fontFamily: 'monospace' }}>{m.mentorId}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 18px' }}>
                                                    <p style={{ margin: 0, color: TEXT, fontWeight: 500 }}>{m.designation || 'N/A'}</p>
                                                    <p style={{ margin: 0, color: MUTED, fontSize: 11 }}>{m.company || 'N/A'}</p>
                                                </td>
                                                <td style={{ padding: '14px 18px' }}>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                        {m.skills?.map(s => (
                                                            <span key={s} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>{s}</span>
                                                        ))}
                                                        {(!m.skills || m.skills.length === 0) && <span style={{ color: MUTED, fontSize: 11 }}>None</span>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 18px' }}>
                                                    <button onClick={() => handleDeleteMentor(m.uid)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {mentors.length === 0 && !mentorsLoading && (
                                            <tr>
                                                <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: MUTED }}>No real mentors added yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── API USAGE TAB ─────────────────────────────────────────── */}
                {!loading && activeTab === 'api-usage' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 22 }}>
                            <SectionTitle icon={Cpu} title="API Calls Per Endpoint (7 days)" subtitle="Showing top 8 endpoints" color={PURPLE} />
                            {usageChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={usageChartData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={100} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="calls" fill={ACCENT} radius={[0, 6, 6, 0]} name="Calls" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: MUTED }}>No usage data yet</div>
                            )}
                        </div>

                        {/* Endpoint table */}
                        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
                                <p style={{ margin: 0, fontWeight: 700, color: TEXT, fontSize: 14 }}>Endpoint Breakdown</p>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                        <tr>
                                            {['Endpoint', 'Calls', 'Tokens', 'Est. Cost', 'Errors', 'Avg Latency'].map(h => (
                                                <th key={h} style={{ padding: '12px 18px', textAlign: 'left', color: MUTED, fontWeight: 600, borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usage.map((u, i) => (
                                            <tr key={u._id} style={{ borderBottom: i < usage.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                                                <td style={{ padding: '12px 18px', color: '#818cf8', fontFamily: 'monospace', fontSize: 12 }}>{u._id}</td>
                                                <td style={{ padding: '12px 18px', color: TEXT, fontWeight: 600 }}>{u.calls?.toLocaleString()}</td>
                                                <td style={{ padding: '12px 18px', color: MUTED }}>{u.tokens?.toLocaleString()}</td>
                                                <td style={{ padding: '12px 18px', color: GREEN, fontWeight: 600 }}>${(u.cost || 0).toFixed(4)}</td>
                                                <td style={{ padding: '12px 18px', color: u.errors > 0 ? RED : MUTED }}>{u.errors}</td>
                                                <td style={{ padding: '12px 18px', color: MUTED }}>{Math.round(u.avgLatencyMs || 0)}ms</td>
                                            </tr>
                                        ))}
                                        {usage.length === 0 && (
                                            <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: MUTED }}>No API data yet</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── LOGS TAB ──────────────────────────────────────────────── */}
                {!loading && activeTab === 'logs' && (
                    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between' }}>
                            <p style={{ margin: 0, fontWeight: 700, color: TEXT, fontSize: 14 }}>Recent API Logs</p>
                            <p style={{ margin: 0, color: MUTED, fontSize: 12 }}>Last 100 calls</p>
                        </div>
                        <div style={{ maxHeight: 520, overflowY: 'auto' }}>
                            {logs.map((log, i) => (
                                <div key={i} style={{
                                    padding: '12px 20px',
                                    borderBottom: i < logs.length - 1 ? `1px solid ${BORDER}` : 'none',
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    background: log.isError ? `${RED}06` : 'transparent'
                                }}>
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                                        background: log.isError ? `${RED}20` : `${GREEN}20`,
                                        color: log.isError ? RED : GREEN,
                                        minWidth: 32, textAlign: 'center'
                                    }}>{log.statusCode}</span>
                                    <span style={{ color: '#818cf8', fontFamily: 'monospace', fontSize: 12, flex: 1 }}>{log.endpoint}</span>
                                    <span style={{ color: MUTED, fontSize: 11 }}>{log.tokensUsed ? `${log.tokensUsed} tok` : ''}</span>
                                    <span style={{ color: log.latencyMs > 3000 ? AMBER : MUTED, fontSize: 11 }}>{log.latencyMs}ms</span>
                                    <span style={{ color: MUTED, fontSize: 11 }}>{new Date(log.createdAt).toLocaleTimeString()}</span>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div style={{ padding: 40, textAlign: 'center', color: MUTED, fontSize: 13 }}>No logs yet</div>
                            )}
                        </div>
                    </div>
                )}

            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

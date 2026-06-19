import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Sparkles, Mic, Video, History, TrendingUp,
  Map, Users, FileBarChart, GraduationCap, LogOut, ChevronLeft,
  Activity, ShieldAlert, MessageSquare
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const navGroups = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true }
    ]
  },
  {
    title: 'Core Journey',
    items: [
      { to: '/dashboard/workflow', label: 'My Journey', icon: Sparkles },
      { to: '/dashboard/roadmap', label: 'Improvement Roadmap', icon: Map }
    ]
  },
  {
    title: 'AI Practice',
    items: [
      { to: '/dashboard/interview', label: 'Text Interview', icon: Mic },
      { to: '/dashboard/video-interview', label: 'Video Interview', icon: Video },
      { to: '/dashboard/interview-history', label: 'Interview History', icon: History }
    ]
  },
  {
    title: 'Performance',
    items: [
      { to: '/dashboard/progress', label: 'Progress Tracking', icon: Activity },
      { to: '/dashboard/analytics', label: 'Analytics', icon: TrendingUp },
      { to: '/dashboard/report', label: 'Reports', icon: FileBarChart }
    ]
  },
  {
    title: 'Mentorship',
    items: [
      { to: '/dashboard/mentors', label: 'Discover Mentors', icon: Users },
      { to: '/dashboard/chat', label: 'Chat with Mentors', icon: MessageSquare }
    ]
  },
  {
    title: 'Mentor Portal',
    items: [
      { to: '/dashboard/mentor-dashboard', label: 'Mentor Dashboard', icon: GraduationCap },
      { to: '/dashboard/chat', label: 'Chat with Mentees', icon: MessageSquare }
    ]
  },
  {
    title: 'System',
    items: [
      { to: '/admin', label: 'Admin Dashboard', icon: ShieldAlert }
    ]
  }
]

export default function Sidebar({ onLogout }) {
  const [collapsed, setCollapsed] = useState(false)
  const { userRole } = useAuth()

  // Filter mentor-only or admin-only items and map groups
  const visibleGroups = navGroups.map(group => {
    const items = group.items.filter(item => {
      // Admin Dashboard link is for admins only
      if (item.to === '/admin') {
        return userRole === 'admin'
      }

      // Mentor Portal items are for mentors or admins
      if (group.title === 'Mentor Portal') {
        return userRole === 'mentor' || userRole === 'admin'
      }

      // Student-specific pages (Core Journey, AI Practice, Performance, Mentorship)
      // Hidden for mentors (unless they are admin)
      if (['Core Journey', 'AI Practice', 'Performance', 'Mentorship'].includes(group.title)) {
        return userRole !== 'mentor'
      }

      return true
    })
    return { ...group, items }
  }).filter(group => group.items.length > 0)

  return (
    <aside className={`${collapsed ? 'w-[68px]' : 'w-60'} flex-shrink-0 flex flex-col h-full transition-all duration-300 ease-in-out relative`}
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>

      {/* Background gradient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-10 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-glow"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">Dream<span className="text-gradient">Role</span></span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg transition-all duration-300 ${collapsed ? 'rotate-180 mx-auto' : ''}`}
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="relative flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {visibleGroups.map(group => (
          <div key={group.title} className="space-y-0.5">
            {!collapsed && (
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-3 mb-1.5">
                {group.title}
              </div>
            )}
            {group.items.map(({ to, label, icon: Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group relative
                  ${isActive
                    ? 'text-white font-semibold'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                  }`
                }
                style={({ isActive }) => isActive ? {
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))',
                  border: '1px solid rgba(99,102,241,0.18)',
                  boxShadow: '0 0 15px rgba(99,102,241,0.05)',
                } : {
                  border: '1px solid transparent',
                }}
              >
                <Icon size={16} className="flex-shrink-0 animate-pulse-subtle group-hover:scale-110 transition-transform" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="relative p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
        >
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}

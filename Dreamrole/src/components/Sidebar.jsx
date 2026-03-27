import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Search, Trophy, BarChart3,
  Map, Users, FileBarChart, TrendingUp, Sparkles, LogOut, ChevronLeft, Mic
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/resume', label: 'Resume Upload', icon: FileText },
  { to: '/dashboard/role', label: 'Dream Role', icon: Search },
  { to: '/dashboard/skills', label: 'Skill Extraction', icon: Sparkles },
  { to: '/dashboard/gap', label: 'Skill Analysis', icon: BarChart3 },
  { to: '/dashboard/test', label: 'Evaluation Test', icon: Trophy },
  { to: '/dashboard/interview', label: 'Resume Interview', icon: Mic },
  { to: '/dashboard/analytics', label: 'Analytics', icon: TrendingUp },
  { to: '/dashboard/roadmap', label: 'Improvement Roadmap', icon: Map },
  { to: '/dashboard/mentors', label: 'Discover Mentors', icon: Users },
  { to: '/dashboard/report', label: 'Reports', icon: FileBarChart },
  { to: '/dashboard/progress', label: 'Progress Tracking', icon: TrendingUp },
]

export default function Sidebar({ onLogout }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} flex-shrink-0 bg-white border-r border-surface-200 flex flex-col h-full transition-all duration-300 ease-in-out`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-surface-200">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Sparkles size={13} className="text-white" />
            </div>
            <span className="font-bold text-slate-800">Dream<span className="text-brand-600">Role</span></span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg hover:bg-surface-100 text-slate-500 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
              ${isActive
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-surface-100 hover:text-brand-600'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-surface-200">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={17} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}

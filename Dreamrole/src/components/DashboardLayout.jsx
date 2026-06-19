import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { LogOut, Bell } from 'lucide-react'

export default function DashboardLayout() {
  const { currentUser, logout } = useAuth()
  const { clearSession } = useApp()
  const navigate = useNavigate()

  const handleLogout = async () => {
    clearSession()
    await logout()
    navigate('/auth')
  }

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Student'
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  const photoURL = currentUser?.photoURL

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#09090b' }}>
      <Sidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="px-6 py-3 flex items-center justify-between flex-shrink-0"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
          }}>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
              DreamRole Platform
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Notifications placeholder */}
            <button className="p-2 rounded-xl transition-all"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Bell size={16} />
            </button>

            {/* Divider */}
            <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.08)' }} />

            {/* Avatar (Clickable to go to Profile) */}
            <div onClick={() => navigate('/dashboard/profile')} className="flex items-center gap-3 cursor-pointer group hover:opacity-85 transition-all">
              {photoURL ? (
                <img src={photoURL} alt={displayName}
                  className="w-8 h-8 rounded-full object-cover group-hover:scale-105 transition-transform"
                  style={{ border: '2px solid rgba(99,102,241,0.3)' }}
                  referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold group-hover:scale-105 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {initials}
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-white/90 group-hover:text-indigo-300 transition-colors">{displayName}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{currentUser?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main content — scrollable area */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          {/* Subtle mesh gradient background */}
          <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(at 20% 10%, rgba(99,102,241,0.04) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(139,92,246,0.03) 0px, transparent 50%)' }} />
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../context/AuthContext'
import { LogOut } from 'lucide-react'

export default function DashboardLayout() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/auth')
  }

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Student'
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  const photoURL = currentUser?.photoURL

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      <Sidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-surface-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">DreamRole Platform</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Avatar — Google photo or initial */}
            {photoURL ? (
              <img src={photoURL} alt={displayName} className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-200" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-700">{displayName}</p>
              <p className="text-xs text-slate-400">{currentUser?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="ml-2 p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader, ShieldAlert } from 'lucide-react'

export default function RoleProtectedRoute({ children, allowedRoles = [] }) {
    const { currentUser, userRole, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090b' }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse shadow-glow"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        <Loader size={22} className="text-white animate-spin" />
                    </div>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Verifying access...</p>
                </div>
            </div>
        )
    }

    if (!currentUser) {
        return <Navigate to="/auth" state={{ from: location }} replace />
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090b' }}>
                <div className="glass-card max-w-md text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <ShieldAlert size={28} style={{ color: '#f87171' }} />
                    </div>
                    <h2 className="text-xl font-bold text-white">Access Denied</h2>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        You don't have permission to access this page.
                        This area is restricted to <strong className="text-white/80">{allowedRoles.join(' / ')}</strong> users.
                    </p>
                    <a href="/dashboard" className="btn-primary inline-flex items-center gap-2">
                        Go to Dashboard
                    </a>
                </div>
            </div>
        )
    }

    return children
}

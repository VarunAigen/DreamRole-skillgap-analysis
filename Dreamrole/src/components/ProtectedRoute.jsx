import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader } from 'lucide-react'

export default function ProtectedRoute({ children }) {
    const { currentUser, loading } = useAuth()
    const location = useLocation()

    // Show spinner while Firebase checks session (prevents flash of login page)
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center animate-pulse">
                        <Loader size={20} className="text-white animate-spin" />
                    </div>
                    <p className="text-sm text-slate-500">Loading DreamRole...</p>
                </div>
            </div>
        )
    }

    if (!currentUser) {
        // Preserve intended destination so user is redirected back after login
        return <Navigate to="/auth" state={{ from: location }} replace />
    }

    return children
}

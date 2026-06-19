import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader } from 'lucide-react'

export default function ProtectedRoute({ children }) {
    const { currentUser, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090b' }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse shadow-glow"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        <Loader size={22} className="text-white animate-spin" />
                    </div>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading DreamRole...</p>
                </div>
            </div>
        )
    }

    if (!currentUser) {
        return <Navigate to="/auth" state={{ from: location }} replace />
    }

    return children
}

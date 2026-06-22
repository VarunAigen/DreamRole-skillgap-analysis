import { createContext, useContext, useState, useEffect } from 'react'
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null)
    const [userRole, setUserRole] = useState(null) // 'admin' | 'mentor' | 'student' | null
    const [loading, setLoading] = useState(true)   // true while Firebase checks session

    // ── Hardcoded admin emails (always treated as admin) ──────────────────────
    const ADMIN_EMAILS = new Set([
        'varun1973s@gmail.com',
    ])

    // Listen to auth state changes
    useEffect(() => {
        const BASE_URL = import.meta.env.VITE_API_URL || ''
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user)
            if (user) {
                // 1. Hardcoded admin email override — highest priority
                if (ADMIN_EMAILS.has(user.email?.toLowerCase())) {
                    setUserRole('admin')
                    setLoading(false)
                    return
                }

                try {
                    // 2. Force-refresh token to get latest custom claims (role)
                    const tokenResult = await user.getIdTokenResult(true)
                    const claimRole = tokenResult.claims?.role

                    if (claimRole) {
                        // Role embedded in Firebase token — use directly
                        setUserRole(claimRole)
                    } else if (BASE_URL) {
                        // 3. No claim — try backend as fallback
                        try {
                            const token = tokenResult.token
                            const res = await fetch(`${BASE_URL}/api/auth/me`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            })
                            if (res.ok) {
                                const data = await res.json()
                                setUserRole(data.role || 'student')
                            } else {
                                setUserRole('student')
                            }
                        } catch {
                            setUserRole('student')
                        }
                    } else {
                        setUserRole('student')
                    }
                } catch {
                    setUserRole('student')
                }
            } else {
                setUserRole(null)
            }
            setLoading(false)
        })
        return unsubscribe
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Create user profile doc in Firestore
    const createUserProfile = async (user, extraData = {}) => {
        const ref = doc(db, 'users', user.uid)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
            await setDoc(ref, {
                name: extraData.name || user.displayName || '',
                email: user.email,
                created_at: serverTimestamp(),
                photo_url: user.photoURL || ''
            })
        }
    }

    // Email / password sign-up
    const signup = async (email, password, name) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName: name })
        await createUserProfile(cred.user, { name })
        return cred.user
    }

    // Email / password login
    const login = async (email, password) => {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        return cred.user
    }

    // Google sign-in
    const loginWithGoogle = async () => {
        const cred = await signInWithPopup(auth, googleProvider)
        try {
            await createUserProfile(cred.user)
        } catch (e) {
            console.warn('Failed to create user profile document during Google Sign-in', e)
        }
        return cred.user
    }

    // Sign out
    const logout = () => signOut(auth)

    // Password reset
    const resetPassword = (email) => sendPasswordResetEmail(auth, email)

    const value = {
        currentUser,
        userRole,
        loading,
        signup,
        login,
        loginWithGoogle,
        logout,
        resetPassword
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
    return ctx
}

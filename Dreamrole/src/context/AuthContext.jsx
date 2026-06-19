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

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user)
            if (user) {
                // Fetch user role from backend
                try {
                    const token = await user.getIdToken()
                    const res = await fetch('/api/auth/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    const data = await res.json()
                    setUserRole(data.role || 'student')
                } catch {
                    setUserRole('student') // Default to student if role fetch fails
                }
            } else {
                setUserRole(null)
            }
            setLoading(false)
        })
        return unsubscribe
    }, [])

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

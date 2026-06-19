import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Sparkles, ArrowRight, Mail, Lock, User, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'

// Google "G" SVG icon
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { signup, login, loginWithGoogle, resetPassword } = useAuth()
  const { clearSession } = useApp()

  useEffect(() => { clearSession() }, [])

  const from = location.state?.from?.pathname || '/dashboard'
  const clearError = () => setError('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signup(form.email, form.password, form.name)
      } else {
        await login(form.email, form.password)
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(getFirebaseError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle()
      navigate(from, { replace: true })
    } catch (err) {
      setError(getFirebaseError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!form.email) {
      setError('Enter your email address first, then click Forgot Password.')
      return
    }
    try {
      await resetPassword(form.email)
      setResetSent(true)
      setError('')
    } catch (err) {
      setError(getFirebaseError(err.code))
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#09090b' }}>
      {/* Left panel — dark branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-[120px] animate-float"
            style={{ background: 'rgba(99,102,241,0.15)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[140px] animate-float"
            style={{ background: 'rgba(139,92,246,0.1)', animationDelay: '3s' }} />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        <div className="relative">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-glow"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">Dream<span className="text-gradient">Role</span></span>
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-5 tracking-tight">
            Your career<br />journey starts here.
          </h2>
          <p className="text-lg leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Analyze your gaps, build skills, get mentored, and land the role you've always wanted.
          </p>
        </div>
        <div className="relative space-y-4">
          {['Skill gap analysis powered by AI', 'Personalized improvement roadmap', 'AI mock interviews with emotion tracking'].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: '#818cf8' }} />
              </div>
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">Dream<span className="text-gradient">Role</span></span>
          </div>

          <div className="glass-card">
            {/* Mode toggle */}
            <div className="flex rounded-xl p-1 mb-8 gap-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {['login', 'signup'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); clearError(); setResetSent(false) }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all duration-200"
                  style={mode === m ? {
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99,102,241,0.2)',
                  } : {
                    color: 'rgba(255,255,255,0.35)',
                    border: '1px solid transparent',
                  }}
                >
                  {m === 'login' ? 'Login' : 'Sign Up'}
                </button>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {mode === 'login' ? 'Login to your DreamRole dashboard.' : 'Start your skill journey today.'}
            </p>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl mb-4 text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Reset sent */}
            {resetSent && (
              <div className="p-3 rounded-xl mb-4 text-sm"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>
                ✓ Password reset email sent! Check your inbox.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
                  <input type="text" placeholder="Full Name" required className="input-field pl-10"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
              )}
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
                <input type="email" placeholder="Email Address" required className="input-field pl-10"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
                <input type={showPass ? 'text' : 'password'} placeholder="Password" required minLength={6}
                  className="input-field pl-10 pr-10"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {mode === 'login' && (
                <div className="text-right">
                  <button type="button" onClick={handleForgotPassword}
                    className="text-xs font-medium hover:underline" style={{ color: '#818cf8' }}>
                    Forgot password?
                  </button>
                </div>
              )}

              <button type="submit" disabled={loading}
                className={`btn-primary w-full justify-center py-3 text-base mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                {loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Create Account')}
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>or continue with</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>

            {/* Google */}
            <button onClick={handleGoogle} disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl transition-all text-sm font-medium"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); clearError() }}
                className="font-semibold hover:underline" style={{ color: '#818cf8' }}>
                {mode === 'login' ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function getFirebaseError(code) {
  const map = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'This email is already registered. Try logging in.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/too-many-requests': 'Too many failed attempts. Please wait a moment.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  }
  return map[code] || 'Something went wrong. Please try again.'
}

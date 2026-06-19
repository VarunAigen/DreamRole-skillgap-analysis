import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, LogIn, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <nav className="sticky top-0 z-50" style={{
      background: 'rgba(9,9,11,0.7)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-glow"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">Dream<span className="text-gradient">Role</span></span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how" className="text-sm font-medium transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
            How It Works
          </a>
          <a href="#features" className="text-sm font-medium transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
            Features
          </a>
          <button onClick={() => navigate('/auth')} className="btn-secondary text-xs">
            <LogIn size={14} /> Login
          </button>
          <button onClick={() => navigate('/auth')} className="btn-primary text-xs">
            Get Started
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)} style={{ color: 'rgba(255,255,255,0.6)' }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-4 py-4 flex flex-col gap-3 animate-fade-in-down"
          style={{ background: 'rgba(9,9,11,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <a href="#how" onClick={() => setOpen(false)} className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>How It Works</a>
          <a href="#features" onClick={() => setOpen(false)} className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Features</a>
          <button onClick={() => { setOpen(false); navigate('/auth') }} className="btn-secondary w-full justify-center">Login</button>
          <button onClick={() => { setOpen(false); navigate('/auth') }} className="btn-primary w-full justify-center">Get Started</button>
        </div>
      )}
    </nav>
  )
}

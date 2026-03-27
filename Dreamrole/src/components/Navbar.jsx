import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, LogIn, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-surface-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg text-slate-800">Dream<span className="text-brand-600">Role</span></span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how" className="text-sm text-slate-600 hover:text-brand-600 font-medium transition-colors">How It Works</a>
          <a href="#features" className="text-sm text-slate-600 hover:text-brand-600 font-medium transition-colors">Features</a>
          <button onClick={() => navigate('/auth')} className="btn-secondary">
            <LogIn size={15} /> Login
          </button>
          <button onClick={() => navigate('/auth')} className="btn-primary">
            Get Started
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-surface-200 px-4 py-4 flex flex-col gap-3">
          <a href="#how" onClick={() => setOpen(false)} className="text-sm text-slate-600 font-medium">How It Works</a>
          <a href="#features" onClick={() => setOpen(false)} className="text-sm text-slate-600 font-medium">Features</a>
          <button onClick={() => { setOpen(false); navigate('/auth') }} className="btn-secondary w-full justify-center">Login</button>
          <button onClick={() => { setOpen(false); navigate('/auth') }} className="btn-primary w-full justify-center">Get Started</button>
        </div>
      )}
    </nav>
  )
}

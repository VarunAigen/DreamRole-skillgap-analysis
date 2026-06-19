import Navbar from '../components/Navbar'
import { useNavigate } from 'react-router-dom'
import {
  UploadCloud, Search, TrendingUp, FileText,
  Target, ClipboardCheck, Lightbulb, Award, Users, ArrowRight, Star, ChevronRight,
  Sparkles, Video, Brain, Zap
} from 'lucide-react'

const features = [
  { icon: FileText, title: 'Resume Analysis', desc: 'Upload your resume and automatically extract your skills, experience, and technologies.', color: '#6366f1' },
  { icon: Target, title: 'Dream Role Alignment', desc: 'Compare your profile against real industry role requirements instantly.', color: '#8b5cf6' },
  { icon: ClipboardCheck, title: 'Self Evaluation Tests', desc: 'Take role-specific MCQ tests to benchmark your current knowledge level.', color: '#06b6d4' },
  { icon: Video, title: 'AI Mock Interviews', desc: 'Practice with AI-powered video interviews complete with emotion and voice analysis.', color: '#f59e0b' },
  { icon: Lightbulb, title: 'Project Recommendations', desc: 'Get curated hands-on projects to build your portfolio and bridge skill gaps.', color: '#22c55e' },
  { icon: Users, title: 'AI Mentor Guidance', desc: 'Chat with industry-persona mentors who guide your career journey.', color: '#f43f5e' },
]

const steps = [
  { num: '01', icon: UploadCloud, title: 'Upload Resume', desc: 'Upload your PDF resume in seconds. Our AI extracts every skill and technology.' },
  { num: '02', icon: Brain, title: 'AI Analysis', desc: 'We analyze your skills against real industry requirements and identify gaps.' },
  { num: '03', icon: Zap, title: 'Get Your Roadmap', desc: 'Receive personalized projects, certs, and interview prep to close the gap.' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ background: '#09090b' }}>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: '90vh' }}>
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] animate-float"
            style={{ background: 'rgba(99,102,241,0.12)' }} />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[140px] animate-float"
            style={{ background: 'rgba(139,92,246,0.08)', animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full blur-[100px]"
            style={{ background: 'rgba(6,182,212,0.06)' }} />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in-down"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
            <Star size={13} className="text-amber-400" />
            AI-Powered Career Intelligence Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6 animate-fade-in-up">
            <span className="text-white">Land Your</span>
            <br />
            <span className="text-gradient" style={{ backgroundSize: '200% 200%', animation: 'gradientShift 4s ease infinite' }}>
              Dream Role
            </span>
          </h1>

          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up animate-stagger-2"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            Analyze your skill gaps with AI, practice mock interviews with emotion detection,
            and get a personalized roadmap to accelerate your career growth.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animate-stagger-3">
            <button
              onClick={() => navigate('/auth')}
              className="btn-primary text-base px-8 py-4 rounded-2xl"
            >
              Get Started Free <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="btn-secondary text-base px-8 py-4 rounded-2xl"
            >
              Login to Dashboard
            </button>
          </div>

          {/* Stats */}
          <div className="mt-24 grid grid-cols-3 gap-6 max-w-lg mx-auto animate-fade-in-up animate-stagger-4">
            {[['500+', 'Students'], ['95%', 'Satisfaction'], ['50+', 'Roles']].map(([num, label]) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold text-white">{num}</p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="badge-brand mb-4 inline-flex">Simple Process</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">How DreamRole Works</h2>
            <p className="mt-4 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Three simple steps to accelerate your career journey and close the gap.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={step.num} className="relative group">
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute top-10 -right-3 z-10" size={20}
                    style={{ color: 'rgba(99,102,241,0.3)' }} />
                )}
                <div className="glass-card text-center group-hover:border-brand-500/20 transition-all duration-300">
                  <span className="text-5xl font-extrabold block mb-5" style={{ color: 'rgba(99,102,241,0.15)' }}>{step.num}</span>
                  <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-5 shadow-glow"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    <step.icon size={24} className="text-white" />
                  </div>
                  <h3 className="font-bold text-white mb-2 text-lg">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="badge-brand mb-4 inline-flex">Platform Features</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">Everything You Need to Grow</h2>
            <p className="mt-4 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
              From resume analysis to AI mentor connections — all the tools to land that dream role.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="glass-card card-hover group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300"
                  style={{ background: `${f.color}15`, border: `1px solid ${f.color}20` }}>
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))' }} />
        <div className="absolute inset-0" style={{ borderTop: '1px solid rgba(99,102,241,0.15)', borderBottom: '1px solid rgba(99,102,241,0.15)' }} />
        <div className="relative max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 tracking-tight">Ready to close the skill gap?</h2>
          <p className="mb-10" style={{ color: 'rgba(255,255,255,0.45)' }}>Join hundreds of students who've already started their career transformation.</p>
          <button
            onClick={() => navigate('/auth')}
            className="btn-primary text-base px-8 py-4 rounded-2xl"
          >
            Start Your Journey <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="text-white font-bold">DreamRole</span>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 DreamRole. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

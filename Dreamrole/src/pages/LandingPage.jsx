import Navbar from '../components/Navbar'
import { useNavigate } from 'react-router-dom'
import {
  UploadCloud, Search, TrendingUp, FileText,
  Target, ClipboardCheck, Lightbulb, Award, Users, ArrowRight, Star, ChevronRight
} from 'lucide-react'

const features = [
  { icon: FileText, title: 'Resume Analysis', desc: 'Upload your resume and automatically extract your skills, experience, and technologies.' },
  { icon: Target, title: 'Dream Role Alignment', desc: 'Compare your profile against real industry role requirements instantly.' },
  { icon: ClipboardCheck, title: 'Self Evaluation Tests', desc: 'Take role-specific MCQ tests to benchmark your current knowledge level.' },
  { icon: Lightbulb, title: 'Project Recommendations', desc: 'Get curated hands-on projects to build your portfolio and bridge skill gaps.' },
  { icon: Award, title: 'Certification Suggestions', desc: 'Discover the most relevant certifications to accelerate your career growth.' },
  { icon: Users, title: 'Mentor Guidance', desc: 'Connect with industry professionals who can guide your career journey.' },
]

const steps = [
  { num: '01', icon: UploadCloud, title: 'Upload Resume', desc: 'Upload your PDF resume in seconds.' },
  { num: '02', icon: Search, title: 'Analyze Skill Gap', desc: 'We compare your skills against role requirements.' },
  { num: '03', icon: TrendingUp, title: 'Improve Skills', desc: 'Follow your personalized roadmap to success.' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-brand-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-sm font-medium mb-8 backdrop-blur-sm">
            <Star size={13} className="text-amber-400" />
            AI-Powered Resume Analysis Platform
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6">
            Land Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-purple-300"> Dream Role</span>
          </h1>
          <p className="text-lg sm:text-xl text-brand-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            Analyze your skill gaps, align with industry requirements, take self-evaluation tests, and get a personalized roadmap to accelerate your career growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/auth')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-700 font-bold rounded-xl hover:bg-brand-50 transition-all text-base shadow-lg hover:shadow-xl"
            >
              Get Started Free <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-base backdrop-blur-sm"
            >
              Login to Dashboard
            </button>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[['500+', 'Students'], ['95%', 'Satisfaction'], ['50+', 'Roles']].map(([num, label]) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold text-white">{num}</p>
                <p className="text-sm text-brand-300 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave */}
        <svg viewBox="0 0 1440 60" className="w-full" xmlns="http://www.w3.org/2000/svg">
          <path fill="#f8fafc" d="M0,32L80,26.7C160,21,320,11,480,16C640,21,800,43,960,48C1120,53,1280,43,1360,37.3L1440,32L1440,60L0,60Z" />
        </svg>
      </section>

      {/* How It Works */}
      <section id="how" className="py-24 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="badge-brand mb-3">Simple Process</span>
            <h2 className="section-heading text-3xl mt-2">How DreamRole Works</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Three simple steps to accelerate your career journey and close the gap between where you are and where you want to be.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute top-8 -right-4 text-brand-300 z-10" size={24} />
                )}
                <div className="card text-center hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200">
                  <span className="text-4xl font-extrabold text-brand-100 block mb-4">{step.num}</span>
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-600 flex items-center justify-center text-white mb-4 shadow">
                    <step.icon size={24} />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="badge-brand mb-3">Platform Features</span>
            <h2 className="section-heading text-3xl mt-2">Everything You Need to Grow</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">From resume analysis to mentor connections — all the tools to close your skill gap and land that dream role.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="card card-hover group">
                <div className="w-12 h-12 rounded-xl bg-brand-50 group-hover:bg-brand-600 flex items-center justify-center text-brand-600 group-hover:text-white transition-all duration-200 mb-4">
                  <f.icon size={22} />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-brand-600 to-brand-800">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-extrabold text-white mb-4">Ready to close the skill gap?</h2>
          <p className="text-brand-200 mb-8">Join hundreds of students who've already started their career transformation.</p>
          <button
            onClick={() => navigate('/auth')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-700 font-bold rounded-xl hover:bg-brand-50 transition-all shadow-lg"
          >
            Start Your Journey <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Target size={13} className="text-white" />
            </div>
            <span className="text-white font-bold">DreamRole</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
          <p className="text-xs">© 2026 DreamRole. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

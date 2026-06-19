import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { authFetch } from '../lib/api'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, Building2, MapPin, Clock, Loader, ChevronRight,
    Zap, CheckCircle2, AlertCircle, MessageSquare, Send, Map,
    Star, BarChart3, Briefcase, Target
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const categoryColors = {
    'AI/ML': '#7c3aed', 'Data Science': '#2563eb', 'Backend': '#059669',
    'Frontend': '#d97706', 'DevOps': '#ea580c', 'Cloud': '#0891b2',
    'Cybersecurity': '#dc2626', 'Product': '#db2777'
}

const TABS = [
    { id: 'profile', label: 'Profile', icon: Briefcase },
    { id: 'roadmap', label: 'Career Path', icon: Map },
    { id: 'skillgap', label: 'Skill Gap', icon: BarChart3 },
    { id: 'chat', label: 'Chat', icon: MessageSquare }
]

// ─── Career Path Roadmap Tab ──────────────────────────────────────────────────
function RoadmapTab({ persona, studentSkills }) {
    const [roadmap, setRoadmap] = useState([])
    const [loading, setLoading] = useState(false)
    const [generated, setGenerated] = useState(false)

    const generate = async () => {
        setLoading(true)
        try {
            const res = await authFetch(`/api/personas/${persona.id}/roadmap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_skills: studentSkills })
            })
            const data = await res.json()
            if (data.roadmap) { setRoadmap(data.roadmap); setGenerated(true) }
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    useEffect(() => { generate() }, [])

    if (loading) return (
        <div className="flex items-center gap-3 text-indigo-400 p-4">
            <Loader size={18} className="animate-spin" />
            <span className="text-sm">Generating your personalized career roadmap...</span>
        </div>
    )

    return (
        <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-white/[0.02] to-white/[0.01] rounded-xl border border-indigo-500/20">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Target size={16} className="text-indigo-400" />
                    Career Path to Become a {persona.role}
                </h3>
                <p className="text-xs text-white/40 mt-1">Based on {persona.name}'s journey at {persona.company}</p>
            </div>

            <div className="space-y-3">
                {roadmap.map((step, i) => (
                    <div key={i} className="flex gap-4">
                        {/* Step number + connector */}
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                                {step.step}
                            </div>
                            {i < roadmap.length - 1 && <div className="w-0.5 h-full bg-indigo-500/15 mt-1 flex-1 min-h-4" />}
                        </div>
                        {/* Content */}
                        <div className="pb-4 flex-1">
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-semibold text-white text-sm">{step.title}</h4>
                                <span className="text-xs text-white/30 bg-white/[0.04] px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">{step.duration}</span>
                            </div>
                            <p className="text-xs text-white/60 leading-relaxed mb-2">{step.description}</p>
                            {step.skills_focus?.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {step.skills_focus.map(s => (
                                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{s}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {generated && (
                <button onClick={generate} className="btn-secondary text-xs">
                    <Zap size={13} /> Regenerate Roadmap
                </button>
            )}
        </div>
    )
}

// ─── Skill Gap Tab ────────────────────────────────────────────────────────────
function SkillGapTab({ persona }) {
    const [inputSkills, setInputSkills] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const { extractedSkills } = useApp()

    useEffect(() => {
        if (extractedSkills.length > 0) setInputSkills(extractedSkills.join(', '))
    }, [])

    const check = async () => {
        const skills = inputSkills.split(',').map(s => s.trim()).filter(Boolean)
        if (!skills.length) return
        setLoading(true)
        try {
            const res = await authFetch(`/api/personas/${persona.id}/skill-gap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_skills: skills })
            })
            const data = await res.json()
            if (data.success) setResult(data)
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    return (
        <div className="space-y-4">
            <div className="card bg-white/[0.02]">
                <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Your Current Skills</p>
                <textarea
                    className="w-full p-3 text-sm bg-transparent border border-white/[0.06] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-400"
                    rows={3}
                    placeholder="Enter your skills separated by commas, e.g. Python, SQL, React..."
                    value={inputSkills}
                    onChange={e => setInputSkills(e.target.value)}
                />
                <button
                    onClick={check}
                    disabled={loading || !inputSkills.trim()}
                    className={`btn-primary mt-2 ${loading || !inputSkills.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loading ? <><Loader size={14} className="animate-spin" /> Checking...</> : <><BarChart3 size={14} /> Check Skill Gap</>}
                </button>
            </div>

            {result && (
                <div className="space-y-3 animate-fade-in">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="card text-center p-3">
                            <p className="text-xl font-bold text-emerald-400">{result.total_known}</p>
                            <p className="text-xs text-white/40">Known</p>
                        </div>
                        <div className="card text-center p-3">
                            <p className="text-xl font-bold text-red-400">{result.total_missing}</p>
                            <p className="text-xs text-white/40">Missing</p>
                        </div>
                        <div className="card text-center p-3">
                            <p className="text-xl font-bold text-white/80">{result.total_required}</p>
                            <p className="text-xs text-white/40">Required</p>
                        </div>
                    </div>

                    {/* Known */}
                    {result.known_skills?.length > 0 && (
                        <div className="card">
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle2 size={15} className="text-emerald-500" />
                                <p className="text-sm font-semibold text-white/80">Skills You Already Have</p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {result.known_skills.map(s => (
                                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Missing */}
                    {result.missing_skills?.length > 0 && (
                        <div className="card">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertCircle size={15} className="text-red-400" />
                                <p className="text-sm font-semibold text-white/80">Skills to Learn</p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {result.missing_skills.map(s => (
                                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-700 border border-red-500/20">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────
function ChatTab({ persona }) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `Hello! I'm ${persona.name}, working as a ${persona.role} at ${persona.company}. I'm here to help guide your career path, suggest improvements, and answer any questions you might have about this domain. What would you like to discuss today?`
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const chatBottom = useRef(null)

    useEffect(() => {
        chatBottom.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (text, isOpening = false) => {
        const userMsg = text ? { role: 'user', content: text } : null
        const newMessages = userMsg ? [...messages, userMsg] : messages
        if (userMsg) setMessages(newMessages)
        setLoading(true)
        setInput('')

        try {
            const res = await authFetch(`/api/personas/${persona.id}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    student_goal: `become a ${persona.role}`
                })
            })
            const data = await res.json()
            if (data.reply) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
            }
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    return (
        <div className="flex flex-col" style={{ height: '440px' }}>
            {/* Mentor identity strip */}
            <div className="flex items-center gap-2 p-3 bg-indigo-500/10 border-b border-indigo-500/20 rounded-t-xl flex-shrink-0">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: persona.avatar_color }}>
                    {persona.name[0]}
                </div>
                <div>
                    <p className="text-xs font-semibold text-white">{persona.name}</p>
                    <p className="text-xs text-white/40">{persona.role} at {persona.company}</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400 font-medium">AI Mentor</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-transparent">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-brand-600 text-white rounded-br-sm'
                                : 'bg-transparent text-white/80 border border-white/[0.06] rounded-bl-sm'
                            }`}>
                            <div className="prose-chat">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-transparent border border-white/[0.06] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" />
                                <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.4s' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatBottom} />
            </div>

            {/* Input */}
            <div className="p-3 bg-transparent border-t border-white/[0.06] flex items-center gap-2 flex-shrink-0 rounded-b-xl">
                <input
                    className="flex-1 text-sm px-3 py-2.5 bg-transparent border border-white/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                    placeholder={`Ask ${persona.name.split(' ')[0]} anything...`}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && input.trim()) sendMessage(input) }}
                    disabled={loading}
                />
                <button
                    onClick={() => input.trim() && sendMessage(input)}
                    disabled={loading || !input.trim()}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${input.trim() && !loading ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-white/[0.06] text-white/30'
                        }`}
                >
                    <Send size={15} />
                </button>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MentorProfilePage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { extractedSkills } = useApp()
    const [persona, setPersona] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('profile')

    useEffect(() => {
        authFetch(`/api/personas/${id}`)
            .then(r => r.json())
            .then(d => { if (d.persona) setPersona(d.persona) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [id])

    if (loading) return (
        <div className="card flex items-center gap-3 text-indigo-400 max-w-xl mx-auto">
            <Loader size={18} className="animate-spin" />
            <span className="text-sm">Loading mentor profile...</span>
        </div>
    )

    if (!persona) return (
        <div className="max-w-xl mx-auto card text-center space-y-3">
            <p className="text-white/60">Mentor not found.</p>
            <button onClick={() => navigate('/dashboard/mentors')} className="btn-primary mx-auto">Back to Mentors</button>
        </div>
    )

    const initials = persona.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    const domainColor = categoryColors[persona.category] || '#6366f1'

    return (
        <div className="max-w-3xl mx-auto space-y-5">
            {/* Back */}
            <button onClick={() => navigate('/dashboard/mentors')} className="btn-ghost text-sm">
                <ArrowLeft size={15} /> Back to Mentors
            </button>

            {/* Hero Profile Card */}
            <div className="card bg-gradient-to-br from-white/[0.02] to-white/[0.01] border-white/[0.06] overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Avatar */}
                    <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg"
                        style={{ backgroundColor: persona.avatar_color }}
                    >
                        {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h1 className="text-xl font-extrabold text-white">{persona.name}</h1>
                                <p className="text-indigo-400 font-semibold mt-0.5">{persona.role}</p>
                            </div>
                            <span className="text-xs px-3 py-1.5 rounded-full font-bold text-white flex-shrink-0"
                                style={{ backgroundColor: domainColor }}>
                                {persona.category}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-white/40">
                            <div className="flex items-center gap-1.5">
                                <Building2 size={13} className="text-white/30" />
                                <span className="font-medium">{persona.company}</span>
                                <span className="text-white/20">·</span>
                                <span className="text-white/30">{persona.company_type}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock size={13} className="text-white/30" />
                                <span>{persona.years_experience} years experience</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <MapPin size={13} className="text-white/30" />
                                <span>{persona.location}</span>
                            </div>
                        </div>

                        <p className="text-sm text-white/60 leading-relaxed mt-3">{persona.bio}</p>
                    </div>
                </div>

                {/* Domain + Skills */}
                <div className="mt-4 pt-4 border-t border-white/[0.04]">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Domain Expertise</p>
                    <p className="text-sm text-white/80 font-medium mb-3">{persona.domain}</p>
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Key Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                        {persona.skills.map(s => (
                            <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">{s}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Career Path Simulator Section */}
            <div className="card space-y-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
                        <Star size={15} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-white">Career Path Simulator</h2>
                        <p className="text-xs text-white/40">Explore career journey, check skill gaps, and chat with this mentor</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white/[0.04] p-1 rounded-xl">
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.id
                                        ? 'bg-transparent text-indigo-400 shadow-sm'
                                        : 'text-white/40 hover:text-white/80'
                                    }`}
                            >
                                <Icon size={13} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'profile' && (
                        <div className="space-y-3">
                            <p className="text-sm text-white/60 leading-relaxed">
                                Welcome to {persona.name}'s mentor profile. Use the tabs above to:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { tab: 'roadmap', icon: Map, title: 'Career Path', desc: `Get a personalized step-by-step roadmap to become a ${persona.role}`, color: 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300' },
                                    { tab: 'skillgap', icon: BarChart3, title: 'Skill Gap Check', desc: 'Compare your current skills with what this role requires', color: 'bg-purple-500/10 border-purple-500/20 text-purple-300' },
                                    { tab: 'chat', icon: MessageSquare, title: 'Chat with Mentor', desc: `Ask ${persona.name.split(' ')[0]} career questions and get real advice`, color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' }
                                ].map(item => {
                                    const Icon = item.icon
                                    return (
                                        <button
                                            key={item.tab}
                                            onClick={() => setActiveTab(item.tab)}
                                            className={`text-left p-3 rounded-xl border transition-all hover:shadow-sm ${item.color}`}
                                        >
                                            <Icon size={16} className="mb-1.5" />
                                            <p className="text-xs font-bold">{item.title}</p>
                                            <p className="text-xs opacity-80 mt-0.5 leading-relaxed">{item.desc}</p>
                                            <div className="flex items-center gap-1 mt-2 text-xs font-semibold">
                                                Open <ChevronRight size={12} />
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                    {activeTab === 'roadmap' && <RoadmapTab persona={persona} studentSkills={extractedSkills} />}
                    {activeTab === 'skillgap' && <SkillGapTab persona={persona} />}
                    {activeTab === 'chat' && <ChatTab persona={persona} />}
                </div>
            </div>
        </div>
    )
}

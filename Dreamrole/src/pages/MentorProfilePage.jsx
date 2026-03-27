import { useState, useEffect, useRef } from 'react'
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
            const res = await fetch(`/api/personas/${persona.id}/roadmap`, {
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
        <div className="flex items-center gap-3 text-brand-600 p-4">
            <Loader size={18} className="animate-spin" />
            <span className="text-sm">Generating your personalized career roadmap...</span>
        </div>
    )

    return (
        <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-brand-50 to-purple-50 rounded-xl border border-brand-100">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Target size={16} className="text-brand-600" />
                    Career Path to Become a {persona.role}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Based on {persona.name}'s journey at {persona.company}</p>
            </div>

            <div className="space-y-3">
                {roadmap.map((step, i) => (
                    <div key={i} className="flex gap-4">
                        {/* Step number + connector */}
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                                {step.step}
                            </div>
                            {i < roadmap.length - 1 && <div className="w-0.5 h-full bg-brand-100 mt-1 flex-1 min-h-4" />}
                        </div>
                        {/* Content */}
                        <div className="pb-4 flex-1">
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-semibold text-slate-800 text-sm">{step.title}</h4>
                                <span className="text-xs text-slate-400 bg-surface-100 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">{step.duration}</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed mb-2">{step.description}</p>
                            {step.skills_focus?.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {step.skills_focus.map(s => (
                                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100">{s}</span>
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
            const res = await fetch(`/api/personas/${persona.id}/skill-gap`, {
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
            <div className="card bg-slate-50">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Your Current Skills</p>
                <textarea
                    className="w-full p-3 text-sm bg-white border border-surface-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-400"
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
                            <p className="text-xl font-bold text-emerald-600">{result.total_known}</p>
                            <p className="text-xs text-slate-500">Known</p>
                        </div>
                        <div className="card text-center p-3">
                            <p className="text-xl font-bold text-red-500">{result.total_missing}</p>
                            <p className="text-xs text-slate-500">Missing</p>
                        </div>
                        <div className="card text-center p-3">
                            <p className="text-xl font-bold text-slate-700">{result.total_required}</p>
                            <p className="text-xs text-slate-500">Required</p>
                        </div>
                    </div>

                    {/* Known */}
                    {result.known_skills?.length > 0 && (
                        <div className="card">
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle2 size={15} className="text-emerald-500" />
                                <p className="text-sm font-semibold text-slate-700">Skills You Already Have</p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {result.known_skills.map(s => (
                                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Missing */}
                    {result.missing_skills?.length > 0 && (
                        <div className="card">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertCircle size={15} className="text-red-400" />
                                <p className="text-sm font-semibold text-slate-700">Skills to Learn</p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {result.missing_skills.map(s => (
                                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">{s}</span>
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
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const chatBottom = useRef(null)

    useEffect(() => {
        // Get opening message from mentor
        sendMessage(null, true)
    }, [])

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
            const res = await fetch(`/api/personas/${persona.id}/chat`, {
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
            <div className="flex items-center gap-2 p-3 bg-brand-50 border-b border-brand-100 rounded-t-xl flex-shrink-0">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: persona.avatar_color }}>
                    {persona.name[0]}
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-800">{persona.name}</p>
                    <p className="text-xs text-slate-500">{persona.role} at {persona.company}</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-600 font-medium">AI Mentor</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-surface-50">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-brand-600 text-white rounded-br-sm'
                                : 'bg-white text-slate-700 border border-surface-200 rounded-bl-sm'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-surface-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
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
            <div className="p-3 bg-white border-t border-surface-200 flex items-center gap-2 flex-shrink-0 rounded-b-xl">
                <input
                    className="flex-1 text-sm px-3 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                    placeholder={`Ask ${persona.name.split(' ')[0]} anything...`}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && input.trim()) sendMessage(input) }}
                    disabled={loading}
                />
                <button
                    onClick={() => input.trim() && sendMessage(input)}
                    disabled={loading || !input.trim()}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${input.trim() && !loading ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-surface-200 text-slate-400'
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
        fetch(`/api/personas/${id}`)
            .then(r => r.json())
            .then(d => { if (d.persona) setPersona(d.persona) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [id])

    if (loading) return (
        <div className="card flex items-center gap-3 text-brand-600 max-w-xl mx-auto">
            <Loader size={18} className="animate-spin" />
            <span className="text-sm">Loading mentor profile...</span>
        </div>
    )

    if (!persona) return (
        <div className="max-w-xl mx-auto card text-center space-y-3">
            <p className="text-slate-600">Mentor not found.</p>
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
            <div className="card bg-gradient-to-br from-slate-50 to-white border-surface-200 overflow-hidden">
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
                                <h1 className="text-xl font-extrabold text-slate-900">{persona.name}</h1>
                                <p className="text-brand-600 font-semibold mt-0.5">{persona.role}</p>
                            </div>
                            <span className="text-xs px-3 py-1.5 rounded-full font-bold text-white flex-shrink-0"
                                style={{ backgroundColor: domainColor }}>
                                {persona.category}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <Building2 size={13} className="text-slate-400" />
                                <span className="font-medium">{persona.company}</span>
                                <span className="text-slate-300">·</span>
                                <span className="text-slate-400">{persona.company_type}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock size={13} className="text-slate-400" />
                                <span>{persona.years_experience} years experience</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <MapPin size={13} className="text-slate-400" />
                                <span>{persona.location}</span>
                            </div>
                        </div>

                        <p className="text-sm text-slate-600 leading-relaxed mt-3">{persona.bio}</p>
                    </div>
                </div>

                {/* Domain + Skills */}
                <div className="mt-4 pt-4 border-t border-surface-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Domain Expertise</p>
                    <p className="text-sm text-slate-700 font-medium mb-3">{persona.domain}</p>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Key Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                        {persona.skills.map(s => (
                            <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100 font-medium">{s}</span>
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
                        <h2 className="font-bold text-slate-800">Career Path Simulator</h2>
                        <p className="text-xs text-slate-500">Explore career journey, check skill gaps, and chat with this mentor</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-surface-100 p-1 rounded-xl">
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.id
                                        ? 'bg-white text-brand-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
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
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Welcome to {persona.name}'s mentor profile. Use the tabs above to:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { tab: 'roadmap', icon: Map, title: 'Career Path', desc: `Get a personalized step-by-step roadmap to become a ${persona.role}`, color: 'bg-brand-50 border-brand-200 text-brand-700' },
                                    { tab: 'skillgap', icon: BarChart3, title: 'Skill Gap Check', desc: 'Compare your current skills with what this role requires', color: 'bg-purple-50 border-purple-200 text-purple-700' },
                                    { tab: 'chat', icon: MessageSquare, title: 'Chat with Mentor', desc: `Ask ${persona.name.split(' ')[0]} career questions and get real advice`, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' }
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

import { useState, useEffect } from 'react'
import { authFetch } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, MapPin, Building2, ChevronRight, Loader, Users, MessageSquare, Sparkles } from 'lucide-react'

const categoryColors = {
    'AI/ML': 'bg-purple-100 text-purple-400',
    'Data Science': 'bg-blue-100 text-blue-700',
    'Backend': 'bg-green-100 text-green-700',
    'Frontend': 'bg-yellow-100 text-yellow-700',
    'DevOps': 'bg-orange-100 text-orange-700',
    'Cloud': 'bg-cyan-100 text-cyan-700',
    'Cybersecurity': 'bg-red-100 text-red-700',
    'Product': 'bg-pink-100 text-pink-700',
}

function MentorCard({ persona, onClick }) {
    const catColor = categoryColors[persona.category] || 'bg-slate-100 text-white/60'
    const initials = persona.name.split(' ').map(n => n[0]).join('').substring(0, 2)

    return (
        <div
            onClick={() => onClick(persona.id)}
            className="card hover:shadow-lg hover:border-indigo-500/25 transition-all duration-200 cursor-pointer group"
        >
            <div className="flex items-start gap-3 mb-3">
                <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: persona.avatar_color }}
                >
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm leading-tight group-hover:text-indigo-400 transition-colors">{persona.name}</h3>
                    <p className="text-xs text-indigo-400 font-medium mt-0.5">{persona.role}</p>
                </div>
                <ChevronRight size={16} className="text-white/20 group-hover:text-brand-500 transition-colors flex-shrink-0 mt-1" />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-white/40 mb-2">
                <Building2 size={12} />
                <span className="font-medium">{persona.company}</span>
                <span className="text-white/20 mx-0.5">·</span>
                <span>{persona.years_experience}y exp</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-white/30 mb-3">
                <MapPin size={11} />
                <span>{persona.location}</span>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor}`}>{persona.category}</span>
                {persona.skills.slice(0, 3).map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-white/[0.04] text-white/40">{s}</span>
                ))}
                {persona.skills.length > 3 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.04] text-white/30">+{persona.skills.length - 3}</span>
                )}
            </div>

            <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{persona.bio}</p>
        </div>
    )
}

function RealMentorCard({ mentor, onConnect }) {
    const initials = mentor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    const [connecting, setConnecting] = useState(false)

    const handleConnectClick = async (e) => {
        e.stopPropagation()
        setConnecting(true)
        try {
            await onConnect(mentor)
        } finally {
            setConnecting(false)
        }
    }

    return (
        <div className="card hover:shadow-lg hover:border-indigo-500/25 transition-all duration-200">
            <div className="flex items-start gap-3 mb-3">
                <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}
                >
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm leading-tight">{mentor.name}</h3>
                    <p className="text-xs text-indigo-400 font-medium mt-0.5">{mentor.designation || 'Real Industry Mentor'}</p>
                </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-white/40 mb-3">
                <Building2 size={12} />
                <span className="font-medium">{mentor.company || 'N/A'}</span>
                <span className="text-white/20 mx-0.5">·</span>
                <span>Active Mentor</span>
            </div>

            {mentor.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {mentor.skills.slice(0, 4).map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{s}</span>
                    ))}
                    {mentor.skills.length > 4 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.04] text-white/30">+{mentor.skills.length - 4}</span>
                    )}
                </div>
            )}

            <p className="text-xs text-white/50 leading-relaxed mb-4 line-clamp-3">{mentor.profileInfo || 'No biography details provided.'}</p>

            <button
                onClick={handleConnectClick}
                disabled={connecting}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600/15 border border-indigo-600/35 hover:bg-indigo-600/25 transition-all text-xs font-semibold text-indigo-300 cursor-pointer disabled:opacity-50"
            >
                <MessageSquare size={13} />
                {connecting ? 'Connecting...' : 'Connect & Chat'}
            </button>
        </div>
    )
}

export default function MentorsDiscoverPage() {
    const [subMode, setSubMode] = useState('real') // 'real' (default) or 'chatbot'
    const [personas, setPersonas] = useState([])
    const [realMentors, setRealMentors] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        authFetch('/api/personas/categories')
            .then(r => r.json())
            .then(d => { if (d.categories) setCategories(d.categories) })
            .catch(console.error)
    }, [])

    // Load Chatbot personas
    useEffect(() => {
        if (subMode === 'chatbot') {
            setLoading(true)
            const params = new URLSearchParams()
            if (search) params.set('search', search)
            if (activeCategory) params.set('category', activeCategory)
            authFetch(`/api/personas?${params}`)
                .then(r => r.json())
                .then(d => { if (d.personas) setPersonas(d.personas) })
                .catch(console.error)
                .finally(() => setLoading(false))
        }
    }, [subMode, search, activeCategory])

    // Load Real mentors
    const loadRealMentors = () => {
        setLoading(true)
        authFetch('/api/mentors/real')
            .then(r => r.json())
            .then(d => { if (d.mentors) setRealMentors(d.mentors) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        if (subMode === 'real') {
            loadRealMentors()
        }
    }, [subMode])

    const handleConnectRealMentor = async (mentor) => {
        try {
            const res = await authFetch('/api/mentors/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mentorUid: mentor.uid })
            })
            const data = await res.json()
            if (data.success) {
                // Redirect directly to the chat page for that mentor
                navigate(`/dashboard/chat?recipientId=${mentor.uid}&name=${encodeURIComponent(mentor.name)}`)
            } else {
                alert(data.error || 'Failed to connect')
            }
        } catch (e) {
            console.error('Error linking with mentor:', e)
            alert('Connection failed')
        }
    }

    // Filter real mentors locally by search
    const filteredRealMentors = realMentors.filter(m => {
        if (!search) return true
        const s = search.toLowerCase()
        return m.name.toLowerCase().includes(s) ||
            m.designation?.toLowerCase().includes(s) ||
            m.company?.toLowerCase().includes(s) ||
            m.skills?.some(skill => skill.toLowerCase().includes(s))
    })

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="section-heading flex items-center gap-2">
                        <Users size={22} className="text-indigo-400" /> Discover Mentors
                    </h1>
                    <p className="section-sub">
                        {subMode === 'real'
                            ? 'Connect and chat with industry professionals linked directly to real individuals.'
                            : 'Explore career journeys from AI-guided simulated professionals across top companies.'
                        }
                    </p>
                </div>

                {/* Submode toggle */}
                <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.04] w-fit">
                    <button
                        onClick={() => { setSubMode('real'); setSearch(''); setActiveCategory('') }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${subMode === 'real' ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/20 shadow-sm' : 'text-white/40 hover:text-white/80'}`}
                    >
                        <Users size={13} /> Real Mentors
                    </button>
                    <button
                        onClick={() => { setSubMode('chatbot'); setSearch(''); setActiveCategory('') }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${subMode === 'chatbot' ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/20 shadow-sm' : 'text-white/40 hover:text-white/80'}`}
                    >
                        <Sparkles size={13} /> AI Chatbot Mentors
                    </button>
                </div>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        type="text"
                        placeholder="Search by name, role, or skill..."
                        className="input-field pl-9 w-full"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {subMode === 'chatbot' && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                        <Filter size={14} className="text-white/30 flex-shrink-0" />
                        <button
                            onClick={() => setActiveCategory('')}
                            className={`text-xs px-3 py-2 rounded-lg whitespace-nowrap font-medium transition-all ${!activeCategory ? 'bg-brand-600 text-white' : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.06]'}`}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat === activeCategory ? '' : cat)}
                                className={`text-xs px-3 py-2 rounded-lg whitespace-nowrap font-medium transition-all ${activeCategory === cat ? 'bg-brand-600 text-white' : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.06]'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Results */}
            {loading ? (
                <div className="card flex items-center gap-3 text-indigo-400">
                    <Loader size={18} className="animate-spin" />
                    <span className="text-sm">Loading mentors directory...</span>
                </div>
            ) : (
                <>
                    {subMode === 'chatbot' ? (
                        <>
                            <p className="text-xs text-white/30 font-medium">{personas.length} mentor{personas.length !== 1 ? 's' : ''} found</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {personas.map(p => (
                                    <MentorCard key={p.id} persona={p} onClick={(id) => navigate(`/dashboard/mentors/${id}`)} />
                                ))}
                            </div>
                            {personas.length === 0 && (
                                <div className="card text-center py-10 space-y-2">
                                    <p className="text-white/40 font-medium">No chatbot mentors found</p>
                                    <p className="text-sm text-white/30">Try a different search or category</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <p className="text-xs text-white/30 font-medium">{filteredRealMentors.length} mentor{filteredRealMentors.length !== 1 ? 's' : ''} found</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredRealMentors.map(m => (
                                    <RealMentorCard key={m.uid} mentor={m} onConnect={handleConnectRealMentor} />
                                ))}
                            </div>
                            {filteredRealMentors.length === 0 && (
                                <div className="card text-center py-10 space-y-2">
                                    <p className="text-white/40 font-medium">No real mentors found</p>
                                    <p className="text-sm text-white/30">Admins can add real mentors via the Admin panel</p>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, MapPin, Building2, ChevronRight, Loader, Users } from 'lucide-react'

const categoryColors = {
    'AI/ML': 'bg-purple-100 text-purple-700',
    'Data Science': 'bg-blue-100 text-blue-700',
    'Backend': 'bg-green-100 text-green-700',
    'Frontend': 'bg-yellow-100 text-yellow-700',
    'DevOps': 'bg-orange-100 text-orange-700',
    'Cloud': 'bg-cyan-100 text-cyan-700',
    'Cybersecurity': 'bg-red-100 text-red-700',
    'Product': 'bg-pink-100 text-pink-700',
}

function MentorCard({ persona, onClick }) {
    const catColor = categoryColors[persona.category] || 'bg-slate-100 text-slate-600'
    const initials = persona.name.split(' ').map(n => n[0]).join('').substring(0, 2)

    return (
        <div
            onClick={() => onClick(persona.id)}
            className="card hover:shadow-lg hover:border-brand-200 transition-all duration-200 cursor-pointer group"
        >
            <div className="flex items-start gap-3 mb-3">
                {/* Avatar */}
                <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: persona.avatar_color }}
                >
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-brand-600 transition-colors">{persona.name}</h3>
                    <p className="text-xs text-brand-600 font-medium mt-0.5">{persona.role}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-500 transition-colors flex-shrink-0 mt-1" />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                <Building2 size={12} />
                <span className="font-medium">{persona.company}</span>
                <span className="text-slate-300 mx-0.5">·</span>
                <span>{persona.years_experience}y exp</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                <MapPin size={11} />
                <span>{persona.location}</span>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor}`}>{persona.category}</span>
                {persona.skills.slice(0, 3).map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-surface-100 text-slate-500">{s}</span>
                ))}
                {persona.skills.length > 3 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-100 text-slate-400">+{persona.skills.length - 3}</span>
                )}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{persona.bio}</p>
        </div>
    )
}

export default function MentorsDiscoverPage() {
    const [personas, setPersonas] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        fetch('/api/personas/categories')
            .then(r => r.json())
            .then(d => { if (d.categories) setCategories(d.categories) })
            .catch(console.error)
    }, [])

    useEffect(() => {
        setLoading(true)
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (activeCategory) params.set('category', activeCategory)
        fetch(`/api/personas?${params}`)
            .then(r => r.json())
            .then(d => { if (d.personas) setPersonas(d.personas) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [search, activeCategory])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="section-heading flex items-center gap-2">
                    <Users size={22} className="text-brand-600" /> Discover Mentors
                </h1>
                <p className="section-sub">Explore career journeys from 50 industry professionals across top companies.</p>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, role, or skill..."
                        className="input-field pl-9 w-full"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                    <Filter size={14} className="text-slate-400 flex-shrink-0" />
                    <button
                        onClick={() => setActiveCategory('')}
                        className={`text-xs px-3 py-2 rounded-lg whitespace-nowrap font-medium transition-all ${!activeCategory ? 'bg-brand-600 text-white' : 'bg-surface-100 text-slate-600 hover:bg-surface-200'}`}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat === activeCategory ? '' : cat)}
                            className={`text-xs px-3 py-2 rounded-lg whitespace-nowrap font-medium transition-all ${activeCategory === cat ? 'bg-brand-600 text-white' : 'bg-surface-100 text-slate-600 hover:bg-surface-200'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className="card flex items-center gap-3 text-brand-600">
                    <Loader size={18} className="animate-spin" />
                    <span className="text-sm">Loading mentors...</span>
                </div>
            ) : (
                <>
                    <p className="text-xs text-slate-400 font-medium">{personas.length} mentor{personas.length !== 1 ? 's' : ''} found</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {personas.map(p => (
                            <MentorCard key={p.id} persona={p} onClick={(id) => navigate(`/dashboard/mentors/${id}`)} />
                        ))}
                    </div>
                    {personas.length === 0 && (
                        <div className="card text-center py-10 space-y-2">
                            <p className="text-slate-500 font-medium">No mentors found</p>
                            <p className="text-sm text-slate-400">Try a different search or category</p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

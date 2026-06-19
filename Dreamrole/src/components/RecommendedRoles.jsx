import { useState, useEffect } from 'react'
import { authFetch } from '../lib/api'
import { useApp } from '../context/AppContext'
import { Sparkles, Briefcase, CheckCircle2, ChevronRight, AlertCircle, Loader2, ArrowRight } from 'lucide-react'

export default function RecommendedRoles() {
    const { resumeText, extractedSkills, selectedRole, setSelectedRole } = useApp()
    const [roles, setRoles] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [hasFetched, setHasFetched] = useState(false)
    const [animateProgress, setAnimateProgress] = useState(false)

    useEffect(() => {
        if (!resumeText || !extractedSkills || extractedSkills.length === 0 || hasFetched) return;

        async function fetchRoles() {
            setLoading(true)
            setError(null)
            try {
                const res = await authFetch('/api/recommend-roles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ resumeText, skills: extractedSkills })
                });

                if (!res.ok) throw new Error('Failed to fetch recommendations');

                const data = await res.json();
                if (data.recommended_roles) {
                    const sorted = [...data.recommended_roles].sort((a, b) => b.match_percentage - a.match_percentage);
                    setRoles(sorted);
                }
            } catch (err) {
                console.error(err);
                setError('Could not analyze your profile at this time. Please try again later.');
            } finally {
                setLoading(false);
                setHasFetched(true);
            }
        }

        fetchRoles();
    }, [resumeText, extractedSkills, hasFetched]);

    // Trigger progress bar animation after roles are loaded
    useEffect(() => {
        if (roles.length > 0) {
            const timer = setTimeout(() => setAnimateProgress(true), 100);
            return () => clearTimeout(timer);
        }
    }, [roles]);

    if (!resumeText || !extractedSkills || extractedSkills.length === 0) {
        return (
            <div className="card bg-transparent/80 backdrop-blur-md border-dashed border-2 border-indigo-200 text-center py-12 rounded-3xl transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                    <Briefcase size={28} className="relative z-10" />
                    <div className="absolute inset-0 bg-indigo-400 opacity-20 rounded-full animate-ping"></div>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Upload resume to get suggestions</h3>
                <p className="text-white/40 mt-2 max-w-sm mx-auto">We need your resume and skills to recommend the perfect roles.</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="space-y-4 pt-2 mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 animate-pulse"></div>
                    <div className="h-6 w-48 bg-slate-200 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="card bg-transparent/60 backdrop-blur-sm border border-white/50 rounded-3xl p-6 shadow-xl shadow-indigo-500/5 animate-pulse flex flex-col h-full min-h-[260px]">
                            <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                            <div className="flex justify-between mb-2 mt-2">
                                <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                                <div className="h-3 bg-slate-200 rounded w-1/6"></div>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full mb-6 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-[shimmer_1.5s_infinite]"></div>
                            </div>
                            <div className="space-y-2 mb-6">
                                <div className="h-3 bg-slate-200 rounded w-full"></div>
                                <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                                <div className="h-3 bg-slate-200 rounded w-4/6"></div>
                            </div>
                            <div className="mt-auto h-10 rounded-full bg-slate-200"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="card bg-red-50/80 backdrop-blur-md border border-red-100 flex items-start gap-3 rounded-2xl shadow-sm">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-red-800">Oops!</h3>
                    <p className="text-sm text-red-400 mt-1">{error}</p>
                </div>
            </div>
        )
    }

    if (roles.length === 0) return null;

    return (
        <div className="space-y-4 pt-2 mb-8">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h2 className="text-xl font-bold text-white tracking-tight">Recommended Roles for You</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {roles.map((item, idx) => {
                    const isBestMatch = idx === 0;
                    const isSelected = selectedRole === item.role;

                    return (
                        <div
                            key={idx}
                            className={`relative flex flex-col h-full rounded-3xl p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl 
                            ${isBestMatch 
                                ? 'bg-gradient-to-br from-indigo-600 to-purple-800 text-white shadow-lg shadow-indigo-500/40 border-none' 
                                : 'bg-transparent/80 backdrop-blur-md border border-white/50 text-white shadow-xl shadow-indigo-500/5'} 
                            ${isSelected && !isBestMatch ? 'ring-2 ring-indigo-500' : ''}`}
                        >
                            {isBestMatch && (
                                <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-10 animate-bounce">
                                    <Sparkles size={12} /> BEST MATCH
                                </div>
                            )}

                            <div className="flex-1">
                                <h3 className={`font-bold text-xl mb-4 tracking-tight ${isBestMatch ? 'text-white' : 'text-white'}`}>
                                    {item.role}
                                </h3>

                                <div className={`mb-2 text-xs font-semibold flex items-center justify-between ${isBestMatch ? 'text-indigo-100' : 'text-white/40'}`}>
                                    <span>Match score</span>
                                    <span className={isBestMatch ? 'text-white text-sm font-bold' : (item.match_percentage >= 80 ? 'text-emerald-500 text-sm font-bold' : 'text-indigo-500 text-sm font-bold')}>
                                        {item.match_percentage}%
                                    </span>
                                </div>

                                <div className={`w-full rounded-full h-1.5 mb-6 ${isBestMatch ? 'bg-indigo-900/40' : 'bg-slate-100'}`}>
                                    <div
                                        className={`h-1.5 rounded-full transition-all duration-1000 ease-out 
                                        ${isBestMatch ? 'bg-gradient-to-r from-cyan-300 to-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.8)]' 
                                        : (item.match_percentage >= 80 ? 'bg-emerald-400' : 'bg-indigo-500')}`}
                                        style={{ width: animateProgress ? `${item.match_percentage}%` : '0%' }}
                                    ></div>
                                </div>

                                <p className={`text-sm leading-relaxed mb-6 ${isBestMatch ? 'text-indigo-100' : 'text-white/60'}`}>
                                    {item.reason}
                                </p>
                            </div>

                            <button
                                onClick={() => setSelectedRole(item.role)}
                                className={`group flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-sm font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] 
                                ${isBestMatch 
                                    ? (isSelected ? 'bg-transparent/20 text-white shadow-inner pointer-events-none' : 'bg-transparent text-indigo-700 hover:bg-slate-50 hover:shadow-lg shadow-white/20') 
                                    : (isSelected ? 'bg-indigo-600 text-white shadow-md pointer-events-none' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white')}`}
                            >
                                {isSelected ? (
                                    <><CheckCircle2 size={18} /> Dream Role Set</>
                                ) : (
                                    <>
                                        Set as Dream Role 
                                        <ArrowRight size={16} className={`transition-transform duration-300 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 ${isBestMatch ? 'text-indigo-700' : 'text-white'}`} />
                                    </>
                                )}
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

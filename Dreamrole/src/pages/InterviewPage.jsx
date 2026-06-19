import { useState, useEffect } from 'react'
import { authFetch } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import {
    Mic, ChevronRight, ChevronLeft, CheckCircle2, Trophy,
    Loader, MessageSquare, Lightbulb, Star, AlertCircle, BriefcaseBusiness
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

const categoryColors = {
    'Project Experience': 'bg-blue-50 text-blue-700 border-blue-200',
    'Technical Knowledge': 'bg-purple-500/10 text-purple-400 border-purple-200',
    'Internship/Work': 'bg-green-50 text-green-700 border-green-200',
    'Problem Solving': 'bg-amber-500/10 text-amber-700 border-amber-200',
    'Career Goals': 'bg-rose-50 text-rose-700 border-rose-200'
}

const stageConfig = {
    'Excellent': { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: '🌟' },
    'Good': { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: '👍' },
    'Developing': { color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-200', icon: '📈' },
    'Needs Improvement': { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: '💪' }
}

export default function InterviewPage() {
    const navigate = useNavigate()
    const { resumeText, selectedRole } = useApp()
    const { currentUser } = useAuth()

    const [questions, setQuestions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [current, setCurrent] = useState(0)
    const [answers, setAnswers] = useState({})        // index → typed answer
    const [evaluations, setEvaluations] = useState({}) // index → { stage, feedback, strengths, improvements }
    const [evaluating, setEvaluating] = useState(false)
    const [showHint, setShowHint] = useState(false)
    const [done, setDone] = useState(false)

    const role = selectedRole || 'Software Engineer'

    // Generate questions on mount
    useEffect(() => {
        if (!resumeText) {
            setLoading(false)
            return
        }
        authFetch('/api/interview/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume_text: resumeText, role, count: 7, user_name: currentUser?.displayName || 'Candidate' })
        })
            .then(r => r.json())
            .then(data => {
                if (data.questions?.length > 0) setQuestions(data.questions)
                else throw new Error('No questions generated')
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    const handleEvaluate = async () => {
        const q = questions[current]
        const answer = answers[current] || ''
        setEvaluating(true)
        setShowHint(false)
        try {
            const res = await authFetch('/api/interview/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: q.question, answer, role, category: q.category, user_name: currentUser?.displayName || 'Candidate' })
            })
            const data = await res.json()
            if (data.evaluation) {
                setEvaluations(prev => ({ ...prev, [current]: data.evaluation }))
            }
        } catch (err) {
            console.error(err)
        } finally {
            setEvaluating(false)
            setShowHint(true)
        }
    }

    const handleNext = () => {
        if (current < questions.length - 1) {
            setCurrent(c => c + 1)
            setShowHint(false)
        } else {
            setDone(true)
        }
    }

    // ─── No resume state ─────────────────────────────────────────────────────────
    if (!resumeText && !loading) {
        return (
            <div className="max-w-xl mx-auto space-y-4">
                <h1 className="section-heading">Resume Interview Simulator</h1>
                <div className="card text-center space-y-4">
                    <BriefcaseBusiness size={32} className="text-white/20 mx-auto" />
                    <p className="text-white/60">Please upload your resume first — the interview questions are generated from your actual resume content.</p>
                    <button onClick={() => navigate('/dashboard/workflow')} className="btn-primary mx-auto">Upload Resume</button>
                </div>
            </div>
        )
    }

    // ─── Loading ─────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="max-w-2xl mx-auto card flex items-center gap-3 text-indigo-400">
                <Loader size={20} className="animate-spin" />
                <div>
                    <p className="text-sm font-semibold">Reading your resume and preparing interview questions...</p>
                    <p className="text-xs text-white/30 mt-0.5">This may take 10–20 seconds</p>
                </div>
            </div>
        )
    }

    // ─── Error ───────────────────────────────────────────────────────────────────
    if (error || questions.length === 0) {
        return (
            <div className="max-w-xl mx-auto space-y-4">
                <h1 className="section-heading">Resume Interview Simulator</h1>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error || 'Could not generate questions'}</div>
            </div>
        )
    }

    // ─── Done screen ─────────────────────────────────────────────────────────────
    if (done) {
        const evalValues = Object.values(evaluations)
        const stageOrder = { 'Excellent': 4, 'Good': 3, 'Developing': 2, 'Needs Improvement': 1 }
        const avgNum = evalValues.length
            ? Math.round(evalValues.reduce((s, e) => s + (stageOrder[e.stage] || 2), 0) / evalValues.length)
            : 2
        const overallStage = Object.entries(stageOrder).find(([, v]) => v === avgNum)?.[0] || 'Good'
        const cfg = stageConfig[overallStage] || stageConfig['Good']

        return (
            <div className="max-w-lg mx-auto space-y-5">
                <div className="card text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg">
                        <Trophy size={36} className="text-amber-300" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white">Interview Complete!</h2>
                    <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border font-bold ${cfg.bg} ${cfg.color}`}>
                        <span className="text-lg">{cfg.icon}</span>
                        Overall: {overallStage}
                    </div>
                    <p className="text-sm text-white/40">{evalValues.length} of {questions.length} answers evaluated</p>

                    <div className="space-y-3 text-left">
                        {questions.map((q, i) => {
                            const ev = evaluations[i]
                            const c = ev ? stageConfig[ev.stage] || stageConfig['Good'] : null
                            return (
                                <div key={i} className={`p-3 rounded-xl border text-sm ${c ? c.bg : 'bg-transparent border-white/[0.06]'}`}>
                                    <p className={`font-semibold ${c ? c.color : 'text-white/40'} flex items-center gap-1.5`}>
                                        <span>{c ? c.icon : '⬜'}</span>
                                        Q{i + 1}: {q.question.substring(0, 80)}...
                                    </p>
                                    {ev && <p className="text-white/60 mt-1 text-xs leading-relaxed">{ev.feedback}</p>}
                                    {!ev && <p className="text-white/30 mt-1 text-xs italic">Not answered</p>}
                                </div>
                            )
                        })}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => { setCurrent(0); setDone(false); setShowHint(false) }} className="btn-secondary flex-1 justify-center">
                            Retry
                        </button>
                        <button onClick={() => navigate('/dashboard/roadmap')} className="btn-primary flex-1 justify-center">
                            View Roadmap <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ─── Main Question Screen ────────────────────────────────────────────────────
    const q = questions[current]
    const catClass = categoryColors[q.category] || 'bg-slate-50 text-white/60 border-slate-200'
    const ev = evaluations[current]
    const evCfg = ev ? stageConfig[ev.stage] || stageConfig['Good'] : null
    const hasAnswer = (answers[current] || '').trim().length > 0

    return (
        <div className="max-w-2xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="section-heading flex items-center gap-2">
                        <Mic size={20} className="text-indigo-400" /> Resume Interview
                    </h1>
                    <p className="section-sub">Question {current + 1} of {questions.length} · Based on your resume</p>
                </div>
                <span className="badge-brand text-xs px-3 py-1.5">{role}</span>
            </div>

            {/* Progress bar */}
            <div className="flex gap-1.5">
                {questions.map((_, i) => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${evaluations[i] ? 'bg-emerald-500/100' :
                            i === current ? 'bg-brand-400' :
                                'bg-white/[0.06]'
                        }`} />
                ))}
            </div>

            {/* Question card */}
            <div className="card space-y-4">
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${catClass}`}>{q.category}</span>
                </div>
                <p className="text-base font-semibold text-white leading-relaxed">{q.question}</p>

                {/* Answer textarea */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Your Answer</label>
                    <textarea
                        className="w-full min-h-[140px] p-3 text-sm text-white/80 bg-transparent border border-white/[0.06] rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
                        placeholder="Type your answer here... Be specific, mention actual projects, technologies, and outcomes."
                        value={answers[current] || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [current]: e.target.value }))}
                        disabled={!!ev}
                    />
                    <p className="text-xs text-white/30">
                        {(answers[current] || '').length} characters · Aim for at least 100+ words for a strong answer
                    </p>
                </div>

                {/* Evaluate button */}
                {!ev && (
                    <button
                        onClick={handleEvaluate}
                        disabled={evaluating || !hasAnswer}
                        className={`btn-primary w-full justify-center ${(!hasAnswer || evaluating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {evaluating ? <><Loader size={15} className="animate-spin" /> Evaluating...</> : <><Star size={15} /> Get AI Feedback</>}
                    </button>
                )}
            </div>

            {/* AI Evaluation Result */}
            {ev && evCfg && (
                <div className={`card border space-y-4 animate-fade-in ${evCfg.bg}`}>
                    <div className={`flex items-center gap-2 font-bold ${evCfg.color}`}>
                        <span className="text-xl">{evCfg.icon}</span>
                        <span>Answer Rating: {ev.stage}</span>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed">{ev.feedback}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ev.strengths?.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <CheckCircle2 size={12} /> What you did well
                                </p>
                                <ul className="space-y-1">
                                    {ev.strengths.map((s, i) => (
                                        <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                                            <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span> {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {ev.improvements?.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <AlertCircle size={12} /> To improve
                                </p>
                                <ul className="space-y-1">
                                    {ev.improvements.map((imp, i) => (
                                        <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                                            <span className="text-amber-500 mt-0.5 flex-shrink-0">→</span> {imp}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Hint */}
                    {showHint && q.hint && (
                        <div className="p-3 bg-transparent rounded-xl border border-slate-200 flex items-start gap-2">
                            <Lightbulb size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-white/60"><strong>Interviewer's tip:</strong> {q.hint}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => { setCurrent(c => c - 1); setShowHint(false) }}
                    disabled={current === 0}
                    className={`btn-ghost ${current === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                    <ChevronLeft size={16} /> Previous
                </button>
                {ev && (
                    <button onClick={handleNext} className="btn-primary">
                        {current < questions.length - 1 ? <>Next Question <ChevronRight size={16} /></> : <><Trophy size={16} /> View Results</>}
                    </button>
                )}
                {!ev && (
                    <button
                        onClick={handleNext}
                        className="btn-ghost text-white/30 text-sm"
                        disabled={current === questions.length - 1 && !ev}
                    >
                        Skip <ChevronRight size={15} />
                    </button>
                )}
            </div>
        </div>
    )
}

import { useState, useEffect } from 'react'
import { authFetch } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import TestQuestion from '../components/TestQuestion'
import { CheckCircle2, ArrowRight, ArrowLeft, Trophy, Loader } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function EvaluationTestPage() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()
  const { selectedRole, analysisResult, resumeText } = useApp()

  const missingSkills = analysisResult?.missing_skills || []

  useEffect(() => {
    const role = selectedRole || 'Software Developer'
    authFetch('/api/test/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, missing_skills: missingSkills, matched_skills: analysisResult?.matched_skills || [], resume_text: resumeText, count: 5 })
    })
      .then(r => r.json())
      .then(data => {
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions)
        } else {
          throw new Error('No questions returned')
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = (optIdx) => setAnswers({ ...answers, [current]: optIdx })
  const handleSubmit = () => setSubmitted(true)

  const getScore = () => {
    let correct = 0
    questions.forEach((q, i) => {
      if (answers[i] !== undefined && q.options[answers[i]] === q.correct_answer) correct++
    })
    return correct
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto card flex items-center gap-3 text-indigo-400">
        <Loader size={20} className="animate-spin" />
        <span className="text-sm font-medium">Generating personalized test questions with AI...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="section-heading">Evaluation Test</h1>
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>
      </div>
    )
  }

  if (submitted) {
    const score = getScore()
    const stageLabel = score >= Math.ceil(questions.length * 0.8)
      ? '🎉 Excellent! You have a strong grasp of these topics.'
      : score >= Math.ceil(questions.length * 0.5)
        ? '👍 Good job! Keep practicing to deepen your understanding.'
        : '📚 Great effort! Review the missing topics in your roadmap.'

    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="card text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg">
            <Trophy size={36} className="text-amber-300" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Test Complete!</h1>
          <div>
            <p className="text-5xl font-extrabold text-indigo-400">{score}<span className="text-2xl text-white/30">/{questions.length}</span></p>
            <p className="text-sm text-white/40 mt-1">Questions Correct</p>
          </div>
          <div className="p-4 bg-transparent rounded-xl border text-left space-y-2">
            <p className="text-sm font-semibold text-white/80">Performance Summary</p>
            <p className="text-sm text-white/60 flex items-center gap-2"><CheckCircle2 size={15} className="text-brand-500 flex-shrink-0" /> {stageLabel}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setSubmitted(false); setCurrent(0); setAnswers({}) }} className="btn-secondary flex-1 justify-center">Retake Test</button>
            <button onClick={() => navigate('/dashboard/roadmap')} className="btn-primary flex-1 justify-center">
              View Roadmap <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentQ = questions[current]
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-heading">Evaluation Test</h1>
          <p className="section-sub">Question {current + 1} of {questions.length}</p>
        </div>
        <span className="badge-brand text-sm px-3 py-1.5">{selectedRole || 'General'}</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {questions.map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i < current ? 'bg-brand-600' : i === current ? 'bg-brand-400' : 'bg-white/[0.06]'}`} />
        ))}
      </div>

      <div className="card">
        <TestQuestion
          question={currentQ.question}
          options={currentQ.options}
          selected={answers[current]}
          onSelect={handleSelect}
          index={current}
        />
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setCurrent(c => c - 1)} disabled={current === 0} className={`btn-ghost ${current === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
          <ArrowLeft size={16} /> Previous
        </button>
        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent(c => c + 1)} className="btn-primary">
            Next Question <ArrowRight size={16} />
          </button>
        ) : (
          <button onClick={handleSubmit} className="btn-primary bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle2 size={16} /> Submit Test
          </button>
        )}
      </div>
    </div>
  )
}

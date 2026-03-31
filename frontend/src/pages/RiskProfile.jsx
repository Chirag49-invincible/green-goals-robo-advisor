import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Leaf } from 'lucide-react'
import { useAppStore } from '../store'
import { getRiskProfile } from '../services/api'

const QUESTIONS = [
  {
    id: 'age_score', icon: '🎂', text: 'What is your age group?',
    options: [
      { label: 'Below 30', sub: 'Long runway ahead', score: 4 },
      { label: '30–40', sub: 'Prime earning years', score: 3 },
      { label: '40–50', sub: 'Mid-career planning', score: 2 },
      { label: '50+', sub: 'Nearing retirement', score: 1 },
    ],
  },
  {
    id: 'horizon_score', icon: '⏳', text: 'Investment horizon for this goal?',
    options: [
      { label: '10+ years', sub: 'Long term', score: 4 },
      { label: '5–10 years', sub: 'Medium term', score: 3 },
      { label: '3–5 years', sub: 'Short-medium', score: 2 },
      { label: 'Under 3 years', sub: 'Short term', score: 1 },
    ],
  },
  {
    id: 'drawdown_score', icon: '📉', text: 'Portfolio drops 20% — what do you do?',
    options: [
      { label: 'Buy more', sub: 'Great opportunity!', score: 4 },
      { label: 'Stay put', sub: 'Wait for recovery', score: 3 },
      { label: 'Sell a bit', sub: 'Reduce exposure', score: 2 },
      { label: 'Sell all', sub: 'Exit immediately', score: 1 },
    ],
  },
  {
    id: 'income_score', icon: '💼', text: 'How stable is your income?',
    options: [
      { label: 'Very stable', sub: 'Govt / MNC job', score: 4 },
      { label: 'Mostly stable', sub: 'Private sector', score: 3 },
      { label: 'Variable', sub: 'Freelance / commission', score: 2 },
      { label: 'Highly variable', sub: 'Startup / irregular', score: 1 },
    ],
  },
  {
    id: 'loss_tolerance_score', icon: '🎯', text: 'Maximum annual loss you can tolerate?',
    options: [
      { label: 'Above 30%', sub: 'In it for the long game', score: 4 },
      { label: '15–30%', sub: 'Moderate volatility okay', score: 3 },
      { label: '5–15%', sub: 'Some loss acceptable', score: 2 },
      { label: 'Below 5%', sub: 'Capital preservation first', score: 1 },
    ],
  },
  {
    id: 'experience_score', icon: '📚', text: 'Your prior investing experience?',
    options: [
      { label: 'Experienced', sub: 'Equities, derivatives, PMS', score: 4 },
      { label: 'Intermediate', sub: 'Mutual funds & stocks', score: 3 },
      { label: 'Beginner', sub: 'Only FDs / savings', score: 2 },
      { label: 'None', sub: 'First-time investor', score: 1 },
    ],
  },
  {
    id: 'esg_importance_score', icon: '🌿', text: 'How important is ESG to you?',
    options: [
      { label: 'Critical', sub: 'ESG-only investments', score: 4 },
      { label: 'Very important', sub: 'Strong ESG preference', score: 3 },
      { label: 'Somewhat', sub: 'ESG as tiebreaker', score: 2 },
      { label: 'Not a priority', sub: 'Returns matter most', score: 1 },
    ],
  },
  {
    id: 'goal_flexibility_score', icon: '🗓️', text: 'Can you extend your goal timeline if needed?',
    options: [
      { label: 'Easily', sub: 'Very flexible', score: 4 },
      { label: 'Probably', sub: 'Can adjust 1–2 years', score: 3 },
      { label: 'Unlikely', sub: 'Fairly fixed', score: 2 },
      { label: 'No', sub: 'Hard deadline', score: 1 },
    ],
  },
]

const PROFILE_COLORS = {
  Conservative: 'from-violet-600/20 to-violet-900/10 border-violet-500/30 text-violet-300',
  Moderate: 'from-blue-600/20 to-blue-900/10 border-blue-500/30 text-blue-300',
  Aggressive: 'from-forest-600/20 to-forest-900/10 border-forest-500/30 text-forest-300',
}

export default function RiskProfilePage() {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const { setRiskProfile, setStep } = useAppStore()

  const q = QUESTIONS[current]
  const answered = answers[q.id] !== undefined
  const progress = (current / QUESTIONS.length) * 100

  const handleSelect = async (score) => {
    const updated = { ...answers, [q.id]: score }
    setAnswers(updated)

    if (current < QUESTIONS.length - 1) {
      setTimeout(() => setCurrent(c => c + 1), 350)
    } else {
      // All answered — submit
      setLoading(true)
      try {
        const res = await getRiskProfile(updated)
        setResult(res)
        setRiskProfile(res)
      } catch {
        // Fallback: compute locally
        const total = Object.values(updated).reduce((a, b) => a + b, 0)
        const pct = total / 32 * 100
        const profile = pct >= 70 ? 'Aggressive' : pct >= 45 ? 'Moderate' : 'Conservative'
        const map = {
          Conservative: { equity: 35, debt: 55, gold: 10, return: 9, color: '#7c3aed' },
          Moderate: { equity: 60, debt: 30, gold: 10, return: 12, color: '#2563eb' },
          Aggressive: { equity: 80, debt: 15, gold: 5, return: 15, color: '#16a34a' },
        }
        const r = { profile, score: total, max_score: 32, percentage: pct, ...map[profile] }
        setResult(r)
        setRiskProfile(r)
      } finally {
        setLoading(false)
      }
    }
  }

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto px-4 py-8"
      >
        <div className={`glass-card p-8 bg-gradient-to-br ${PROFILE_COLORS[result.profile]}`}>
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">
              {result.profile === 'Aggressive' ? '🚀' : result.profile === 'Moderate' ? '⚖️' : '🛡️'}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              You're a <span className="text-gradient">{result.profile}</span> Investor
            </h2>
            <p className="text-slate-400 text-sm">
              Score: {result.score}/{result.max_score} · {result.percentage}%
            </p>
          </div>

          {/* Score bar */}
          <div className="mb-6">
            <div className="h-3 bg-forest-950 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 via-blue-500 to-forest-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${result.percentage}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Conservative</span><span>Moderate</span><span>Aggressive</span>
            </div>
          </div>

          {/* Allocation pills */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Equity', value: result.equity, icon: '📈' },
              { label: 'Debt', value: result.debt, icon: '📊' },
              { label: 'Gold', value: result.gold, icon: '🥇' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="glass-card p-3 text-center">
                <div className="text-lg mb-1">{icon}</div>
                <div className="text-xl font-bold text-white">{value}%</div>
                <div className="text-xs text-slate-400">{label}</div>
              </div>
            ))}
          </div>

          <div className="text-sm text-slate-300 leading-relaxed bg-forest-950/40 rounded-xl p-4 mb-6">
            Expected return: <span className="text-forest-400 font-semibold">{result.return}% p.a.</span>
          </div>

          <button onClick={() => setStep(2)} className="btn-primary w-full">
            Set Your Financial Goal <ChevronRight size={16} className="inline ml-1" />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>Question {current + 1} of {QUESTIONS.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-1.5 bg-forest-950 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-forest-500 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
        >
          <div className="glass-card p-6 mb-4">
            <div className="text-3xl mb-3">{q.icon}</div>
            <h3 className="text-xl font-semibold text-white mb-6">{q.text}</h3>

            <div className="grid grid-cols-2 gap-3">
              {q.options.map((opt) => (
                <button
                  key={opt.score}
                  onClick={() => handleSelect(opt.score)}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 active:scale-95 ${
                    answers[q.id] === opt.score
                      ? 'step-active border-forest-500/50'
                      : 'border-forest-900/40 hover:border-forest-700/60 hover:bg-forest-950/60'
                  }`}
                >
                  <div className="font-medium text-white text-sm">{opt.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {current > 0 && (
            <button
              onClick={() => setCurrent(c => c - 1)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronLeft size={16} /> Previous question
            </button>
          )}
        </motion.div>
      </AnimatePresence>

      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-8 text-center">
            <Leaf className="text-forest-400 mx-auto mb-3 animate-spin" size={32} />
            <p className="text-white font-medium">Analysing your risk profile…</p>
          </div>
        </div>
      )}
    </div>
  )
}

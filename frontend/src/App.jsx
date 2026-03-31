import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, RotateCcw, ChevronRight } from 'lucide-react'
import { useAppStore } from './store'
import RiskProfile from './pages/RiskProfile'
import Goal from './pages/Goal'
import Portfolio from './pages/Portfolio'
import MonteCarlo from './pages/MonteCarlo'

const STEPS = [
  { id: 0, label: 'Welcome' },
  { id: 1, label: 'Risk Profile' },
  { id: 2, label: 'Goal' },
  { id: 3, label: 'Portfolio' },
  { id: 4, label: 'Results' },
]

function Stepper({ current }) {
  return (
    <div className="flex items-center justify-center gap-1 py-4">
      {STEPS.filter(s => s.id > 0).map((step, i, arr) => (
        <div key={step.id} className="flex items-center gap-1">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
            current === step.id
              ? 'bg-forest-600 text-white'
              : current > step.id
              ? 'bg-forest-900/60 text-forest-400'
              : 'bg-transparent text-slate-600'
          }`}>
            {current > step.id && <span>✓</span>}
            {step.label}
          </div>
          {i < arr.length - 1 && (
            <div className={`w-6 h-px transition-colors duration-300 ${current > step.id ? 'bg-forest-700' : 'bg-slate-800'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function Welcome() {
  const { setStep } = useAppStore()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-forest-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-forest-800/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 max-w-2xl"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="w-14 h-14 bg-forest-600/20 border border-forest-600/40 rounded-2xl flex items-center justify-center">
            <Leaf size={28} className="text-forest-400" />
          </div>
          <div className="text-left">
            <div className="text-2xl font-bold text-white tracking-tight">Green Goals</div>
            <div className="text-xs text-forest-500 font-medium tracking-widest uppercase">ESG Robo-Advisor</div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6"
        >
          Invest with <span className="text-gradient">purpose.</span>
          <br />Grow with <span className="text-gradient">confidence.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="text-slate-400 text-lg leading-relaxed mb-10 max-w-xl mx-auto"
        >
          India's first ESG-focused robo-advisor. Get a personalised portfolio of
          sustainable stocks built on Modern Portfolio Theory — optimised for your
          goals, risk profile, and values.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex flex-wrap gap-2 justify-center mb-10"
        >
          {[
            '🌿 45+ ESG-rated NSE stocks',
            '📊 Modern Portfolio Theory',
            '🎲 10,000 Monte Carlo scenarios',
            '🎯 Goal-based planning',
            '🔄 Rebalancing alerts',
          ].map(tag => (
            <span key={tag} className="px-3 py-1.5 text-sm text-forest-300 bg-forest-950/70 border border-forest-900/60 rounded-full">
              {tag}
            </span>
          ))}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.65, type: 'spring', stiffness: 200 }}
          onClick={() => setStep(1)}
          className="btn-primary text-base px-10 py-4 text-lg gap-3 inline-flex items-center green-glow hover:scale-105 transition-transform"
        >
          Start Your ESG Journey
          <ChevronRight size={20} />
        </motion.button>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-8 mt-14 text-center"
        >
          {[
            { val: '45+', label: 'ESG stocks' },
            { val: '10K', label: 'Simulations' },
            { val: '6', label: 'Goal types' },
            { val: '3', label: 'Risk profiles' },
          ].map(({ val, label }) => (
            <div key={label}>
              <div className="text-2xl font-bold text-forest-400">{val}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function App() {
  const { currentStep, setStep, reset } = useAppStore()

  return (
    <div className="min-h-screen bg-[#050f0a] text-slate-200">
      {/* Top nav — only after welcome */}
      {currentStep > 0 && (
        <header className="sticky top-0 z-40 border-b border-forest-900/40 bg-[#050f0a]/80 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
            <button
              onClick={() => setStep(0)}
              className="flex items-center gap-2 text-forest-400 hover:text-forest-300 transition-colors"
            >
              <Leaf size={18} />
              <span className="font-semibold text-sm">Green Goals</span>
            </button>

            <Stepper current={currentStep} />

            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </header>
      )}

      {/* Page content */}
      <main className="max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {currentStep === 0 && <Welcome key="welcome" />}
          {currentStep === 1 && (
            <motion.div key="risk" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              <RiskProfile />
            </motion.div>
          )}
          {currentStep === 2 && (
            <motion.div key="goal" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              <Goal />
            </motion.div>
          )}
          {currentStep === 3 && (
            <motion.div key="portfolio" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              <Portfolio />
            </motion.div>
          )}
          {currentStep === 4 && (
            <motion.div key="mc" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              <MonteCarlo />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

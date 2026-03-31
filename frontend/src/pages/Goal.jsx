import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, IndianRupee, Target, Clock, TrendingUp } from 'lucide-react'
import { useAppStore } from '../store'
import { getGoalPlan, formatINR } from '../services/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const GOALS = [
  { key: 'Retirement', icon: '🏖️', desc: 'Post-retirement corpus' },
  { key: 'Child Education', icon: '🎓', desc: 'Higher education fund' },
  { key: 'House Purchase', icon: '🏠', desc: 'Down payment / purchase' },
  { key: 'Wealth Creation', icon: '📈', desc: 'Long-term wealth' },
  { key: 'Emergency Fund', icon: '🛡️', desc: '6–12 months expenses' },
  { key: 'Dream Vacation', icon: '✈️', desc: 'Travel goal' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 text-sm">
      <p className="text-slate-400 mb-1">Year {label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatINR(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function GoalPage() {
  const { riskProfile, setGoalData, setStep } = useAppStore()
  const [selectedGoal, setSelectedGoal] = useState('')
  const [form, setForm] = useState({
    target: '', horizon: '', initial: '', sip: '',
    inflation: false,
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!selectedGoal || !form.target || !form.horizon) return
    setLoading(true)
    const payload = {
      goal_type: selectedGoal,
      target_amount: parseFloat(form.target),
      horizon_years: parseInt(form.horizon),
      initial_investment: parseFloat(form.initial || 0),
      monthly_sip: parseFloat(form.sip || 0),
      risk_profile: riskProfile?.profile || 'Moderate',
      adjust_for_inflation: form.inflation,
      inflation_rate: 6,
    }
    try {
      const res = await getGoalPlan(payload)
      setResult(res)
      setGoalData(res)
    } catch (e) {
      // Local fallback
      const r = riskProfile?.return || 12
      const monthly_r = r / 100 / 12
      const n = parseInt(form.horizon) * 12
      const target = parseFloat(form.target)
      const init = parseFloat(form.initial || 0)
      const fv_lump = init * Math.pow(1 + monthly_r, n)
      const rem = target - fv_lump
      const req_sip = rem > 0 ? rem * monthly_r / (Math.pow(1 + monthly_r, n) - 1) : 0
      const sip = parseFloat(form.sip || req_sip)
      let corpus = init
      const projection = []
      for (let yr = 1; yr <= parseInt(form.horizon); yr++) {
        for (let m = 0; m < 12; m++) corpus = corpus * (1 + monthly_r) + sip
        projection.push({ year: yr, corpus: Math.round(corpus), target })
      }
      const res = { goal_type: selectedGoal, target_amount: target, required_sip: Math.round(req_sip), user_sip: sip, annual_return: r, horizon_years: parseInt(form.horizon), final_corpus: projection.at(-1)?.corpus || 0, projection }
      setResult(res)
      setGoalData(res)
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    const achieved = result.final_corpus >= result.target_amount
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto px-4 py-8">
        <div className="glass-card p-6 mb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">{GOALS.find(g => g.key === result.goal_type)?.icon} {result.goal_type}</h2>
              <p className="text-slate-400 text-sm mt-1">Target: <span className="text-forest-400 font-semibold">{formatINR(result.target_amount)}</span> in {result.horizon_years} years</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${achieved ? 'bg-forest-900/50 text-forest-300 border border-forest-700/40' : 'bg-amber-900/30 text-amber-300 border border-amber-700/40'}`}>
              {achieved ? '✅ Achievable' : '⚠️ Needs more SIP'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Required SIP', value: formatINR(result.required_sip), icon: <IndianRupee size={14} /> },
              { label: 'Final Corpus', value: formatINR(result.final_corpus), icon: <TrendingUp size={14} /> },
              { label: 'Expected Return', value: `${result.annual_return}% p.a.`, icon: <Target size={14} /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="glass-card p-4 text-center">
                <div className="text-forest-400 flex justify-center mb-1">{icon}</div>
                <div className="font-bold text-white text-sm">{value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={result.projection}>
                <defs>
                  <linearGradient id="corpusGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => formatINR(v)} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={result.target_amount} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Goal', fill: '#f59e0b', fontSize: 11 }} />
                <Area type="monotone" dataKey="corpus" name="Corpus" stroke="#22c55e" strokeWidth={2} fill="url(#corpusGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <button onClick={() => setStep(3)} className="btn-primary w-full">
          Build ESG Portfolio <ChevronRight size={16} className="inline ml-1" />
        </button>
      </motion.div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">What's your goal?</h2>
        <p className="text-slate-400 text-sm">Choose what you're investing towards</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {GOALS.map(g => (
          <button
            key={g.key}
            onClick={() => setSelectedGoal(g.key)}
            className={`p-4 rounded-xl border text-left transition-all duration-200 active:scale-95 ${
              selectedGoal === g.key ? 'step-active border-forest-500/50' : 'border-forest-900/40 hover:border-forest-700/60 glass-card'
            }`}
          >
            <div className="text-2xl mb-2">{g.icon}</div>
            <div className="font-medium text-white text-xs">{g.key}</div>
            <div className="text-xs text-slate-500 mt-0.5">{g.desc}</div>
          </button>
        ))}
      </div>

      {selectedGoal && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Target Amount (₹)</label>
            <input type="number" placeholder="e.g. 5000000" value={form.target}
              onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
              className="input-field" />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Time Horizon (years)</label>
            <input type="number" placeholder="e.g. 10" min="1" max="40" value={form.horizon}
              onChange={e => setForm(f => ({ ...f, horizon: e.target.value }))}
              className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Initial Investment (₹)</label>
              <input type="number" placeholder="0" value={form.initial}
                onChange={e => setForm(f => ({ ...f, initial: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Monthly SIP (₹)</label>
              <input type="number" placeholder="Auto-calculate" value={form.sip}
                onChange={e => setForm(f => ({ ...f, sip: e.target.value }))}
                className="input-field" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" checked={form.inflation} onChange={e => setForm(f => ({ ...f, inflation: e.target.checked }))} className="sr-only" />
              <div className={`w-10 h-6 rounded-full transition-colors ${form.inflation ? 'bg-forest-600' : 'bg-forest-950'}`} />
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.inflation ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-slate-300">Adjust target for 6% inflation</span>
          </label>
          <button onClick={handleSubmit} disabled={!form.target || !form.horizon || loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Calculating…' : 'Calculate Goal Plan →'}
          </button>
        </motion.div>
      )}
    </div>
  )
}

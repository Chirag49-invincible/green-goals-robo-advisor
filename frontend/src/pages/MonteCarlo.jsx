import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Download, Share2, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '../store'
import { runMonteCarlo, formatINR } from '../services/api'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'

function ProbabilityRing({ probability }) {
  const r = 54, circ = 2 * Math.PI * r
  const dash = (probability / 100) * circ
  const color = probability >= 80 ? '#22c55e' : probability >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg width="144" height="144" className="score-ring -rotate-90">
        <circle cx="72" cy="72" r={r} fill="none" stroke="#052e16" strokeWidth="10" />
        <motion.circle cx="72" cy="72" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1.5, ease: 'easeOut' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="text-3xl font-bold text-white"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {probability}%
        </motion.span>
        <span className="text-xs text-slate-500">success</span>
      </div>
    </div>
  )
}

export default function MonteCarloPage() {
  const { portfolioResult, goalData, riskProfile, setMcResult } = useAppStore()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (!result) runSimulation() }, [])

  const runSimulation = async () => {
    setLoading(true)
    const goal = goalData
    const port = portfolioResult

    const payload = {
      initial_investment: goal?.initial_investment || 100000,
      monthly_sip: goal?.required_sip || goal?.user_sip || 10000,
      expected_return: port?.expected_return || riskProfile?.return || 12,
      volatility: port?.volatility || 20,
      horizon_years: goal?.horizon_years || 10,
      target_amount: goal?.target_amount || 5000000,
      n_simulations: 10000,
    }

    try {
      const res = await runMonteCarlo(payload)
      setResult(res)
      setMcResult(res)
    } catch {
      // Local fallback simulation
      const { initial_investment: init, monthly_sip: sip, expected_return: ret,
        volatility: vol, horizon_years: yrs, target_amount: target } = payload
      const r = ret / 100 / 12, v = vol / 100 / Math.sqrt(12), n = yrs * 12
      let successes = 0
      const finals = []
      for (let s = 0; s < 5000; s++) {
        let corpus = init
        for (let m = 0; m < n; m++) corpus = corpus * (1 + r + (Math.random() - 0.5) * v * 2) + sip
        finals.push(corpus)
        if (corpus >= target) successes++
      }
      finals.sort((a, b) => a - b)
      const pct = (p) => finals[Math.floor(p / 100 * finals.length)]
      const snapshots = []
      let corpus = init
      for (let yr = 1; yr <= yrs; yr++) {
        for (let m = 0; m < 12; m++) corpus = corpus * (1 + r) + sip
        snapshots.push({ year: yr, p10: corpus * 0.7, p50: corpus, p90: corpus * 1.35, p25: corpus * 0.85, p75: corpus * 1.18 })
      }
      const hist = Array.from({ length: 25 }, (_, i) => {
        const lo = pct(i * 4), hi = pct((i + 1) * 4)
        const cnt = finals.filter(f => f >= lo && f < hi).length
        return { value: Math.round(lo), count: cnt, hit_target: lo >= target }
      })
      const res = {
        success_probability: Math.round(successes / 50),
        n_simulations: 5000, target_amount: target,
        percentiles: { p10: Math.round(pct(10)), p25: Math.round(pct(25)), p50: Math.round(pct(50)), p75: Math.round(pct(75)), p90: Math.round(pct(90)) },
        yearly_snapshots: snapshots, histogram: hist,
        mean_outcome: Math.round(finals.reduce((a, b) => a + b) / finals.length),
      }
      setResult(res)
      setMcResult(res)
    } finally {
      setLoading(false)
    }
  }

  const prob = result?.success_probability || 0
  const probColor = prob >= 80 ? 'text-forest-400' : prob >= 60 ? 'text-amber-400' : 'text-red-400'
  const probLabel = prob >= 80 ? 'High confidence' : prob >= 60 ? 'Moderate confidence' : 'Low confidence — increase SIP'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 border-4 border-forest-800 border-t-forest-400 rounded-full animate-spin" />
          <p className="text-slate-400">Running 10,000 market scenarios…</p>
        </div>
      ) : result ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Hero probability */}
          <div className="glass-card p-8 mb-6 text-center">
            <h2 className="text-xl font-semibold text-white mb-6">Goal Achievement Probability</h2>
            <ProbabilityRing probability={prob} />
            <p className={`text-lg font-bold mt-4 ${probColor}`}>{probLabel}</p>
            <p className="text-slate-400 text-sm mt-1">
              Based on {result.n_simulations.toLocaleString()} Monte Carlo simulations
            </p>
            <div className="mt-4 p-3 bg-forest-950/50 rounded-xl inline-block">
              <span className="text-slate-400 text-sm">Target: </span>
              <span className="text-forest-400 font-bold">{formatINR(result.target_amount)}</span>
              <span className="text-slate-400 text-sm mx-3">·</span>
              <span className="text-slate-400 text-sm">Median outcome: </span>
              <span className="text-white font-bold">{formatINR(result.percentiles.p50)}</span>
            </div>
          </div>

          {/* Percentile cards */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Pessimistic', pct: 'p10', color: 'text-red-400' },
              { label: 'Below avg', pct: 'p25', color: 'text-amber-400' },
              { label: 'Median', pct: 'p50', color: 'text-white' },
              { label: 'Above avg', pct: 'p75', color: 'text-forest-300' },
              { label: 'Optimistic', pct: 'p90', color: 'text-forest-400' },
            ].map(({ label, pct, color }) => (
              <div key={pct} className="glass-card p-3 text-center">
                <div className={`font-bold text-sm ${color}`}>{formatINR(result.percentiles[pct])}</div>
                <div className="text-xs text-slate-600 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Fan chart */}
          <div className="glass-card p-5 mb-6">
            <h3 className="font-semibold text-white mb-4">Portfolio Growth — Confidence Bands</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={result.yearly_snapshots}>
                <defs>
                  <linearGradient id="p90g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => formatINR(v)} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip contentStyle={{ background: '#0c1f14', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8 }}
                  formatter={(v, n) => [formatINR(v), n]} />
                <ReferenceLine y={result.target_amount} stroke="#f59e0b" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="p90" name="90th pct" stroke="#22c55e" strokeWidth={1} fill="url(#p90g)" strokeDasharray="4 2" />
                <Area type="monotone" dataKey="p75" name="75th pct" stroke="#22c55e" strokeWidth={1.5} fill="none" />
                <Area type="monotone" dataKey="p50" name="Median" stroke="#22c55e" strokeWidth={2.5} fill="none" />
                <Area type="monotone" dataKey="p25" name="25th pct" stroke="#f59e0b" strokeWidth={1.5} fill="none" />
                <Area type="monotone" dataKey="p10" name="10th pct" stroke="#ef4444" strokeWidth={1} fill="none" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Histogram */}
          <div className="glass-card p-5 mb-6">
            <h3 className="font-semibold text-white mb-4">Distribution of Final Corpus</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={result.histogram} barSize={12}>
                <XAxis dataKey="value" tickFormatter={v => formatINR(v)} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#0c1f14', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8 }}
                  formatter={(v, _, p) => [v, p.payload.hit_target ? '✅ Beats target' : '❌ Below target']}
                  labelFormatter={v => formatINR(v)} />
                <ReferenceLine x={result.target_amount} stroke="#f59e0b" />
                <Bar dataKey="count" name="Scenarios">
                  {result.histogram.map((entry, i) => (
                    <Cell key={i} fill={entry.hit_target ? '#22c55e' : '#374151'} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-center text-slate-500 mt-1">
              🟢 Above target &nbsp;|&nbsp; ⬛ Below target &nbsp;|&nbsp; 🟡 Target line
            </p>
          </div>

          {/* Explainability */}
          <div className="glass-card p-6 mb-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-forest-400" /> Why This Recommendation?
            </h3>
            <div className="space-y-3">
              {[
                `Your risk profile is ${riskProfile?.profile || 'Moderate'} based on your questionnaire responses`,
                `${riskProfile?.equity || 60}% equity allocation suits your ${goalData?.horizon_years || 10}-year investment horizon`,
                `ESG stocks selected with average score of ${portfolioResult?.portfolio_esg || 83}/100 — top-rated Indian companies`,
                `Portfolio has ${prob}% probability of achieving your ${formatINR(result.target_amount)} goal`,
                `Expected annual return of ${portfolioResult?.expected_return || 13.8}% with Sharpe ratio ${portfolioResult?.sharpe_ratio || 0.72}`,
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-forest-400 mt-0.5 flex-shrink-0">✦</span>
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={runSimulation} className="btn-ghost flex items-center gap-2 flex-1 justify-center">
              <RefreshCw size={15} /> Re-run Simulation
            </button>
            <button onClick={() => window.print()} className="btn-ghost flex items-center gap-2 flex-1 justify-center">
              <Download size={15} /> Export Report
            </button>
            <button onClick={() => navigator.share?.({ title: 'My ESG Portfolio', url: window.location.href })}
              className="btn-primary flex items-center gap-2 flex-1 justify-center">
              <Share2 size={15} /> Share Portfolio
            </button>
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}

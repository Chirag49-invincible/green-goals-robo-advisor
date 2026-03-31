import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Zap, Shield, Leaf } from 'lucide-react'
import { useAppStore } from '../store'
import { optimizePortfolio, formatINR, formatPct } from '../services/api'
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from 'recharts'

const SECTOR_COLORS = {
  Technology: '#22c55e', 'Clean Energy': '#06b6d4', Banking: '#3b82f6',
  Finance: '#8b5cf6', FMCG: '#f59e0b', Pharma: '#ec4899',
  Chemicals: '#14b8a6', Construction: '#f97316', Automotive: '#64748b',
  Metals: '#a78bfa', Energy: '#34d399', Retail: '#fbbf24',
}

export default function PortfolioPage() {
  const { riskProfile, portfolioConfig, setPortfolioConfig, setPortfolioResult, setStep } = useAppStore()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleOptimize = async () => {
    setLoading(true)
    try {
      const payload = {
        risk_profile: riskProfile?.profile || 'Moderate',
        min_esg_score: portfolioConfig.min_esg_score,
        max_sector_weight: portfolioConfig.max_sector_weight,
        preferred_sectors: portfolioConfig.preferred_sectors.length ? portfolioConfig.preferred_sectors : null,
        exclude_sectors: portfolioConfig.exclude_sectors.length ? portfolioConfig.exclude_sectors : null,
      }
      const res = await optimizePortfolio(payload)
      setResult(res)
      setPortfolioResult(res)
    } catch {
      // Mock fallback
      const mockHoldings = [
        { ticker: 'INFY.NS', name: 'Infosys', sector: 'Technology', weight: 18.5, esg_score: 86, mu: 16.2, sigma: 22.1, description: 'Carbon-neutral since 2020' },
        { ticker: 'HINDUNILVR.NS', name: 'HUL', sector: 'FMCG', weight: 15.2, esg_score: 87, mu: 12.4, sigma: 16.8, description: 'Net-zero supply chain' },
        { ticker: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Banking', weight: 14.8, esg_score: 83, mu: 14.1, sigma: 23.5, description: 'Best governed private bank' },
        { ticker: 'TATAPOWER.NS', name: 'Tata Power', sector: 'Clean Energy', weight: 12.3, esg_score: 82, mu: 13.8, sigma: 25.2, description: 'India\'s largest renewable energy' },
        { ticker: 'DRREDDY.NS', name: 'Dr Reddy\'s', sector: 'Pharma', weight: 10.1, esg_score: 80, mu: 13.2, sigma: 20.1, description: 'Good health for all' },
        { ticker: 'ASIANPAINT.NS', name: 'Asian Paints', sector: 'Chemicals', weight: 9.8, esg_score: 81, mu: 14.0, sigma: 21.4, description: 'Low-VOC products leader' },
        { ticker: 'TITAN.NS', name: 'Titan', sector: 'Retail', weight: 8.5, esg_score: 81, mu: 12.8, sigma: 19.8, description: 'Responsible jewellery sourcing' },
        { ticker: 'CIPLA.NS', name: 'Cipla', sector: 'Pharma', weight: 6.9, esg_score: 80, mu: 13.0, sigma: 20.5, description: 'Affordable medicines' },
        { ticker: 'WIPRO.NS', name: 'Wipro', sector: 'Technology', weight: 3.9, esg_score: 85, mu: 15.5, sigma: 21.8, description: '100% renewable energy' },
      ]
      const frontier = Array.from({ length: 30 }, (_, i) => ({
        volatility: 12 + i * 0.8, return: 9 + i * 0.4, sharpe: 0.6 + i * 0.01,
      }))
      const sectorAlloc = {}
      mockHoldings.forEach(h => { sectorAlloc[h.sector] = (sectorAlloc[h.sector] || 0) + h.weight })
      const res = {
        holdings: mockHoldings, expected_return: 13.8, volatility: 19.2,
        sharpe_ratio: 0.718, portfolio_esg: 83.2, risk_profile: riskProfile?.profile || 'Moderate',
        efficient_frontier: frontier, sector_allocation: sectorAlloc,
      }
      setResult(res)
      setPortfolioResult(res)
    } finally {
      setLoading(false)
    }
  }

  const sectorPieData = result
    ? Object.entries(result.sector_allocation).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {!result ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">Portfolio Settings</h2>
            <p className="text-slate-400 text-sm">Customise your ESG portfolio constraints</p>
          </div>

          <div className="glass-card p-6 space-y-6">
            {/* ESG floor */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-slate-300 flex items-center gap-2">
                  <Leaf size={14} className="text-forest-400" /> Minimum ESG Score
                </label>
                <span className="text-forest-400 font-bold">{portfolioConfig.min_esg_score}</span>
              </div>
              <input type="range" min="60" max="90" step="5"
                value={portfolioConfig.min_esg_score}
                onChange={e => setPortfolioConfig({ min_esg_score: Number(e.target.value) })}
                className="w-full accent-forest-500" />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>60 (Inclusive)</span><span>90 (Strict)</span>
              </div>
            </div>

            {/* Sector cap */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-slate-300 flex items-center gap-2">
                  <Shield size={14} className="text-blue-400" /> Max Sector Weight
                </label>
                <span className="text-blue-400 font-bold">{Math.round(portfolioConfig.max_sector_weight * 100)}%</span>
              </div>
              <input type="range" min="0.15" max="0.5" step="0.05"
                value={portfolioConfig.max_sector_weight}
                onChange={e => setPortfolioConfig({ max_sector_weight: Number(e.target.value) })}
                className="w-full accent-blue-500" />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>15% (Diversified)</span><span>50% (Concentrated)</span>
              </div>
            </div>

            {/* Risk profile badge */}
            <div className="flex items-center justify-between p-4 bg-forest-950/50 rounded-xl border border-forest-900/40">
              <div className="flex items-center gap-3">
                <Zap size={16} className="text-forest-400" />
                <span className="text-sm text-slate-300">Risk Profile</span>
              </div>
              <span className="text-forest-400 font-semibold">{riskProfile?.profile || 'Moderate'}</span>
            </div>

            <button onClick={handleOptimize} disabled={loading}
              className="btn-primary w-full disabled:opacity-50 text-base py-4">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Leaf size={16} className="animate-spin" /> Optimising Portfolio…
                </span>
              ) : '🌿 Build My ESG Portfolio →'}
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Header stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Expected Return', value: `${result.expected_return}%`, sub: 'per annum', color: 'text-forest-400' },
              { label: 'Volatility', value: `${result.volatility}%`, sub: 'annualised', color: 'text-blue-400' },
              { label: 'Sharpe Ratio', value: result.sharpe_ratio, sub: 'risk-adjusted return', color: 'text-amber-400' },
              { label: 'Avg ESG Score', value: result.portfolio_esg, sub: `${result.num_stocks || result.holdings.length} stocks`, color: 'text-teal-400' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="glass-card p-4">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{label}</div>
                <div className="text-xs text-slate-600">{sub}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Holdings table */}
            <div className="glass-card p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Leaf size={16} className="text-forest-400" /> Portfolio Holdings
              </h3>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {result.holdings.map((h, i) => (
                  <div key={h.ticker} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-forest-950/40 transition-colors">
                    <span className="text-xs text-slate-600 w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{h.name}</div>
                      <div className="text-xs text-slate-500">{h.sector} · ESG {h.esg_score}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-forest-400">{h.weight}%</div>
                      <div className="text-xs text-slate-600">{h.mu}% ret</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sector pie */}
            <div className="glass-card p-5">
              <h3 className="font-semibold text-white mb-4">Sector Allocation</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={sectorPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    dataKey="value" nameKey="name" paddingAngle={2}>
                    {sectorPieData.map((entry) => (
                      <Cell key={entry.name} fill={SECTOR_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v.toFixed(1)}%`}
                    contentStyle={{ background: '#0c1f14', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8 }} />
                  <Legend iconType="circle" iconSize={8}
                    formatter={(v) => <span style={{ fontSize: 11, color: '#94a3b8' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Efficient frontier */}
          <div className="glass-card p-5 mb-6">
            <h3 className="font-semibold text-white mb-1">Efficient Frontier</h3>
            <p className="text-xs text-slate-500 mb-4">Risk vs Return tradeoff for ESG-constrained portfolios</p>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart>
                <XAxis dataKey="volatility" name="Volatility" unit="%" tick={{ fill: '#64748b', fontSize: 11 }} label={{ value: 'Risk (Volatility %)', fill: '#64748b', fontSize: 11, position: 'insideBottom', offset: -5 }} />
                <YAxis dataKey="return" name="Return" unit="%" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ background: '#0c1f14', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8 }}
                  formatter={(v, n) => [`${v}%`, n]} />
                <Scatter data={result.efficient_frontier} fill="#22c55e" opacity={0.7}>
                  {result.efficient_frontier.map((p, i) => (
                    <Cell key={i} fill={`hsl(${120 + i * 2}, 70%, ${35 + i}%)`} />
                  ))}
                </Scatter>
                {/* Optimal point */}
                <Scatter data={[{ volatility: result.volatility, return: result.expected_return }]} fill="#f59e0b" />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-xs text-center text-amber-400 mt-1">🟡 Your optimal portfolio</p>
          </div>

          <button onClick={() => setStep(4)} className="btn-primary w-full text-base py-4">
            Run Monte Carlo Simulation <ChevronRight size={16} className="inline ml-1" />
          </button>
        </motion.div>
      )}
    </div>
  )
}

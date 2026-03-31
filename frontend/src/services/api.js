import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
})

export const getRiskProfile = (answers) =>
  api.post('/risk-profile', answers).then(r => r.data)

export const getGoalPlan = (payload) =>
  api.post('/goal-plan', payload).then(r => r.data)

export const optimizePortfolio = (payload) =>
  api.post('/optimize-portfolio', payload).then(r => r.data)

export const runMonteCarlo = (payload) =>
  api.post('/monte-carlo', payload).then(r => r.data)

export const getEsgUniverse = (params = {}) =>
  api.get('/esg-universe', { params }).then(r => r.data)

export const getSectors = () =>
  api.get('/sectors').then(r => r.data)

export const formatINR = (amount) => {
  if (!amount && amount !== 0) return '—'
  if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(2)} Cr`
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(2)} L`
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

export const formatPct = (val, decimals = 1) =>
  `${Number(val).toFixed(decimals)}%`

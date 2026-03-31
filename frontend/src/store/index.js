import { create } from 'zustand'

export const useAppStore = create((set, get) => ({
  // ── Step tracking ──────────────────────────────────────────────────────
  currentStep: 0,   // 0: welcome, 1: risk, 2: goal, 3: portfolio, 4: results
  setStep: (step) => set({ currentStep: step }),

  // ── Risk profile ────────────────────────────────────────────────────────
  riskAnswers: {},
  riskProfile: null,    // { profile, score, percentage, equity, debt, gold, return, color, description }
  setRiskAnswer: (id, score) =>
    set((s) => ({ riskAnswers: { ...s.riskAnswers, [id]: score } })),
  setRiskProfile: (profile) => set({ riskProfile: profile }),

  // ── Goal ───────────────────────────────────────────────────────────────
  goalData: null,   // { goal_type, target_amount, horizon_years, initial_investment, monthly_sip, ... }
  setGoalData: (data) => set({ goalData: data }),

  // ── Portfolio ──────────────────────────────────────────────────────────
  portfolioConfig: {
    min_esg_score: 70,
    max_sector_weight: 0.35,
    preferred_sectors: [],
    exclude_sectors: [],
  },
  setPortfolioConfig: (cfg) =>
    set((s) => ({ portfolioConfig: { ...s.portfolioConfig, ...cfg } })),
  portfolioResult: null,
  setPortfolioResult: (r) => set({ portfolioResult: r }),

  // ── Monte Carlo ────────────────────────────────────────────────────────
  mcResult: null,
  setMcResult: (r) => set({ mcResult: r }),

  // ── Loading states ─────────────────────────────────────────────────────
  loading: {},
  setLoading: (key, val) =>
    set((s) => ({ loading: { ...s.loading, [key]: val } })),

  // ── Helpers ────────────────────────────────────────────────────────────
  reset: () => set({
    currentStep: 0,
    riskAnswers: {},
    riskProfile: null,
    goalData: null,
    portfolioResult: null,
    mcResult: null,
  }),
}))

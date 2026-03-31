# 🌿 Green Goals — ESG Robo-Advisor

> **India's first ESG-focused, goal-based robo-advisory platform for retail investors.**  
> Built with React, FastAPI, Modern Portfolio Theory, and Monte Carlo simulation.

![Green Goals Banner](./assets/banner.png)

---

## 🎯 Project Overview

Green Goals is a full-stack robo-advisory web application that helps Indian retail investors build personalised, **ESG-compliant portfolios** aligned with their financial goals and risk tolerance.

Unlike generic robo-advisors, this platform exclusively focuses on **Environmental, Social, and Governance (ESG)** investing — making it highly relevant for the rapidly growing sustainable finance segment in India.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🧠 **Behavioural Risk Profiling** | 8-question questionnaire using behavioural finance principles |
| 🎯 **Goal-Based Planning** | 6 goal types with SIP calculator and inflation adjustment |
| 🌿 **ESG Stock Universe** | 45+ NSE-listed stocks with E, S, G scores and real market data |
| 📊 **Portfolio Optimisation** | Modern Portfolio Theory (MPT) with ESG score constraints |
| 🎲 **Monte Carlo Simulation** | 10,000 scenarios to estimate goal achievement probability |
| 📈 **Efficient Frontier** | Visual risk-return tradeoff for ESG-constrained portfolios |
| 🔄 **Rebalancing Alerts** | Drift detection and buy/sell recommendations |
| 💡 **Explainable AI** | Plain-English reasoning behind every recommendation |

---

## 🏗️ Architecture

```
green-goals/
├── backend/                    # Python FastAPI
│   ├── main.py                 # API routes & CORS
│   ├── services/
│   │   ├── esg_data.py         # 45+ Indian ESG stocks
│   │   ├── market_data.py      # yfinance live data fetching
│   │   ├── optimizer.py        # MPT + ESG constraints (scipy)
│   │   └── monte_carlo.py      # 10,000-scenario engine (numpy)
│   ├── models/schemas.py       # Pydantic request/response models
│   └── requirements.txt
│
└── frontend/                   # React + Vite + Tailwind
    └── src/
        ├── pages/
        │   ├── RiskProfile.jsx # Animated questionnaire
        │   ├── Goal.jsx        # Goal planner + chart
        │   ├── Portfolio.jsx   # Optimizer + pie + frontier
        │   └── MonteCarlo.jsx  # Probability ring + fan chart
        ├── store/index.js      # Zustand global state
        ├── services/api.js     # Axios API layer
        └── App.jsx             # Layout + routing
```

---

## 🚀 Local Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

---

## 🌍 Deployment

| Service | Platform | Cost |
|---|---|---|
| Frontend | Vercel | Free |
| Backend | Railway | Free tier |

**Frontend (Vercel):**
```bash
cd frontend
npx vercel --prod
```

**Backend (Railway):**
1. Push to GitHub
2. Connect Railway to repo → select `/backend`
3. Railway auto-detects FastAPI via `railway.toml`
4. Update `VITE_API_URL` in Vercel env vars with Railway URL

---

## 📐 Technical Depth

### Portfolio Optimisation
- **Objective:** Maximise Sharpe ratio (Moderate) / Minimise volatility (Conservative) / Maximise return (Aggressive)
- **Constraints:** Sum of weights = 1, no short-selling, min ESG score ≥ 70, sector cap ≤ 35%
- **Solver:** `scipy.optimize.minimize` with SLSQP method
- **ESG premium:** +0–1% return adjustment for high ESG scores

### Monte Carlo Engine
- **Method:** Geometric Brownian Motion with normal random shocks
- **Parameters:** μ (annual return), σ (annual volatility) from live yfinance data
- **Output:** Success probability, percentile bands (P10/P25/P50/P75/P90), distribution histogram

### ESG Scoring
- Weighted composite: E×0.35 + S×0.30 + G×0.35
- Universe: NIFTY100 ESG Index constituents + additional ESG-rated stocks
- Negative screening: Tobacco, weapons, fossil fuels excluded

---

## 📊 Resume Bullet Points

```
• Built an ESG-focused robo-advisory platform using React, FastAPI, and Python for
  Indian retail investors with 45+ NSE-listed stocks

• Implemented Modern Portfolio Theory (MPT) with ESG score constraints using
  scipy.optimize, generating efficient frontier across 35 risk-return points

• Engineered a vectorised Monte Carlo simulation engine running 10,000 market
  scenarios using NumPy to estimate goal achievement probability

• Integrated real-time market data via yfinance API with sector-based fallback
  for robust data handling

• Deployed full-stack application on Vercel (frontend) and Railway (backend)
  with live shareable URL
```

---

## 🔮 Future Roadmap

- [ ] Tax-loss harvesting module
- [ ] Historical backtesting vs NIFTY100 benchmark
- [ ] ESG news sentiment analysis (NLP)
- [ ] SDG alignment scoring
- [ ] Mobile app (React Native)
- [ ] WhatsApp/Telegram bot integration

---

## 📚 References

1. Markowitz, H. (1952). Portfolio Selection. *Journal of Finance*
2. SEBI Circular on ESG Rating Providers (2022)
3. NIFTY100 ESG Index Methodology — NSE India
4. Sustainalytics ESG Risk Ratings Methodology
5. CFA Institute ESG Investing Guide (2023)

---

*Built as a capstone project demonstrating fintech, sustainable finance, and full-stack development skills.*

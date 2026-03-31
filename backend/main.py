"""
Green Goals Robo-Advisor — FastAPI Backend
All endpoints for risk profiling, portfolio optimization, Monte Carlo.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np

from models.schemas import (
    RiskProfileRequest, GoalRequest,
    PortfolioRequest, MonteCarloRequest,
)
from services.esg_data import get_esg_dataframe, filter_stocks, get_sector_list
from services.market_data import get_returns_for_portfolio, build_covariance_matrix
from services.optimizer import optimize_portfolio, compute_efficient_frontier
from services.monte_carlo import run_monte_carlo, calculate_sip

app = FastAPI(
    title="Green Goals Robo-Advisor API",
    description="ESG-focused Goal-Based Robo-Advisory for Indian Retail Investors",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

RISK_PROFILE_MAP = {
    "Conservative": {"equity": 35, "debt": 55, "gold": 10,
                     "return": 9.0, "color": "#7c3aed",
                     "description": "Capital preservation with steady growth. Suitable for investors with low risk tolerance or short-medium horizons."},
    "Moderate":     {"equity": 60, "debt": 30, "gold": 10,
                     "return": 12.0, "color": "#2563eb",
                     "description": "Balanced growth and stability. The sweet spot for most long-term Indian investors."},
    "Aggressive":   {"equity": 80, "debt": 15, "gold": 5,
                     "return": 15.0, "color": "#16a34a",
                     "description": "Maximum growth orientation. Best for young investors with long horizons and high risk tolerance."},
}


# ─────────────────────────────────────────────────────────────────────────────
# RISK PROFILING
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/risk-profile")
async def compute_risk_profile(req: RiskProfileRequest):
    scores = [
        req.age_score, req.horizon_score, req.drawdown_score,
        req.income_score, req.loss_tolerance_score,
        req.experience_score, req.esg_importance_score,
        req.goal_flexibility_score,
    ]
    total = sum(scores)
    max_score = 8 * 4
    pct = total / max_score * 100

    if pct >= 70:
        profile = "Aggressive"
    elif pct >= 45:
        profile = "Moderate"
    else:
        profile = "Conservative"

    info = RISK_PROFILE_MAP[profile]
    return {
        "profile": profile,
        "score": total,
        "max_score": max_score,
        "percentage": round(pct, 1),
        **info,
    }


# ─────────────────────────────────────────────────────────────────────────────
# ESG UNIVERSE
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/esg-universe")
async def get_esg_universe(min_esg: float = 65, sector: str = None, top_n: int = 45):
    sectors = [sector] if sector else None
    df = filter_stocks(min_esg=min_esg, sectors=sectors, top_n=top_n)
    return {"stocks": df.to_dict(orient="records"), "total": len(df)}


@app.get("/api/sectors")
async def get_sectors():
    return {"sectors": get_sector_list()}


# ─────────────────────────────────────────────────────────────────────────────
# PORTFOLIO OPTIMIZATION
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/optimize-portfolio")
async def optimize(req: PortfolioRequest):
    try:
        # Filter stock universe
        sectors = None
        if req.preferred_sectors:
            sectors = req.preferred_sectors

        stocks_df = filter_stocks(
            min_esg=req.min_esg_score,
            sectors=sectors,
            top_n=20,
        )
        if req.exclude_sectors:
            stocks_df = stocks_df[~stocks_df["sector"].isin(req.exclude_sectors)]

        if len(stocks_df) < 5:
            raise HTTPException(400, "Too few stocks after filtering. Relax ESG/sector constraints.")

        # Enrich with market data
        stocks_df = get_returns_for_portfolio(stocks_df)
        cov = build_covariance_matrix(stocks_df)

        # Optimize
        result = optimize_portfolio(
            stocks_df, cov,
            risk_profile=req.risk_profile,
            min_esg_score=req.min_esg_score,
            max_sector_weight=req.max_sector_weight,
        )

        # Efficient frontier
        frontier = compute_efficient_frontier(stocks_df, cov, n_points=35)

        # Sector breakdown
        sector_weights = {}
        for h in result["holdings"]:
            sector_weights[h["sector"]] = round(
                sector_weights.get(h["sector"], 0) + h["weight"], 2
            )

        return {
            **result,
            "efficient_frontier": frontier,
            "sector_allocation": sector_weights,
            "live_data_count": sum(1 for h in result["holdings"] if h["data_source"] == "live"),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Optimization failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# GOAL PLANNING
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/goal-plan")
async def plan_goal(req: GoalRequest):
    profile_info = RISK_PROFILE_MAP.get(req.risk_profile, RISK_PROFILE_MAP["Moderate"])
    annual_return = profile_info["return"]

    target = req.target_amount
    if req.adjust_for_inflation:
        target *= ((1 + req.inflation_rate / 100) ** req.horizon_years)

    required_sip = calculate_sip(target, req.initial_investment,
                                  annual_return, req.horizon_years)

    # Year-by-year projection
    r = annual_return / 100 / 12
    n_months = req.horizon_years * 12
    sip = req.monthly_sip or required_sip
    corpus = req.initial_investment
    projection = []

    for yr in range(1, req.horizon_years + 1):
        for _ in range(12):
            corpus = corpus * (1 + r) + sip
        projection.append({
            "year": yr,
            "corpus": round(corpus, 0),
            "target": round(target, 0),
            "on_track": corpus >= target * (yr / req.horizon_years) * 0.9,
        })

    return {
        "goal_type": req.goal_type,
        "target_amount": round(target, 0),
        "inflation_adjusted": req.adjust_for_inflation,
        "required_sip": round(required_sip, 0),
        "user_sip": sip,
        "annual_return": annual_return,
        "horizon_years": req.horizon_years,
        "final_corpus": projection[-1]["corpus"] if projection else 0,
        "projection": projection,
        "asset_allocation": {
            "equity": profile_info["equity"],
            "debt": profile_info["debt"],
            "gold": profile_info["gold"],
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# MONTE CARLO
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/monte-carlo")
async def monte_carlo(req: MonteCarloRequest):
    try:
        result = run_monte_carlo(
            initial_investment=req.initial_investment,
            monthly_sip=req.monthly_sip,
            annual_return=req.expected_return,
            annual_volatility=req.volatility,
            horizon_years=req.horizon_years,
            target_amount=req.target_amount,
            n_simulations=req.n_simulations,
        )
        return result
    except Exception as e:
        raise HTTPException(500, f"Simulation failed: {str(e)}")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Green Goals Robo-Advisor API"}

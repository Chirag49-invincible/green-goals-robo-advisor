"""
Portfolio Optimization Engine
Modern Portfolio Theory + ESG constraints using scipy.
Generates efficient frontier and picks optimal portfolio by risk profile.
"""

import numpy as np
import pandas as pd
from scipy.optimize import minimize, differential_evolution


def portfolio_performance(weights: np.ndarray, mu: np.ndarray,
                           cov: np.ndarray) -> tuple:
    ret = float(np.dot(weights, mu))
    vol = float(np.sqrt(weights @ cov @ weights))
    sharpe = ret / vol if vol > 0 else 0.0
    return ret, vol, sharpe


def optimize_portfolio(stocks_df: pd.DataFrame, cov: np.ndarray,
                        risk_profile: str = "Moderate",
                        min_esg_score: float = 70.0,
                        max_sector_weight: float = 0.35) -> dict:
    """
    Optimize portfolio for given risk profile using MPT + ESG constraints.
    Returns weights, expected return, volatility, Sharpe, ESG score.
    """
    n = len(stocks_df)
    mu = stocks_df["mu"].values
    esg = stocks_df["esg_score"].values
    sectors = stocks_df["sector"].tolist()
    unique_sectors = list(set(sectors))

    # ── Constraints ─────────────────────────────────────────────────────────
    constraints = [
        {"type": "eq", "fun": lambda w: np.sum(w) - 1},                      # fully invested
        {"type": "ineq", "fun": lambda w: np.dot(w, esg) - min_esg_score},   # min ESG
    ]
    # sector cap
    for s in unique_sectors:
        idx = [i for i, sec in enumerate(sectors) if sec == s]
        constraints.append({
            "type": "ineq",
            "fun": lambda w, ix=idx: max_sector_weight - np.sum(w[ix])
        })

    bounds = [(0.0, 0.30)] * n   # no short-selling; max 30% per stock

    # ── Objective by risk profile ────────────────────────────────────────────
    def neg_sharpe(w):
        r, v, s = portfolio_performance(w, mu, cov)
        return -s

    def min_vol(w):
        _, v, _ = portfolio_performance(w, mu, cov)
        return v

    def neg_return(w):
        r, _, _ = portfolio_performance(w, mu, cov)
        return -r

    objective_map = {
        "Conservative": min_vol,
        "Moderate":     neg_sharpe,
        "Aggressive":   neg_return,
    }
    objective = objective_map.get(risk_profile, neg_sharpe)

    # ── Initial guess: equal weight ──────────────────────────────────────────
    w0 = np.ones(n) / n
    result = minimize(objective, w0, method="SLSQP",
                      bounds=bounds, constraints=constraints,
                      options={"maxiter": 1000, "ftol": 1e-9})

    if not result.success:
        # fallback: relax ESG floor by 5 points
        constraints[1] = {"type": "ineq",
                          "fun": lambda w: np.dot(w, esg) - (min_esg_score - 5)}
        result = minimize(objective, w0, method="SLSQP",
                          bounds=bounds, constraints=constraints,
                          options={"maxiter": 1000})

    weights = np.clip(result.x, 0, 1)
    weights = weights / weights.sum()

    # trim tiny positions (<1%) and redistribute
    weights[weights < 0.01] = 0
    if weights.sum() > 0:
        weights = weights / weights.sum()

    ret, vol, sharpe = portfolio_performance(weights, mu, cov)
    portfolio_esg = float(np.dot(weights, esg))

    holdings = []
    for i, row in stocks_df.iterrows():
        if weights[i] > 0.001:
            holdings.append({
                "ticker":     row["ticker"],
                "name":       row["name"],
                "sector":     row["sector"],
                "weight":     round(float(weights[i]) * 100, 2),
                "esg_score":  row["esg_score"],
                "env_score":  row["env_score"],
                "social_score": row["social_score"],
                "gov_score":  row["gov_score"],
                "mu":         round(float(row["mu"]) * 100, 2),
                "sigma":      round(float(row["sigma"]) * 100, 2),
                "data_source": row.get("data_source", "estimated"),
                "last_price": row.get("last_price", 0),
                "description": row.get("description", ""),
            })

    # Sort holdings by weight desc
    holdings.sort(key=lambda x: x["weight"], reverse=True)

    return {
        "holdings":         holdings,
        "expected_return":  round(ret * 100, 2),
        "volatility":       round(vol * 100, 2),
        "sharpe_ratio":     round(sharpe, 3),
        "portfolio_esg":    round(portfolio_esg, 1),
        "risk_profile":     risk_profile,
        "num_stocks":       len(holdings),
    }


def compute_efficient_frontier(stocks_df: pd.DataFrame, cov: np.ndarray,
                                 n_points: int = 40) -> list:
    """Generate efficient frontier points for chart."""
    n = len(stocks_df)
    mu = stocks_df["mu"].values
    min_ret = float(np.min(mu))
    max_ret = float(np.max(mu))
    target_returns = np.linspace(min_ret * 0.8, max_ret * 0.95, n_points)

    frontier = []
    for target in target_returns:
        constraints = [
            {"type": "eq", "fun": lambda w: np.sum(w) - 1},
            {"type": "eq", "fun": lambda w, t=target: np.dot(w, mu) - t},
        ]
        bounds = [(0.0, 0.35)] * n
        w0 = np.ones(n) / n

        res = minimize(
            lambda w: float(np.sqrt(w @ cov @ w)),
            w0, method="SLSQP",
            bounds=bounds, constraints=constraints,
            options={"maxiter": 500, "ftol": 1e-8}
        )
        if res.success:
            v = float(np.sqrt(res.x @ cov @ res.x))
            r = float(np.dot(res.x, mu))
            frontier.append({"volatility": round(v * 100, 2),
                              "return": round(r * 100, 2),
                              "sharpe": round(r / v if v > 0 else 0, 3)})

    return frontier

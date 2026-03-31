"""
Monte Carlo Simulation Engine
Runs 10,000 scenarios to estimate goal achievement probability.
"""

import numpy as np


def run_monte_carlo(
    initial_investment: float,
    monthly_sip: float,
    annual_return: float,
    annual_volatility: float,
    horizon_years: int,
    target_amount: float,
    n_simulations: int = 10000,
) -> dict:
    """
    Simulate portfolio growth across n_simulations paths.
    Returns success probability, percentile outcomes, and chart data.
    """
    np.random.seed(42)
    monthly_return = annual_return / 100 / 12
    monthly_vol = annual_volatility / 100 / np.sqrt(12)
    n_months = horizon_years * 12

    # shape: (n_simulations, n_months)
    rand_returns = np.random.normal(monthly_return, monthly_vol,
                                    (n_simulations, n_months))

    # Vectorised simulation
    portfolio = np.full(n_simulations, initial_investment)
    yearly_snapshots = []

    for month in range(n_months):
        portfolio = portfolio * (1 + rand_returns[:, month]) + monthly_sip
        if (month + 1) % 12 == 0:
            yearly_snapshots.append({
                "year": (month + 1) // 12,
                "p10": float(np.percentile(portfolio, 10)),
                "p25": float(np.percentile(portfolio, 25)),
                "p50": float(np.percentile(portfolio, 50)),
                "p75": float(np.percentile(portfolio, 75)),
                "p90": float(np.percentile(portfolio, 90)),
            })

    final_values = portfolio
    success_count = int(np.sum(final_values >= target_amount))
    success_prob = round(success_count / n_simulations * 100, 1)

    # Histogram buckets (30 bins)
    hist_counts, hist_edges = np.histogram(final_values, bins=30)
    histogram = [
        {"value": round(float(hist_edges[i]), 0),
         "count": int(hist_counts[i]),
         "hit_target": hist_edges[i] >= target_amount}
        for i in range(len(hist_counts))
    ]

    return {
        "success_probability": success_prob,
        "n_simulations": n_simulations,
        "target_amount": target_amount,
        "percentiles": {
            "p10": round(float(np.percentile(final_values, 10)), 0),
            "p25": round(float(np.percentile(final_values, 25)), 0),
            "p50": round(float(np.percentile(final_values, 50)), 0),
            "p75": round(float(np.percentile(final_values, 75)), 0),
            "p90": round(float(np.percentile(final_values, 90)), 0),
        },
        "yearly_snapshots": yearly_snapshots,
        "histogram": histogram,
        "mean_outcome": round(float(np.mean(final_values)), 0),
        "std_outcome": round(float(np.std(final_values)), 0),
    }


def calculate_sip(target: float, current: float,
                  annual_return: float, horizon_years: int) -> float:
    """Required monthly SIP to reach target."""
    r = annual_return / 100 / 12
    n = horizon_years * 12
    fv_lump = current * ((1 + r) ** n)
    remaining = target - fv_lump
    if remaining <= 0:
        return 0.0
    if r == 0:
        return remaining / n
    return remaining * r / (((1 + r) ** n) - 1)

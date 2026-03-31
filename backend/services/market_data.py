"""
Market Data Service — fetches real price data from Yahoo Finance (NSE).
Falls back to sector-based estimates if API is unavailable.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import yfinance as yf
from functools import lru_cache

SECTOR_PARAMS = {
    "Technology":    {"mu": 0.16, "sigma": 0.22},
    "Clean Energy":  {"mu": 0.14, "sigma": 0.26},
    "Banking":       {"mu": 0.14, "sigma": 0.24},
    "Finance":       {"mu": 0.13, "sigma": 0.23},
    "FMCG":          {"mu": 0.12, "sigma": 0.16},
    "Pharma":        {"mu": 0.13, "sigma": 0.20},
    "Chemicals":     {"mu": 0.14, "sigma": 0.22},
    "Construction":  {"mu": 0.12, "sigma": 0.25},
    "Automotive":    {"mu": 0.13, "sigma": 0.24},
    "Metals":        {"mu": 0.11, "sigma": 0.28},
    "Energy":        {"mu": 0.12, "sigma": 0.25},
    "Retail":        {"mu": 0.12, "sigma": 0.20},
}


def fetch_historical_returns(tickers: list, period_years: int = 3) -> dict:
    """
    Download historical price data and compute annualized returns & volatility.
    Returns dict: {ticker: {mu, sigma, last_price, currency}}
    Falls back to sector estimates on error.
    """
    end = datetime.today()
    start = end - timedelta(days=365 * period_years)
    results = {}

    try:
        raw = yf.download(
            tickers,
            start=start.strftime("%Y-%m-%d"),
            end=end.strftime("%Y-%m-%d"),
            auto_adjust=True,
            progress=False,
            threads=True,
        )
        if "Close" in raw.columns:
            prices = raw["Close"]
        else:
            prices = raw

        for ticker in tickers:
            try:
                if isinstance(prices, pd.Series):
                    series = prices
                else:
                    series = prices[ticker]
                series = series.dropna()
                if len(series) < 30:
                    raise ValueError("Insufficient data")
                log_returns = np.log(series / series.shift(1)).dropna()
                mu = float(log_returns.mean() * 252)
                sigma = float(log_returns.std() * np.sqrt(252))
                last_price = float(series.iloc[-1])
                results[ticker] = {"mu": mu, "sigma": sigma,
                                   "last_price": last_price, "source": "live"}
            except Exception:
                results[ticker] = None
    except Exception:
        pass

    return results


def get_returns_for_portfolio(stocks_df: pd.DataFrame) -> pd.DataFrame:
    """
    Enrich stocks_df with mu (ann. return) and sigma (ann. volatility).
    Uses live data where available, sector estimates as fallback.
    """
    tickers = stocks_df["ticker"].tolist()
    live_data = fetch_historical_returns(tickers)

    mus, sigmas, sources, prices = [], [], [], []
    for _, row in stocks_df.iterrows():
        t = row["ticker"]
        live = live_data.get(t)
        if live and live.get("mu") and -0.5 < live["mu"] < 1.5 and 0 < live["sigma"] < 2.0:
            # Sanity-check: ESG premium of ~1% for high ESG scores
            esg_premium = max(0, (row["esg_score"] - 70) / 100 * 0.01)
            mus.append(live["mu"] + esg_premium)
            sigmas.append(live["sigma"])
            sources.append("live")
            prices.append(live.get("last_price", 0))
        else:
            sector = row.get("sector", "FMCG")
            params = SECTOR_PARAMS.get(sector, {"mu": 0.12, "sigma": 0.22})
            esg_premium = max(0, (row["esg_score"] - 70) / 100 * 0.01)
            mus.append(params["mu"] + esg_premium)
            sigmas.append(params["sigma"])
            sources.append("estimated")
            prices.append(0)

    df = stocks_df.copy()
    df["mu"] = mus
    df["sigma"] = sigmas
    df["data_source"] = sources
    df["last_price"] = prices
    return df


def build_covariance_matrix(stocks_df: pd.DataFrame) -> np.ndarray:
    """
    Build covariance matrix using sector correlations + individual sigmas.
    """
    n = len(stocks_df)
    sectors = stocks_df["sector"].tolist()
    sigmas = stocks_df["sigma"].values

    corr = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if i == j:
                corr[i, j] = 1.0
            elif sectors[i] == sectors[j]:
                corr[i, j] = 0.65   # same sector
            else:
                corr[i, j] = 0.30   # cross sector

    cov = np.outer(sigmas, sigmas) * corr
    return cov

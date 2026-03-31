"""
ESG Stock Universe — 45 real NSE-listed stocks with curated ESG scores.
Scores sourced from NIFTY100 ESG Index methodology & public sustainability reports.
"""

import pandas as pd

ESG_STOCKS = [
    # ticker, name, sector, env, social, gov, description
    ("INFY.NS",      "Infosys",                "Technology",     82, 85, 90, "Carbon-neutral since 2020; top ESG rated IT firm in Asia"),
    ("TCS.NS",       "TCS",                    "Technology",     80, 88, 88, "Largest IT firm; industry-leading ESG disclosures"),
    ("WIPRO.NS",     "Wipro",                  "Technology",     88, 84, 82, "100% renewable energy target by 2030"),
    ("HCLTECH.NS",   "HCL Technologies",       "Technology",     75, 80, 83, "Strong diversity programs and governance"),
    ("TECHM.NS",     "Tech Mahindra",          "Technology",     72, 79, 80, "Digital transformation with ESG integration"),
    ("TATAPOWER.NS", "Tata Power",             "Clean Energy",   90, 78, 82, "India's largest integrated renewable energy company"),
    ("NTPC.NS",      "NTPC",                   "Clean Energy",   72, 80, 83, "Adding 60GW renewables by 2032"),
    ("ADANIGREEN.NS","Adani Green Energy",     "Clean Energy",   92, 70, 65, "World's largest renewable energy developer"),
    ("POWERGRID.NS", "Power Grid Corp",        "Clean Energy",   76, 82, 86, "Critical grid infra; ESG bond issuer"),
    ("NHPC.NS",      "NHPC",                   "Clean Energy",   84, 79, 81, "Hydropower leader — zero emission generation"),
    ("HDFCBANK.NS",  "HDFC Bank",              "Banking",        74, 86, 91, "Best governed private bank; green finance leader"),
    ("ICICIBANK.NS", "ICICI Bank",             "Banking",        72, 83, 88, "Responsible finance and financial inclusion"),
    ("KOTAKBANK.NS", "Kotak Mahindra Bank",    "Banking",        70, 81, 89, "Strong governance and sustainable lending"),
    ("AXISBANK.NS",  "Axis Bank",              "Banking",        68, 79, 85, "Green bonds and responsible banking initiatives"),
    ("SBIN.NS",      "State Bank of India",    "Banking",        68, 82, 79, "India's largest bank; green finance push"),
    ("HINDUNILVR.NS","Hindustan Unilever",     "FMCG",           87, 90, 89, "Net-zero supply chain target by 2039; Unilever Compass"),
    ("DABUR.NS",     "Dabur India",            "FMCG",           81, 83, 83, "Sustainable sourcing; plastic-neutral by 2025"),
    ("MARICO.NS",    "Marico",                 "FMCG",           79, 81, 83, "Sustainable packaging and responsible sourcing"),
    ("NESTLEIND.NS", "Nestle India",           "FMCG",           80, 83, 86, "Creating Shared Value framework globally adopted"),
    ("BRITANNIA.NS", "Britannia Industries",   "FMCG",           73, 79, 83, "Zero-waste manufacturing and responsible sourcing"),
    ("ASIANPAINT.NS","Asian Paints",           "Chemicals",      79, 81, 86, "Waterborne paints leader; low-VOC products"),
    ("PIDILITIND.NS","Pidilite Industries",    "Chemicals",      76, 79, 83, "Sustainable adhesives; responsible mfg"),
    ("SUNPHARMA.NS", "Sun Pharma",             "Pharma",         73, 81, 83, "Access to medicines; responsible R&D"),
    ("DRREDDY.NS",   "Dr Reddy's",             "Pharma",         76, 83, 84, "Good health for all; strong pharma governance"),
    ("CIPLA.NS",     "Cipla",                  "Pharma",         75, 85, 83, "Affordable medicines; patient-first approach"),
    ("DIVISLAB.NS",  "Divi's Laboratories",    "Pharma",         71, 76, 81, "API manufacturer with env compliance"),
    ("TATAMOTORS.NS","Tata Motors",            "Automotive",     71, 76, 81, "EV leadership — Nexon & Tiago EV"),
    ("MARUTI.NS",    "Maruti Suzuki",          "Automotive",     68, 77, 79, "CNG and hybrid vehicle transition"),
    ("BAJAJ-AUTO.NS","Bajaj Auto",             "Automotive",     66, 75, 81, "EV push with Chetak electric scooter"),
    ("HEROMOTOCO.NS","Hero MotoCorp",          "Automotive",     65, 75, 79, "EV transition and responsible supply chain"),
    ("ULTRACEMCO.NS","UltraTech Cement",       "Construction",   69, 75, 83, "Net-zero carbon concrete roadmap by 2050"),
    ("SHREECEM.NS",  "Shree Cement",           "Construction",   71, 73, 81, "Lowest carbon intensity cement in India"),
    ("AMBUJACEM.NS", "Ambuja Cements",         "Construction",   72, 76, 81, "Renewable energy in cement manufacturing"),
    ("TITAN.NS",     "Titan Company",          "Retail",         76, 84, 86, "Responsible jewellery sourcing; artisan welfare"),
    ("BAJFINANCE.NS","Bajaj Finance",          "Finance",        66, 76, 86, "Responsible lending; strong governance"),
    ("BAJAJFINSV.NS","Bajaj Finserv",          "Finance",        65, 75, 85, "Diversified financial services; ESG framework"),
    ("LICI.NS",      "LIC of India",           "Finance",        64, 80, 76, "Social insurance mandate; largest institutional investor"),
    ("ITC.NS",       "ITC",                    "FMCG",           75, 80, 82, "Agri-business sustainability; paperboard recycling"),
    ("GODREJCP.NS",  "Godrej Consumer",        "FMCG",           77, 83, 81, "Good & Green sustainability strategy"),
    ("MUTHOOTFIN.NS","Muthoot Finance",        "Finance",        63, 73, 81, "Financial inclusion for underserved segments"),
    ("TATASTEEL.NS", "Tata Steel",             "Metals",         66, 73, 83, "Decarbonisation roadmap; net zero by 2045"),
    ("JSWSTEEL.NS",  "JSW Steel",              "Metals",         64, 71, 79, "Green steel initiative; 42% renewable energy"),
    ("COALINDIA.NS", "Coal India",             "Energy",         55, 74, 76, "Transitioning to renewables alongside coal ops"),
    ("DMART.NS",     "Avenue Supermarts",      "Retail",         66, 75, 81, "Efficient operations; community welfare focus"),
    ("TORNTPOWER.NS","Torrent Power",          "Clean Energy",   79, 75, 81, "Renewables-focused distribution utility"),
]


def get_esg_dataframe() -> pd.DataFrame:
    rows = []
    for t, name, sector, env, soc, gov, desc in ESG_STOCKS:
        esg_score = round(env * 0.35 + soc * 0.30 + gov * 0.35, 1)
        rows.append({
            "ticker": t,
            "name": name,
            "sector": sector,
            "env_score": env,
            "social_score": soc,
            "gov_score": gov,
            "esg_score": esg_score,
            "description": desc,
        })
    return pd.DataFrame(rows)


def get_sector_list() -> list:
    df = get_esg_dataframe()
    return sorted(df["sector"].unique().tolist())


def filter_stocks(min_esg: float = 65, sectors: list = None, top_n: int = 20) -> pd.DataFrame:
    df = get_esg_dataframe()
    df = df[df["esg_score"] >= min_esg]
    if sectors:
        df = df[df["sector"].isin(sectors)]
    df = df.sort_values("esg_score", ascending=False).head(top_n)
    return df.reset_index(drop=True)

from pydantic import BaseModel, Field
from typing import Optional, List


class RiskProfileRequest(BaseModel):
    age_score: int = Field(..., ge=1, le=4)
    horizon_score: int = Field(..., ge=1, le=4)
    drawdown_score: int = Field(..., ge=1, le=4)
    income_score: int = Field(..., ge=1, le=4)
    loss_tolerance_score: int = Field(..., ge=1, le=4)
    experience_score: int = Field(..., ge=1, le=4)
    esg_importance_score: int = Field(..., ge=1, le=4)
    goal_flexibility_score: int = Field(..., ge=1, le=4)


class GoalRequest(BaseModel):
    goal_type: str
    target_amount: float = Field(..., gt=0)
    horizon_years: int = Field(..., ge=1, le=40)
    initial_investment: float = Field(0.0, ge=0)
    monthly_sip: float = Field(0.0, ge=0)
    risk_profile: str  # Conservative | Moderate | Aggressive
    adjust_for_inflation: bool = False
    inflation_rate: float = 6.0


class PortfolioRequest(BaseModel):
    risk_profile: str
    min_esg_score: float = Field(70.0, ge=50, le=95)
    max_sector_weight: float = Field(0.35, ge=0.1, le=0.6)
    preferred_sectors: Optional[List[str]] = None
    exclude_sectors: Optional[List[str]] = None


class MonteCarloRequest(BaseModel):
    initial_investment: float = Field(..., ge=0)
    monthly_sip: float = Field(..., ge=0)
    expected_return: float = Field(..., ge=1, le=50)
    volatility: float = Field(..., ge=1, le=80)
    horizon_years: int = Field(..., ge=1, le=40)
    target_amount: float = Field(..., gt=0)
    n_simulations: int = Field(10000, ge=1000, le=20000)

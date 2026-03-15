from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, Dict


class InvestmentCreate(BaseModel):
    category: str
    amount: int
    description: Optional[str] = None
    invested_at: date


class InvestmentUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[int] = None
    description: Optional[str] = None
    invested_at: Optional[date] = None


class InvestmentSchema(BaseModel):
    id: int
    brand_id: int
    user_id: int
    category: str
    amount: int
    description: Optional[str] = None
    invested_at: date
    created_at: datetime

    class Config:
        from_attributes = True


class InvestmentSummary(BaseModel):
    total_invested: int
    by_category: Dict[str, int]

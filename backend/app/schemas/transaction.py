from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class TransactionCreate(BaseModel):
    type: str
    category: str
    amount: int
    payment_method: Optional[str] = None
    order_id: Optional[int] = None
    description: Optional[str] = None
    transaction_date: Optional[date] = None


class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[int] = None
    payment_method: Optional[str] = None
    order_id: Optional[int] = None
    description: Optional[str] = None
    transaction_date: Optional[date] = None


class TransactionSchema(BaseModel):
    id: int
    brand_id: int
    user_id: int
    order_id: Optional[int] = None
    type: str
    category: str
    amount: int
    payment_method: Optional[str] = None
    description: Optional[str] = None
    transaction_date: date
    created_at: datetime

    class Config:
        from_attributes = True

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    unit_price: int
    cost_price: Optional[int] = None
    unit: str = "piece"
    image_url: Optional[str] = None


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    unit_price: Optional[int] = None
    cost_price: Optional[int] = None
    unit: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class Item(BaseModel):
    id: int
    brand_id: int
    name: str
    description: Optional[str] = None
    category: str
    unit_price: int
    cost_price: Optional[int] = None
    unit: str
    image_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

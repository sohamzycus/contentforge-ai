from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class InventoryItemCreate(BaseModel):
    name: str
    category: Optional[str] = None
    unit: str
    current_stock: float = 0
    min_stock: float = 0
    cost_per_unit: Optional[int] = None


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    min_stock: Optional[float] = None
    cost_per_unit: Optional[int] = None


class InventoryItemSchema(BaseModel):
    id: int
    brand_id: int
    name: str
    category: Optional[str] = None
    unit: str
    current_stock: float
    min_stock: float
    cost_per_unit: Optional[int] = None
    is_low_stock: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MovementCreate(BaseModel):
    type: str
    quantity: float
    notes: Optional[str] = None


class MovementSchema(BaseModel):
    id: int
    inventory_item_id: int
    type: str
    quantity: float
    notes: Optional[str] = None
    new_stock: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LowStockAlert(BaseModel):
    id: int
    name: str
    unit: str
    current_stock: float
    min_stock: float
    deficit: float

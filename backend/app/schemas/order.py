from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class OrderItemCreate(BaseModel):
    item_id: int
    quantity: int
    notes: Optional[str] = None


class OrderCreate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    source: str = "WALKIN"
    notes: Optional[str] = None
    items: List[OrderItemCreate]
    discount_amount: int = 0


class StatusUpdate(BaseModel):
    status: str


class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None
    discount_amount: Optional[int] = None


class OrderItemSchema(BaseModel):
    id: int
    item_id: int
    item_name: Optional[str] = None
    quantity: int
    unit_price: int
    total_price: int
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class OrderSchema(BaseModel):
    id: int
    brand_id: int
    order_number: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    source: str
    status: str
    total_amount: int
    discount_amount: int
    net_amount: Optional[int] = None
    notes: Optional[str] = None
    items: List[OrderItemSchema] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderList(BaseModel):
    id: int
    brand_id: int
    order_number: str
    customer_name: Optional[str] = None
    source: str
    status: str
    total_amount: int
    created_at: datetime

    class Config:
        from_attributes = True

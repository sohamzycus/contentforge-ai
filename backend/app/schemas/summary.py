from pydantic import BaseModel
from datetime import date
from typing import Optional, List, Dict


class TopItem(BaseModel):
    item_name: str
    quantity_sold: int
    revenue: int


class BrandDailySummary(BaseModel):
    date: date
    brand_id: int
    brand_name: str
    orders: Dict
    revenue: Dict
    top_items: List[TopItem]
    low_stock_alerts: int


class BrandRangeSummary(BaseModel):
    from_date: date
    to_date: date
    brand_id: int
    brand_name: str
    total_orders: int
    total_income: int
    total_expenses: int
    total_investments: int
    net_profit: int
    average_order_value: int
    top_items: List[TopItem]
    daily_breakdown: List[Dict]


class BrandTriageSummary(BaseModel):
    brand_id: int
    brand_name: str
    orders_today: int
    revenue_today: int
    expenses_today: int
    profit_today: int
    content_generated_today: int
    low_stock_count: int
    top_item: Optional[str] = None


class CombinedTriageSummary(BaseModel):
    date: date
    brands: List[BrandTriageSummary]
    combined: Dict

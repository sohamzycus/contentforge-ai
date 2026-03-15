from datetime import date
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.order import Order
from app.repositories.interfaces.order_repository import IOrderRepository
from app.repositories.sqlalchemy.base import SQLAlchemyRepository


class SQLAlchemyOrderRepository(SQLAlchemyRepository[Order], IOrderRepository):

    def __init__(self, session: Session):
        super().__init__(session, Order)

    def get_by_brand(
        self, brand_id: int, status: Optional[str] = None,
        target_date: Optional[date] = None, skip: int = 0, limit: int = 100,
    ) -> List[Order]:
        q = self._session.query(Order).filter(Order.brand_id == brand_id)
        if status:
            q = q.filter(Order.status == status)
        if target_date:
            q = q.filter(func.date(Order.created_at) == target_date)
        return q.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

    def get_next_order_number(self, brand_id: int, prefix: str, target_date: date) -> str:
        date_str = target_date.strftime("%Y%m%d")
        pattern = f"{prefix}-{date_str}-%"
        count = (
            self._session.query(func.count(Order.id))
            .filter(Order.order_number.like(pattern))
            .scalar()
        ) or 0
        return f"{prefix}-{date_str}-{count + 1:03d}"

    def count_by_brand_and_date(self, brand_id: int, target_date: date) -> int:
        return (
            self._session.query(func.count(Order.id))
            .filter(
                Order.brand_id == brand_id,
                func.date(Order.created_at) == target_date,
            )
            .scalar()
        ) or 0

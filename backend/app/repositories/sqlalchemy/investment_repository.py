from typing import List, Optional, Dict

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.investment import Investment
from app.repositories.interfaces.investment_repository import IInvestmentRepository
from app.repositories.sqlalchemy.base import SQLAlchemyRepository


class SQLAlchemyInvestmentRepository(SQLAlchemyRepository[Investment], IInvestmentRepository):

    def __init__(self, session: Session):
        super().__init__(session, Investment)

    def get_by_brand(self, brand_id: int, category: Optional[str] = None) -> List[Investment]:
        q = self._session.query(Investment).filter(Investment.brand_id == brand_id)
        if category:
            q = q.filter(Investment.category == category)
        return q.order_by(Investment.invested_at.desc()).all()

    def sum_by_brand(self, brand_id: int) -> int:
        result = (
            self._session.query(func.coalesce(func.sum(Investment.amount), 0))
            .filter(Investment.brand_id == brand_id)
            .scalar()
        )
        return int(result)

    def sum_by_brand_grouped(self, brand_id: int) -> Dict[str, int]:
        rows = (
            self._session.query(Investment.category, func.sum(Investment.amount))
            .filter(Investment.brand_id == brand_id)
            .group_by(Investment.category)
            .all()
        )
        return {cat: int(total) for cat, total in rows}

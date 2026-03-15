from datetime import date
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.repositories.interfaces.transaction_repository import ITransactionRepository
from app.repositories.sqlalchemy.base import SQLAlchemyRepository


class SQLAlchemyTransactionRepository(SQLAlchemyRepository[Transaction], ITransactionRepository):

    def __init__(self, session: Session):
        super().__init__(session, Transaction)

    def get_by_brand(
        self, brand_id: int, txn_type: Optional[str] = None,
        from_date: Optional[date] = None, to_date: Optional[date] = None,
        skip: int = 0, limit: int = 100,
    ) -> List[Transaction]:
        q = self._session.query(Transaction).filter(Transaction.brand_id == brand_id)
        if txn_type:
            q = q.filter(Transaction.type == txn_type)
        if from_date:
            q = q.filter(Transaction.transaction_date >= from_date)
        if to_date:
            q = q.filter(Transaction.transaction_date <= to_date)
        return q.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()

    def sum_by_brand_and_date(self, brand_id: int, txn_type: str, target_date: date) -> int:
        result = (
            self._session.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.brand_id == brand_id,
                Transaction.type == txn_type,
                Transaction.transaction_date == target_date,
            )
            .scalar()
        )
        return int(result)

    def sum_by_brand_and_range(self, brand_id: int, txn_type: str, from_date: date, to_date: date) -> int:
        result = (
            self._session.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.brand_id == brand_id,
                Transaction.type == txn_type,
                Transaction.transaction_date >= from_date,
                Transaction.transaction_date <= to_date,
            )
            .scalar()
        )
        return int(result)

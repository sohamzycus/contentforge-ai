from abc import abstractmethod
from datetime import date
from typing import List, Optional

from app.models.transaction import Transaction
from app.repositories.interfaces.base import IRepository


class ITransactionRepository(IRepository[Transaction]):

    @abstractmethod
    def get_by_brand(
        self, brand_id: int, txn_type: Optional[str] = None,
        from_date: Optional[date] = None, to_date: Optional[date] = None,
        skip: int = 0, limit: int = 100,
    ) -> List[Transaction]:
        ...

    @abstractmethod
    def sum_by_brand_and_date(self, brand_id: int, txn_type: str, target_date: date) -> int:
        ...

    @abstractmethod
    def sum_by_brand_and_range(self, brand_id: int, txn_type: str, from_date: date, to_date: date) -> int:
        ...

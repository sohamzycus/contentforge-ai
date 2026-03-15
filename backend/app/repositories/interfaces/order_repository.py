from abc import abstractmethod
from datetime import date
from typing import List, Optional

from app.models.order import Order
from app.repositories.interfaces.base import IRepository


class IOrderRepository(IRepository[Order]):

    @abstractmethod
    def get_by_brand(
        self, brand_id: int, status: Optional[str] = None,
        target_date: Optional[date] = None, skip: int = 0, limit: int = 100,
    ) -> List[Order]:
        ...

    @abstractmethod
    def get_next_order_number(self, brand_id: int, prefix: str, target_date: date) -> str:
        ...

    @abstractmethod
    def count_by_brand_and_date(self, brand_id: int, target_date: date) -> int:
        ...

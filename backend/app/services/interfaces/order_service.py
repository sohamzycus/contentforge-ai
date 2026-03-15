from abc import ABC, abstractmethod
from typing import List, Optional

from app.models.order import Order
from app.schemas.order import OrderCreate, OrderUpdate


class IOrderService(ABC):

    @abstractmethod
    def create_order(self, brand_id: int, user_id: int, data: OrderCreate) -> Order:
        ...

    @abstractmethod
    def list_by_brand(
        self, brand_id: int, status: Optional[str] = None, skip: int = 0, limit: int = 100,
    ) -> List[Order]:
        ...

    @abstractmethod
    def get(self, order_id: int) -> Optional[Order]:
        ...

    @abstractmethod
    def update(self, order_id: int, data: OrderUpdate) -> Order:
        ...

    @abstractmethod
    def update_status(self, order_id: int, new_status: str) -> Order:
        ...

    @abstractmethod
    def delete(self, order_id: int) -> None:
        ...

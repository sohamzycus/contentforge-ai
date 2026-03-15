from abc import ABC, abstractmethod
from typing import List, Optional

from app.models.inventory import InventoryItem, InventoryMovement
from app.schemas.inventory import InventoryItemCreate, InventoryItemUpdate, MovementCreate, LowStockAlert


class IInventoryService(ABC):

    @abstractmethod
    def create_item(self, brand_id: int, data: InventoryItemCreate) -> InventoryItem:
        ...

    @abstractmethod
    def list_by_brand(self, brand_id: int, category: Optional[str] = None) -> List[InventoryItem]:
        ...

    @abstractmethod
    def get(self, item_id: int) -> Optional[InventoryItem]:
        ...

    @abstractmethod
    def update_item(self, item_id: int, data: InventoryItemUpdate) -> InventoryItem:
        ...

    @abstractmethod
    def delete(self, item_id: int) -> None:
        ...

    @abstractmethod
    def record_movement(self, item_id: int, data: MovementCreate) -> InventoryMovement:
        ...

    @abstractmethod
    def get_low_stock_alerts(self, brand_id: int) -> List[LowStockAlert]:
        ...

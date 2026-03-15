from abc import abstractmethod
from typing import List, Optional

from app.models.inventory import InventoryItem, InventoryMovement
from app.repositories.interfaces.base import IRepository


class IInventoryItemRepository(IRepository[InventoryItem]):

    @abstractmethod
    def get_by_brand(self, brand_id: int, category: Optional[str] = None) -> List[InventoryItem]:
        ...

    @abstractmethod
    def get_low_stock(self, brand_id: int) -> List[InventoryItem]:
        ...

    @abstractmethod
    def update_stock(self, item_id: int, delta: float) -> InventoryItem:
        ...


class IInventoryMovementRepository(IRepository[InventoryMovement]):

    @abstractmethod
    def get_by_item(self, inventory_item_id: int, movement_type: Optional[str] = None) -> List[InventoryMovement]:
        ...

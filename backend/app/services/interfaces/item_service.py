from abc import ABC, abstractmethod
from typing import List, Optional

from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate


class IItemService(ABC):

    @abstractmethod
    def create(self, brand_id: int, data: ItemCreate) -> Item:
        ...

    @abstractmethod
    def list_by_brand(self, brand_id: int, category: Optional[str] = None, include_inactive: bool = False) -> List[Item]:
        ...

    @abstractmethod
    def get(self, item_id: int) -> Optional[Item]:
        ...

    @abstractmethod
    def update(self, item_id: int, data: ItemUpdate) -> Item:
        ...

    @abstractmethod
    def delete(self, item_id: int) -> None:
        ...

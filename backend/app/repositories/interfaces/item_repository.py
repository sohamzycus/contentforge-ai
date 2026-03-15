from abc import abstractmethod
from typing import List, Optional

from app.models.item import Item
from app.repositories.interfaces.base import IRepository


class IItemRepository(IRepository[Item]):

    @abstractmethod
    def get_by_brand(self, brand_id: int, category: Optional[str] = None, active_only: bool = True) -> List[Item]:
        ...

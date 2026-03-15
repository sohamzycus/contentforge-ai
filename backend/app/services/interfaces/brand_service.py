from abc import ABC, abstractmethod
from typing import List, Optional

from app.models.brand import Brand
from app.schemas.brand import BrandCreate, BrandUpdate


class IBrandService(ABC):

    @abstractmethod
    def create(self, user_id: int, data: BrandCreate) -> Brand:
        ...

    @abstractmethod
    def list_by_user(self, user_id: int) -> List[Brand]:
        ...

    @abstractmethod
    def get(self, brand_id: int, user_id: int) -> Optional[Brand]:
        ...

    @abstractmethod
    def update(self, brand_id: int, user_id: int, data: BrandUpdate) -> Brand:
        ...

    @abstractmethod
    def deactivate(self, brand_id: int, user_id: int) -> None:
        ...

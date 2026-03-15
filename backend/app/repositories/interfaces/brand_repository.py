from abc import abstractmethod
from typing import List

from app.models.brand import Brand
from app.repositories.interfaces.base import IRepository


class IBrandRepository(IRepository[Brand]):

    @abstractmethod
    def get_by_user(self, user_id: int, active_only: bool = True) -> List[Brand]:
        ...

    @abstractmethod
    def get_by_id_and_user(self, brand_id: int, user_id: int) -> Brand | None:
        ...

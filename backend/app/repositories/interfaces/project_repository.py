from abc import abstractmethod
from typing import List, Optional

from app.models.project import Project
from app.repositories.interfaces.base import IRepository


class IProjectRepository(IRepository[Project]):

    @abstractmethod
    def get_by_user(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Project]:
        ...

    @abstractmethod
    def get_by_id_and_user(self, project_id: int, user_id: int) -> Optional[Project]:
        ...

    @abstractmethod
    def get_by_brand(self, brand_id: int, skip: int = 0, limit: int = 100) -> List[Project]:
        ...

    @abstractmethod
    def count_by_brand_and_date(self, brand_id: int, date) -> int:
        ...

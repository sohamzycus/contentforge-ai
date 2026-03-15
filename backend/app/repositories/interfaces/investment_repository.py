from abc import abstractmethod
from datetime import date
from typing import List, Optional, Dict

from app.models.investment import Investment
from app.repositories.interfaces.base import IRepository


class IInvestmentRepository(IRepository[Investment]):

    @abstractmethod
    def get_by_brand(self, brand_id: int, category: Optional[str] = None) -> List[Investment]:
        ...

    @abstractmethod
    def sum_by_brand(self, brand_id: int) -> int:
        ...

    @abstractmethod
    def sum_by_brand_grouped(self, brand_id: int) -> Dict[str, int]:
        ...

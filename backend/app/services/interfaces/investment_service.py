from abc import ABC, abstractmethod
from typing import List, Optional

from app.models.investment import Investment
from app.schemas.investment import InvestmentCreate, InvestmentSummary, InvestmentUpdate


class IInvestmentService(ABC):

    @abstractmethod
    def create(self, brand_id: int, user_id: int, data: InvestmentCreate) -> Investment:
        ...

    @abstractmethod
    def list_by_brand(self, brand_id: int, category: Optional[str] = None) -> List[Investment]:
        ...

    @abstractmethod
    def get(self, investment_id: int) -> Optional[Investment]:
        ...

    @abstractmethod
    def update(self, investment_id: int, data: InvestmentUpdate) -> Investment:
        ...

    @abstractmethod
    def delete(self, investment_id: int) -> None:
        ...

    @abstractmethod
    def get_summary(self, brand_id: int) -> InvestmentSummary:
        ...

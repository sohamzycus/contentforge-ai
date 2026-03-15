import logging
from typing import List, Optional

from app.core.unit_of_work import IUnitOfWork
from app.models.investment import Investment
from app.schemas.investment import InvestmentCreate, InvestmentSummary, InvestmentUpdate
from app.services.interfaces.investment_service import IInvestmentService

logger = logging.getLogger(__name__)


class InvestmentService(IInvestmentService):

    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def create(self, brand_id: int, user_id: int, data: InvestmentCreate) -> Investment:
        with self._uow:
            inv = Investment(
                brand_id=brand_id,
                user_id=user_id,
                category=data.category,
                amount=data.amount,
                description=data.description,
                invested_at=data.invested_at,
            )
            inv = self._uow.investments.create(inv)
            self._uow.commit()
            self._uow.session.refresh(inv)
            logger.info("Investment recorded: %d in %s (brand=%d)", data.amount, data.category, brand_id)
            return inv

    def list_by_brand(self, brand_id: int, category: Optional[str] = None) -> List[Investment]:
        with self._uow:
            return self._uow.investments.get_by_brand(brand_id, category=category)

    def get(self, investment_id: int) -> Optional[Investment]:
        with self._uow:
            return self._uow.investments.get_by_id(investment_id)

    def update(self, investment_id: int, data: InvestmentUpdate) -> Investment:
        with self._uow:
            inv = self._uow.investments.get_by_id(investment_id)
            if not inv:
                raise ValueError("Investment not found")
            for field, value in data.model_dump(exclude_unset=True).items():
                setattr(inv, field, value)
            self._uow.investments.update(inv)
            self._uow.commit()
            self._uow.session.refresh(inv)
            logger.info("Investment %d updated", investment_id)
            return inv

    def delete(self, investment_id: int) -> None:
        with self._uow:
            inv = self._uow.investments.get_by_id(investment_id)
            if not inv:
                raise ValueError("Investment not found")
            self._uow.investments.delete(investment_id)
            self._uow.commit()
            logger.info("Investment %d deleted", investment_id)

    def get_summary(self, brand_id: int) -> InvestmentSummary:
        with self._uow:
            total = self._uow.investments.sum_by_brand(brand_id)
            by_category = self._uow.investments.sum_by_brand_grouped(brand_id)
            return InvestmentSummary(total_invested=total, by_category=by_category)

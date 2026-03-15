"""ServiceFactory — centralised object creation (GoF: Factory Method).

All service instantiation goes through this factory so that:
- Endpoints never import concrete service/repository classes.
- Swapping implementations (e.g. test doubles) requires changing only this file.
"""

from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.unit_of_work import SQLAlchemyUnitOfWork, IUnitOfWork
from app.services.interfaces.auth_service import IAuthService
from app.services.interfaces.project_service import IProjectService
from app.services.interfaces.content_generator import IContentGenerationStrategy
from app.services.interfaces.brand_service import IBrandService
from app.services.interfaces.item_service import IItemService
from app.services.interfaces.inventory_service import IInventoryService
from app.services.interfaces.order_service import IOrderService
from app.services.interfaces.transaction_service import ITransactionService
from app.services.interfaces.investment_service import IInvestmentService
from app.services.interfaces.triage_service import ITriageService

from app.services.impl.auth_service import AuthService
from app.services.impl.project_service import ProjectService
from app.services.impl.brand_service import BrandService
from app.services.impl.item_service import ItemService
from app.services.impl.inventory_service import InventoryService
from app.services.impl.order_service import OrderService
from app.services.impl.transaction_service import TransactionService
from app.services.impl.investment_service import InvestmentService
from app.services.impl.triage_service import TriageService
from app.services.impl.marketing_agent import LLMContentStrategy


class ServiceFactory:

    def __init__(self, session_factory: sessionmaker):
        self._session_factory = session_factory

    def _create_uow(self) -> IUnitOfWork:
        return SQLAlchemyUnitOfWork(self._session_factory)

    # ── Auth & Projects ──────────────────────────────────────────────

    def create_auth_service(self) -> IAuthService:
        return AuthService(self._create_uow())

    def create_content_strategy(self) -> IContentGenerationStrategy:
        return LLMContentStrategy(
            api_key=settings.effective_ai_api_key,
            base_url=settings.AI_BASE_URL,
            model=settings.AI_MODEL,
        )

    def create_project_service(self) -> IProjectService:
        return ProjectService(
            uow=self._create_uow(),
            content_strategy=self.create_content_strategy(),
        )

    # ── Business Management ──────────────────────────────────────────

    def create_brand_service(self) -> IBrandService:
        return BrandService(self._create_uow())

    def create_item_service(self) -> IItemService:
        return ItemService(self._create_uow())

    def create_inventory_service(self) -> IInventoryService:
        return InventoryService(self._create_uow())

    def create_order_service(self) -> IOrderService:
        return OrderService(self._create_uow())

    def create_transaction_service(self) -> ITransactionService:
        return TransactionService(self._create_uow())

    def create_investment_service(self) -> IInvestmentService:
        return InvestmentService(self._create_uow())

    def create_triage_service(self) -> ITriageService:
        return TriageService(self._create_uow())

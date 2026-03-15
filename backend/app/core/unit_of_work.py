from abc import ABC, abstractmethod
from typing import Self

from sqlalchemy.orm import Session, sessionmaker

from app.repositories.interfaces.user_repository import IUserRepository
from app.repositories.interfaces.project_repository import IProjectRepository
from app.repositories.interfaces.brand_repository import IBrandRepository
from app.repositories.interfaces.item_repository import IItemRepository
from app.repositories.interfaces.inventory_repository import IInventoryItemRepository, IInventoryMovementRepository
from app.repositories.interfaces.order_repository import IOrderRepository
from app.repositories.interfaces.transaction_repository import ITransactionRepository
from app.repositories.interfaces.investment_repository import IInvestmentRepository

from app.repositories.sqlalchemy.user_repository import SQLAlchemyUserRepository
from app.repositories.sqlalchemy.project_repository import SQLAlchemyProjectRepository
from app.repositories.sqlalchemy.brand_repository import SQLAlchemyBrandRepository
from app.repositories.sqlalchemy.item_repository import SQLAlchemyItemRepository
from app.repositories.sqlalchemy.inventory_repository import (
    SQLAlchemyInventoryItemRepository,
    SQLAlchemyInventoryMovementRepository,
)
from app.repositories.sqlalchemy.order_repository import SQLAlchemyOrderRepository
from app.repositories.sqlalchemy.transaction_repository import SQLAlchemyTransactionRepository
from app.repositories.sqlalchemy.investment_repository import SQLAlchemyInvestmentRepository


class IUnitOfWork(ABC):
    """Unit of Work interface (GoF: coordinates repository transactions)."""

    users: IUserRepository
    projects: IProjectRepository
    brands: IBrandRepository
    items: IItemRepository
    inventory_items: IInventoryItemRepository
    inventory_movements: IInventoryMovementRepository
    orders: IOrderRepository
    transactions: ITransactionRepository
    investments: IInvestmentRepository

    @abstractmethod
    def __enter__(self) -> Self:
        ...

    @abstractmethod
    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        ...

    @abstractmethod
    def commit(self) -> None:
        ...

    @abstractmethod
    def rollback(self) -> None:
        ...


class SQLAlchemyUnitOfWork(IUnitOfWork):
    """Concrete Unit of Work backed by a SQLAlchemy session.

    Usage::

        with uow:
            user = uow.users.get_by_email("a@b.com")
            uow.projects.create(Project(...))
            uow.commit()
    """

    def __init__(self, session_factory: sessionmaker):
        self._session_factory = session_factory
        self._session: Session | None = None

    def __enter__(self) -> Self:
        self._session = self._session_factory()
        self.users = SQLAlchemyUserRepository(self._session)
        self.projects = SQLAlchemyProjectRepository(self._session)
        self.brands = SQLAlchemyBrandRepository(self._session)
        self.items = SQLAlchemyItemRepository(self._session)
        self.inventory_items = SQLAlchemyInventoryItemRepository(self._session)
        self.inventory_movements = SQLAlchemyInventoryMovementRepository(self._session)
        self.orders = SQLAlchemyOrderRepository(self._session)
        self.transactions = SQLAlchemyTransactionRepository(self._session)
        self.investments = SQLAlchemyInvestmentRepository(self._session)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        if exc_type:
            self.rollback()
        if self._session:
            self._session.close()

    @property
    def session(self) -> Session:
        """Escape hatch for complex queries that don't fit the repository pattern."""
        if self._session is None:
            raise RuntimeError("UnitOfWork must be used inside a `with` block")
        return self._session

    def commit(self) -> None:
        if self._session:
            self._session.commit()

    def rollback(self) -> None:
        if self._session:
            self._session.rollback()

from app.repositories.interfaces.base import IRepository
from app.repositories.interfaces.user_repository import IUserRepository
from app.repositories.interfaces.project_repository import IProjectRepository
from app.repositories.interfaces.brand_repository import IBrandRepository
from app.repositories.interfaces.item_repository import IItemRepository
from app.repositories.interfaces.inventory_repository import IInventoryItemRepository, IInventoryMovementRepository
from app.repositories.interfaces.order_repository import IOrderRepository
from app.repositories.interfaces.transaction_repository import ITransactionRepository
from app.repositories.interfaces.investment_repository import IInvestmentRepository

__all__ = [
    "IRepository",
    "IUserRepository", "IProjectRepository",
    "IBrandRepository", "IItemRepository",
    "IInventoryItemRepository", "IInventoryMovementRepository",
    "IOrderRepository", "ITransactionRepository", "IInvestmentRepository",
]

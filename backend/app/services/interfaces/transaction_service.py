from abc import ABC, abstractmethod
from datetime import date
from typing import List, Optional

from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate


class ITransactionService(ABC):

    @abstractmethod
    def create(self, brand_id: int, user_id: int, data: TransactionCreate) -> Transaction:
        ...

    @abstractmethod
    def list_by_brand(
        self, brand_id: int, txn_type: Optional[str] = None,
        from_date: Optional[date] = None, to_date: Optional[date] = None,
    ) -> List[Transaction]:
        ...

    @abstractmethod
    def get(self, transaction_id: int) -> Optional[Transaction]:
        ...

    @abstractmethod
    def update(self, transaction_id: int, data: TransactionUpdate) -> Transaction:
        ...

    @abstractmethod
    def delete(self, transaction_id: int) -> None:
        ...

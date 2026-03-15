import logging
from datetime import date
from typing import List, Optional

from app.core.unit_of_work import IUnitOfWork
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate
from app.services.interfaces.transaction_service import ITransactionService

logger = logging.getLogger(__name__)


class TransactionService(ITransactionService):

    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def create(self, brand_id: int, user_id: int, data: TransactionCreate) -> Transaction:
        with self._uow:
            txn = Transaction(
                brand_id=brand_id,
                user_id=user_id,
                order_id=data.order_id,
                type=data.type,
                category=data.category,
                amount=data.amount,
                payment_method=data.payment_method,
                description=data.description,
                transaction_date=data.transaction_date or date.today(),
            )
            txn = self._uow.transactions.create(txn)
            self._uow.commit()
            self._uow.session.refresh(txn)
            logger.info(
                "Transaction recorded: %s %d (brand=%d)", data.type, data.amount, brand_id
            )
            return txn

    def list_by_brand(
        self, brand_id: int, txn_type: Optional[str] = None,
        from_date: Optional[date] = None, to_date: Optional[date] = None,
    ) -> List[Transaction]:
        with self._uow:
            return self._uow.transactions.get_by_brand(
                brand_id, txn_type=txn_type, from_date=from_date, to_date=to_date,
            )

    def get(self, transaction_id: int) -> Optional[Transaction]:
        with self._uow:
            return self._uow.transactions.get_by_id(transaction_id)

    def update(self, transaction_id: int, data: TransactionUpdate) -> Transaction:
        with self._uow:
            txn = self._uow.transactions.get_by_id(transaction_id)
            if not txn:
                raise ValueError("Transaction not found")
            for field, value in data.model_dump(exclude_unset=True).items():
                setattr(txn, field, value)
            self._uow.transactions.update(txn)
            self._uow.commit()
            self._uow.session.refresh(txn)
            logger.info("Transaction %d updated", transaction_id)
            return txn

    def delete(self, transaction_id: int) -> None:
        with self._uow:
            txn = self._uow.transactions.get_by_id(transaction_id)
            if not txn:
                raise ValueError("Transaction not found")
            self._uow.transactions.delete(transaction_id)
            self._uow.commit()
            logger.info("Transaction %d deleted", transaction_id)

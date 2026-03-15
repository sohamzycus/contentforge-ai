from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.inventory import InventoryItem, InventoryMovement
from app.repositories.interfaces.inventory_repository import (
    IInventoryItemRepository,
    IInventoryMovementRepository,
)
from app.repositories.sqlalchemy.base import SQLAlchemyRepository


class SQLAlchemyInventoryItemRepository(SQLAlchemyRepository[InventoryItem], IInventoryItemRepository):

    def __init__(self, session: Session):
        super().__init__(session, InventoryItem)

    def get_by_brand(self, brand_id: int, category: Optional[str] = None) -> List[InventoryItem]:
        q = self._session.query(InventoryItem).filter(InventoryItem.brand_id == brand_id)
        if category:
            q = q.filter(InventoryItem.category == category)
        return q.order_by(InventoryItem.name).all()

    def get_low_stock(self, brand_id: int) -> List[InventoryItem]:
        return (
            self._session.query(InventoryItem)
            .filter(
                InventoryItem.brand_id == brand_id,
                InventoryItem.current_stock <= InventoryItem.min_stock,
            )
            .all()
        )

    def update_stock(self, item_id: int, delta: float) -> InventoryItem:
        item = self.get_by_id(item_id)
        if not item:
            raise ValueError(f"Inventory item {item_id} not found")
        item.current_stock += delta
        self._session.flush()
        return item


class SQLAlchemyInventoryMovementRepository(SQLAlchemyRepository[InventoryMovement], IInventoryMovementRepository):

    def __init__(self, session: Session):
        super().__init__(session, InventoryMovement)

    def get_by_item(self, inventory_item_id: int, movement_type: Optional[str] = None) -> List[InventoryMovement]:
        q = self._session.query(InventoryMovement).filter(
            InventoryMovement.inventory_item_id == inventory_item_id
        )
        if movement_type:
            q = q.filter(InventoryMovement.type == movement_type)
        return q.order_by(InventoryMovement.created_at.desc()).all()

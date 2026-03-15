import logging
from typing import List, Optional

from app.core.events import event_bus
from app.core.unit_of_work import IUnitOfWork
from app.models.inventory import InventoryItem, InventoryMovement
from app.schemas.inventory import (
    InventoryItemCreate, InventoryItemUpdate, MovementCreate, LowStockAlert,
)
from app.services.interfaces.inventory_service import IInventoryService

logger = logging.getLogger(__name__)


class InventoryService(IInventoryService):

    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def create_item(self, brand_id: int, data: InventoryItemCreate) -> InventoryItem:
        with self._uow:
            item = InventoryItem(
                brand_id=brand_id,
                name=data.name,
                category=data.category,
                unit=data.unit,
                current_stock=data.current_stock,
                min_stock=data.min_stock,
                cost_per_unit=data.cost_per_unit,
            )
            item = self._uow.inventory_items.create(item)
            self._uow.commit()
            self._uow.session.refresh(item)
            logger.info("Inventory item created: %s (brand=%d)", data.name, brand_id)
            return item

    def list_by_brand(self, brand_id: int, category: Optional[str] = None) -> List[InventoryItem]:
        with self._uow:
            return self._uow.inventory_items.get_by_brand(brand_id, category=category)

    def get(self, item_id: int) -> Optional[InventoryItem]:
        with self._uow:
            return self._uow.inventory_items.get_by_id(item_id)

    def update_item(self, item_id: int, data: InventoryItemUpdate) -> InventoryItem:
        with self._uow:
            item = self._uow.inventory_items.get_by_id(item_id)
            if not item:
                raise ValueError("Inventory item not found")
            for field, value in data.model_dump(exclude_unset=True).items():
                setattr(item, field, value)
            self._uow.inventory_items.update(item)
            self._uow.commit()
            self._uow.session.refresh(item)
            return item

    def record_movement(self, item_id: int, data: MovementCreate) -> InventoryMovement:
        with self._uow:
            delta = data.quantity if data.type == "IN" else -data.quantity
            updated_item = self._uow.inventory_items.update_stock(item_id, delta)

            movement = InventoryMovement(
                inventory_item_id=item_id,
                type=data.type,
                quantity=data.quantity,
                notes=data.notes,
            )
            movement = self._uow.inventory_movements.create(movement)
            self._uow.commit()
            self._uow.session.refresh(movement)

            if updated_item.current_stock <= updated_item.min_stock:
                event_bus.publish("inventory.low_stock", {
                    "item_id": item_id,
                    "name": updated_item.name,
                    "current_stock": updated_item.current_stock,
                    "min_stock": updated_item.min_stock,
                })

            logger.info(
                "Inventory movement: %s %s %s (item=%d, new_stock=%.1f)",
                data.type, data.quantity, updated_item.unit, item_id, updated_item.current_stock,
            )
            return movement

    def delete(self, item_id: int) -> None:
        with self._uow:
            item = self._uow.inventory_items.get_by_id(item_id)
            if not item:
                raise ValueError("Inventory item not found")
            self._uow.inventory_items.delete(item_id)
            self._uow.commit()
            logger.info("Inventory item deleted: %s (id=%d)", item.name, item_id)

    def get_low_stock_alerts(self, brand_id: int) -> List[LowStockAlert]:
        with self._uow:
            items = self._uow.inventory_items.get_low_stock(brand_id)
            return [
                LowStockAlert(
                    id=item.id,
                    name=item.name,
                    unit=item.unit,
                    current_stock=item.current_stock,
                    min_stock=item.min_stock,
                    deficit=item.min_stock - item.current_stock,
                )
                for item in items
            ]

import logging
from typing import List, Optional

from app.core.unit_of_work import IUnitOfWork
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate
from app.services.interfaces.item_service import IItemService

logger = logging.getLogger(__name__)


class ItemService(IItemService):

    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def create(self, brand_id: int, data: ItemCreate) -> Item:
        with self._uow:
            item = Item(
                brand_id=brand_id,
                name=data.name,
                description=data.description,
                category=data.category,
                unit_price=data.unit_price,
                cost_price=data.cost_price,
                unit=data.unit,
                image_url=data.image_url,
            )
            item = self._uow.items.create(item)
            self._uow.commit()
            self._uow.session.refresh(item)
            logger.info("Item created: %s (brand=%d)", data.name, brand_id)
            return item

    def list_by_brand(self, brand_id: int, category: Optional[str] = None, include_inactive: bool = False) -> List[Item]:
        with self._uow:
            return self._uow.items.get_by_brand(brand_id, category=category, active_only=not include_inactive)

    def get(self, item_id: int) -> Optional[Item]:
        with self._uow:
            return self._uow.items.get_by_id(item_id)

    def update(self, item_id: int, data: ItemUpdate) -> Item:
        with self._uow:
            item = self._uow.items.get_by_id(item_id)
            if not item:
                raise ValueError("Item not found")
            for field, value in data.model_dump(exclude_unset=True).items():
                setattr(item, field, value)
            self._uow.items.update(item)
            self._uow.commit()
            self._uow.session.refresh(item)
            return item

    def delete(self, item_id: int) -> None:
        with self._uow:
            item = self._uow.items.get_by_id(item_id)
            if not item:
                raise ValueError("Item not found")
            self._uow.items.delete(item_id)
            self._uow.commit()
            logger.info("Item deleted: %d", item_id)

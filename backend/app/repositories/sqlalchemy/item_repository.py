from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.item import Item
from app.repositories.interfaces.item_repository import IItemRepository
from app.repositories.sqlalchemy.base import SQLAlchemyRepository


class SQLAlchemyItemRepository(SQLAlchemyRepository[Item], IItemRepository):

    def __init__(self, session: Session):
        super().__init__(session, Item)

    def get_by_brand(self, brand_id: int, category: Optional[str] = None, active_only: bool = True) -> List[Item]:
        q = self._session.query(Item).filter(Item.brand_id == brand_id)
        if active_only:
            q = q.filter(Item.is_active == True)
        if category:
            q = q.filter(Item.category == category)
        return q.order_by(Item.name).all()

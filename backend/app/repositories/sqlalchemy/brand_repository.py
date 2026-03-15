from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.brand import Brand
from app.repositories.interfaces.brand_repository import IBrandRepository
from app.repositories.sqlalchemy.base import SQLAlchemyRepository


class SQLAlchemyBrandRepository(SQLAlchemyRepository[Brand], IBrandRepository):

    def __init__(self, session: Session):
        super().__init__(session, Brand)

    def get_by_user(self, user_id: int, active_only: bool = True) -> List[Brand]:
        q = self._session.query(Brand).filter(Brand.user_id == user_id)
        if active_only:
            q = q.filter(Brand.is_active == True)
        return q.order_by(Brand.created_at.desc()).all()

    def get_by_id_and_user(self, brand_id: int, user_id: int) -> Optional[Brand]:
        return (
            self._session.query(Brand)
            .filter(Brand.id == brand_id, Brand.user_id == user_id)
            .first()
        )

from typing import TypeVar, Generic, Optional, List, Any, Type

from sqlalchemy.orm import Session

from app.repositories.interfaces.base import IRepository

T = TypeVar("T")


class SQLAlchemyRepository(IRepository[T], Generic[T]):
    """Concrete base repository using SQLAlchemy (GoF: Template Method for common CRUD)."""

    def __init__(self, session: Session, model_class: Type[T]):
        self._session = session
        self._model_class = model_class

    def get_by_id(self, entity_id: int) -> Optional[T]:
        return self._session.query(self._model_class).filter(
            self._model_class.id == entity_id
        ).first()

    def get_all(self, skip: int = 0, limit: int = 100, **filters: Any) -> List[T]:
        query = self._session.query(self._model_class)
        for attr, value in filters.items():
            if hasattr(self._model_class, attr) and value is not None:
                query = query.filter(getattr(self._model_class, attr) == value)
        return query.offset(skip).limit(limit).all()

    def create(self, entity: T) -> T:
        self._session.add(entity)
        self._session.flush()
        self._session.refresh(entity)
        return entity

    def update(self, entity: T) -> T:
        self._session.merge(entity)
        self._session.flush()
        return entity

    def delete(self, entity_id: int) -> None:
        entity = self.get_by_id(entity_id)
        if entity:
            self._session.delete(entity)
            self._session.flush()

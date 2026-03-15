from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional, List, Any

T = TypeVar("T")


class IRepository(ABC, Generic[T]):
    """Base repository interface following the Repository pattern (GoF: Mediator for data access)."""

    @abstractmethod
    def get_by_id(self, entity_id: int) -> Optional[T]:
        ...

    @abstractmethod
    def get_all(self, skip: int = 0, limit: int = 100, **filters: Any) -> List[T]:
        ...

    @abstractmethod
    def create(self, entity: T) -> T:
        ...

    @abstractmethod
    def update(self, entity: T) -> T:
        ...

    @abstractmethod
    def delete(self, entity_id: int) -> None:
        ...

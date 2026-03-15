from abc import abstractmethod
from typing import Optional

from app.models.user import User
from app.repositories.interfaces.base import IRepository


class IUserRepository(IRepository[User]):

    @abstractmethod
    def get_by_email(self, email: str) -> Optional[User]:
        ...

from abc import ABC, abstractmethod
from typing import Tuple

from app.models.user import User
from app.schemas.user import UserCreate, UserLogin


class IAuthService(ABC):

    @abstractmethod
    def register(self, data: UserCreate) -> User:
        ...

    @abstractmethod
    def login(self, data: UserLogin) -> Tuple[str, str]:
        """Returns (access_token, token_type)."""
        ...

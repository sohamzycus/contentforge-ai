import logging
from datetime import timedelta
from typing import Tuple

from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.unit_of_work import IUnitOfWork
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.services.interfaces.auth_service import IAuthService

logger = logging.getLogger(__name__)


class AuthService(IAuthService):

    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def register(self, data: UserCreate) -> User:
        with self._uow:
            existing = self._uow.users.get_by_email(data.email)
            if existing:
                raise ValueError("Email already registered")

            user = User(
                email=data.email,
                hashed_password=get_password_hash(data.password),
                full_name=data.full_name,
            )
            user = self._uow.users.create(user)
            self._uow.commit()
            logger.info("User registered: %s", data.email)
            return user

    def login(self, data: UserLogin) -> Tuple[str, str]:
        with self._uow:
            user = self._uow.users.get_by_email(data.email)
            if not user or not verify_password(data.password, user.hashed_password):
                raise ValueError("Incorrect email or password")

            token = create_access_token(
                data={"sub": user.email},
                expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            )
            return token, "bearer"

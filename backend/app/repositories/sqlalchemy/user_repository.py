from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.interfaces.user_repository import IUserRepository
from app.repositories.sqlalchemy.base import SQLAlchemyRepository


class SQLAlchemyUserRepository(SQLAlchemyRepository[User], IUserRepository):

    def __init__(self, session: Session):
        super().__init__(session, User)

    def get_by_email(self, email: str) -> Optional[User]:
        return self._session.query(User).filter(User.email == email).first()

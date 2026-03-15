from typing import List, Optional
from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.project import Project
from app.repositories.interfaces.project_repository import IProjectRepository
from app.repositories.sqlalchemy.base import SQLAlchemyRepository


class SQLAlchemyProjectRepository(SQLAlchemyRepository[Project], IProjectRepository):

    def __init__(self, session: Session):
        super().__init__(session, Project)

    def get_by_user(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Project]:
        return (
            self._session.query(Project)
            .filter(Project.user_id == user_id)
            .order_by(Project.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_id_and_user(self, project_id: int, user_id: int) -> Optional[Project]:
        return (
            self._session.query(Project)
            .filter(Project.id == project_id, Project.user_id == user_id)
            .first()
        )

    def get_by_brand(self, brand_id: int, skip: int = 0, limit: int = 100) -> List[Project]:
        return (
            self._session.query(Project)
            .filter(Project.brand_id == brand_id)
            .order_by(Project.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_brand_and_date(self, brand_id: int, target_date: date) -> int:
        return (
            self._session.query(func.count(Project.id))
            .filter(
                Project.brand_id == brand_id,
                func.date(Project.created_at) == target_date,
            )
            .scalar()
        ) or 0

import logging
from typing import Any, Dict, List, Optional

from app.core.unit_of_work import IUnitOfWork
from app.models.project import Project
from app.schemas.project import ProjectCreate
from app.services.interfaces.content_generator import IContentGenerationStrategy
from app.services.interfaces.project_service import IProjectService

logger = logging.getLogger(__name__)


class ProjectService(IProjectService):

    def __init__(self, uow: IUnitOfWork, content_strategy: IContentGenerationStrategy):
        self._uow = uow
        self._content_strategy = content_strategy

    def create_with_content(
        self, user_id: int, data: ProjectCreate, brand_id: Optional[int] = None
    ) -> Project:
        content = self._content_strategy.generate(
            product_name=data.product_name,
            product_description=data.product_description,
            target_audience=data.target_audience,
            unique_selling_points=data.unique_selling_points,
        )

        with self._uow:
            project = Project(
                user_id=user_id,
                brand_id=brand_id,
                product_name=data.product_name,
                product_description=data.product_description,
                target_audience=data.target_audience,
                unique_selling_points=data.unique_selling_points,
                content=content,
            )
            project = self._uow.projects.create(project)
            self._uow.commit()
            self._uow.session.refresh(project)
            logger.info("Project created: %s (user=%d)", data.product_name, user_id)
            return project

    def list_by_user(self, user_id: int) -> List[Project]:
        with self._uow:
            return self._uow.projects.get_by_user(user_id)

    def get_by_id(self, project_id: int, user_id: int) -> Optional[Project]:
        with self._uow:
            return self._uow.projects.get_by_id_and_user(project_id, user_id)

    def list_by_brand(self, brand_id: int, user_id: int) -> List[Project]:
        with self._uow:
            return self._uow.projects.get_by_brand(brand_id)

    def save_images(self, project_id: int, user_id: int, images_data: Dict[str, Any]) -> Project:
        with self._uow:
            project = self._uow.projects.get_by_id_and_user(project_id, user_id)
            if not project:
                raise ValueError("Project not found")

            content = dict(project.content) if project.content else {}
            content["generated_images"] = images_data
            project.content = content

            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(project, "content")

            self._uow.projects.update(project)
            self._uow.commit()
            self._uow.session.refresh(project)
            logger.info("Images saved to project %d", project_id)
            return project

    def delete(self, project_id: int, user_id: int) -> None:
        with self._uow:
            project = self._uow.projects.get_by_id_and_user(project_id, user_id)
            if not project:
                raise ValueError("Project not found")
            self._uow.projects.delete(project_id)
            self._uow.commit()
            logger.info("Project deleted: %d (user=%d)", project_id, user_id)

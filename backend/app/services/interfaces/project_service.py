from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from app.models.project import Project
from app.schemas.project import ProjectCreate


class IProjectService(ABC):

    @abstractmethod
    def create_with_content(self, user_id: int, data: ProjectCreate, brand_id: Optional[int] = None) -> Project:
        ...

    @abstractmethod
    def list_by_user(self, user_id: int) -> List[Project]:
        ...

    @abstractmethod
    def get_by_id(self, project_id: int, user_id: int) -> Optional[Project]:
        ...

    @abstractmethod
    def list_by_brand(self, brand_id: int, user_id: int) -> List[Project]:
        ...

    @abstractmethod
    def save_images(self, project_id: int, user_id: int, images_data: Dict[str, Any]) -> Project:
        ...

    @abstractmethod
    def delete(self, project_id: int, user_id: int) -> None:
        ...

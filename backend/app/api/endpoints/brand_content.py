from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_project_service, get_brand_service
from app.models.user import User
from app.schemas.project import ProjectCreate, Project as ProjectSchema
from app.services.interfaces.project_service import IProjectService
from app.services.interfaces.brand_service import IBrandService

router = APIRouter()


@router.get("/{brand_id}/content", response_model=List[ProjectSchema])
def list_brand_content(
    brand_id: int,
    current_user: User = Depends(get_current_user),
    project_service: IProjectService = Depends(get_project_service),
    brand_service: IBrandService = Depends(get_brand_service),
):
    brand = brand_service.get(brand_id, current_user.id)
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    return project_service.list_by_brand(brand_id, current_user.id)


@router.post("/{brand_id}/generate-content", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
def generate_brand_content(
    brand_id: int,
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    project_service: IProjectService = Depends(get_project_service),
    brand_service: IBrandService = Depends(get_brand_service),
):
    """Generate marketing content linked to a specific brand."""
    brand = brand_service.get(brand_id, current_user.id)
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    try:
        return project_service.create_with_content(current_user.id, data, brand_id=brand_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate content: {exc}",
        )

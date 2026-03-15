from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, Dict, List, Optional

from pydantic import BaseModel

from app.api.deps import get_current_user, get_project_service
from app.models.user import User
from app.schemas.project import ProjectCreate, Project as ProjectSchema, ProjectList
from app.services.interfaces.project_service import IProjectService


class SaveImagesRequest(BaseModel):
    images: List[Dict[str, Any]]
    recommended_index: int = 0
    provider: Optional[str] = None
    prompt: Optional[str] = None

router = APIRouter()


@router.post("", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    project_service: IProjectService = Depends(get_project_service),
):
    """Create a new project and generate marketing content."""
    try:
        return project_service.create_with_content(current_user.id, project_data)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate marketing content: {exc}",
        )


@router.get("", response_model=List[ProjectList])
def list_projects(
    current_user: User = Depends(get_current_user),
    project_service: IProjectService = Depends(get_project_service),
):
    """List all projects for the current user."""
    return project_service.list_by_user(current_user.id)


@router.get("/{project_id}", response_model=ProjectSchema)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    project_service: IProjectService = Depends(get_project_service),
):
    """Get a specific project by ID."""
    project = project_service.get_by_id(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.patch("/{project_id}/images", response_model=ProjectSchema)
def save_project_images(
    project_id: int,
    payload: SaveImagesRequest,
    current_user: User = Depends(get_current_user),
    project_service: IProjectService = Depends(get_project_service),
):
    """Persist generated images to a project so they survive navigation."""
    try:
        return project_service.save_images(
            project_id,
            current_user.id,
            {
                "images": payload.images,
                "recommended_index": payload.recommended_index,
                "provider": payload.provider,
                "prompt": payload.prompt,
            },
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    project_service: IProjectService = Depends(get_project_service),
):
    """Delete a project."""
    try:
        project_service.delete(project_id, current_user.id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return None

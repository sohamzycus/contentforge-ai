from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.api.deps import get_current_user, get_brand_service
from app.models.user import User
from app.schemas.brand import BrandCreate, BrandUpdate, Brand as BrandSchema, BrandList
from app.services.interfaces.brand_service import IBrandService

router = APIRouter()


@router.post("", response_model=BrandSchema, status_code=status.HTTP_201_CREATED)
def create_brand(
    data: BrandCreate,
    current_user: User = Depends(get_current_user),
    service: IBrandService = Depends(get_brand_service),
):
    return service.create(current_user.id, data)


@router.get("", response_model=List[BrandList])
def list_brands(
    current_user: User = Depends(get_current_user),
    service: IBrandService = Depends(get_brand_service),
):
    return service.list_by_user(current_user.id)


@router.get("/{brand_id}", response_model=BrandSchema)
def get_brand(
    brand_id: int,
    current_user: User = Depends(get_current_user),
    service: IBrandService = Depends(get_brand_service),
):
    brand = service.get(brand_id, current_user.id)
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    return brand


@router.patch("/{brand_id}", response_model=BrandSchema)
def update_brand(
    brand_id: int,
    data: BrandUpdate,
    current_user: User = Depends(get_current_user),
    service: IBrandService = Depends(get_brand_service),
):
    try:
        return service.update(brand_id, current_user.id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_brand(
    brand_id: int,
    current_user: User = Depends(get_current_user),
    service: IBrandService = Depends(get_brand_service),
):
    try:
        service.deactivate(brand_id, current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return None

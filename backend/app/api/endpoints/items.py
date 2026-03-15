from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional

from app.api.deps import get_current_user, get_item_service, get_brand_service
from app.models.user import User
from app.schemas.item import ItemCreate, ItemUpdate, Item as ItemSchema
from app.services.interfaces.item_service import IItemService
from app.services.interfaces.brand_service import IBrandService

router = APIRouter()


def _verify_brand_ownership(brand_id: int, user: User, brand_service: IBrandService):
    brand = brand_service.get(brand_id, user.id)
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    return brand


@router.post("/{brand_id}/items", response_model=ItemSchema, status_code=status.HTTP_201_CREATED)
def create_item(
    brand_id: int,
    data: ItemCreate,
    current_user: User = Depends(get_current_user),
    service: IItemService = Depends(get_item_service),
    brand_service: IBrandService = Depends(get_brand_service),
):
    _verify_brand_ownership(brand_id, current_user, brand_service)
    return service.create(brand_id, data)


@router.get("/{brand_id}/items", response_model=List[ItemSchema])
def list_items(
    brand_id: int,
    category: Optional[str] = Query(None),
    include_inactive: bool = Query(False),
    current_user: User = Depends(get_current_user),
    service: IItemService = Depends(get_item_service),
    brand_service: IBrandService = Depends(get_brand_service),
):
    _verify_brand_ownership(brand_id, current_user, brand_service)
    return service.list_by_brand(brand_id, category=category, include_inactive=include_inactive)


@router.get("/items/{item_id}", response_model=ItemSchema)
def get_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    service: IItemService = Depends(get_item_service),
):
    item = service.get(item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item


@router.patch("/items/{item_id}", response_model=ItemSchema)
def update_item(
    item_id: int,
    data: ItemUpdate,
    current_user: User = Depends(get_current_user),
    service: IItemService = Depends(get_item_service),
):
    try:
        return service.update(item_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    service: IItemService = Depends(get_item_service),
):
    try:
        service.delete(item_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional

from app.api.deps import get_current_user, get_inventory_service, get_brand_service
from app.models.user import User
from app.schemas.inventory import (
    InventoryItemCreate, InventoryItemUpdate, InventoryItemSchema,
    MovementCreate, MovementSchema, LowStockAlert,
)
from app.services.interfaces.inventory_service import IInventoryService
from app.services.interfaces.brand_service import IBrandService

router = APIRouter()


def _verify_brand(brand_id: int, user: User, brand_service: IBrandService):
    brand = brand_service.get(brand_id, user.id)
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")


@router.post("/{brand_id}/inventory", response_model=InventoryItemSchema, status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    brand_id: int,
    data: InventoryItemCreate,
    current_user: User = Depends(get_current_user),
    service: IInventoryService = Depends(get_inventory_service),
    brand_service: IBrandService = Depends(get_brand_service),
):
    _verify_brand(brand_id, current_user, brand_service)
    return service.create_item(brand_id, data)


@router.get("/inventory/{item_id}", response_model=InventoryItemSchema)
def get_inventory_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    service: IInventoryService = Depends(get_inventory_service),
):
    item = service.get(item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")
    return item


@router.get("/{brand_id}/inventory", response_model=List[InventoryItemSchema])
def list_inventory(
    brand_id: int,
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    service: IInventoryService = Depends(get_inventory_service),
    brand_service: IBrandService = Depends(get_brand_service),
):
    _verify_brand(brand_id, current_user, brand_service)
    return service.list_by_brand(brand_id, category=category)


@router.delete("/inventory/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    service: IInventoryService = Depends(get_inventory_service),
):
    try:
        service.delete(item_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.patch("/inventory/{item_id}", response_model=InventoryItemSchema)
def update_inventory_item(
    item_id: int,
    data: InventoryItemUpdate,
    current_user: User = Depends(get_current_user),
    service: IInventoryService = Depends(get_inventory_service),
):
    try:
        return service.update_item(item_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post("/inventory/{item_id}/movements", response_model=MovementSchema, status_code=status.HTTP_201_CREATED)
def record_movement(
    item_id: int,
    data: MovementCreate,
    current_user: User = Depends(get_current_user),
    service: IInventoryService = Depends(get_inventory_service),
):
    try:
        return service.record_movement(item_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/{brand_id}/inventory/low-stock", response_model=List[LowStockAlert])
def low_stock_alerts(
    brand_id: int,
    current_user: User = Depends(get_current_user),
    service: IInventoryService = Depends(get_inventory_service),
    brand_service: IBrandService = Depends(get_brand_service),
):
    _verify_brand(brand_id, current_user, brand_service)
    return service.get_low_stock_alerts(brand_id)

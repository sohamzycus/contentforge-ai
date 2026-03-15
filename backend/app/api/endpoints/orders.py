from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional

from app.api.deps import get_current_user, get_order_service, get_brand_service
from app.models.user import User
from app.schemas.order import OrderCreate, OrderSchema, OrderUpdate, StatusUpdate
from app.services.interfaces.order_service import IOrderService
from app.services.interfaces.brand_service import IBrandService

router = APIRouter()


def _verify_brand(brand_id: int, user: User, brand_service: IBrandService):
    brand = brand_service.get(brand_id, user.id)
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")


@router.post("/{brand_id}/orders", response_model=OrderSchema, status_code=status.HTTP_201_CREATED)
def create_order(
    brand_id: int,
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    service: IOrderService = Depends(get_order_service),
    brand_service: IBrandService = Depends(get_brand_service),
):
    _verify_brand(brand_id, current_user, brand_service)
    try:
        return service.create_order(brand_id, current_user.id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/{brand_id}/orders", response_model=List[OrderSchema])
def list_orders(
    brand_id: int,
    order_status: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    service: IOrderService = Depends(get_order_service),
    brand_service: IBrandService = Depends(get_brand_service),
):
    _verify_brand(brand_id, current_user, brand_service)
    return service.list_by_brand(brand_id, status=order_status, skip=skip, limit=limit)


@router.get("/orders/{order_id}", response_model=OrderSchema)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    service: IOrderService = Depends(get_order_service),
):
    order = service.get(order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.patch("/orders/{order_id}", response_model=OrderSchema)
def update_order(
    order_id: int,
    data: OrderUpdate,
    current_user: User = Depends(get_current_user),
    service: IOrderService = Depends(get_order_service),
):
    try:
        return service.update(order_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.patch("/orders/{order_id}/status", response_model=OrderSchema)
def update_order_status(
    order_id: int,
    data: StatusUpdate,
    current_user: User = Depends(get_current_user),
    service: IOrderService = Depends(get_order_service),
):
    try:
        return service.update_status(order_id, data.status)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.delete("/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    service: IOrderService = Depends(get_order_service),
):
    try:
        service.delete(order_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

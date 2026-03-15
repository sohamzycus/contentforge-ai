from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional

from app.api.deps import get_current_user, get_transaction_service, get_brand_service
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionSchema, TransactionUpdate
from app.services.interfaces.transaction_service import ITransactionService
from app.services.interfaces.brand_service import IBrandService

router = APIRouter()


def _verify_brand(brand_id: int, user: User, brand_service: IBrandService):
    brand = brand_service.get(brand_id, user.id)
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")


@router.post("/{brand_id}/transactions", response_model=TransactionSchema, status_code=status.HTTP_201_CREATED)
def create_transaction(
    brand_id: int,
    data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    service: ITransactionService = Depends(get_transaction_service),
    brand_service: IBrandService = Depends(get_brand_service),
):
    _verify_brand(brand_id, current_user, brand_service)
    return service.create(brand_id, current_user.id, data)


@router.get("/transactions/{transaction_id}", response_model=TransactionSchema)
def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    service: ITransactionService = Depends(get_transaction_service),
):
    txn = service.get(transaction_id)
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return txn


@router.get("/{brand_id}/transactions", response_model=List[TransactionSchema])
def list_transactions(
    brand_id: int,
    txn_type: Optional[str] = Query(None, alias="type"),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    service: ITransactionService = Depends(get_transaction_service),
    brand_service: IBrandService = Depends(get_brand_service),
):
    _verify_brand(brand_id, current_user, brand_service)
    return service.list_by_brand(brand_id, txn_type=txn_type, from_date=from_date, to_date=to_date)


@router.patch("/transactions/{transaction_id}", response_model=TransactionSchema)
def update_transaction(
    transaction_id: int,
    data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    service: ITransactionService = Depends(get_transaction_service),
):
    try:
        return service.update(transaction_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    service: ITransactionService = Depends(get_transaction_service),
):
    try:
        service.delete(transaction_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

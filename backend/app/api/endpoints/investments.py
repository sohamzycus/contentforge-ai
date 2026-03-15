from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional

from app.api.deps import get_current_user, get_investment_service, get_brand_service
from app.models.user import User
from app.schemas.investment import InvestmentCreate, InvestmentSchema, InvestmentSummary, InvestmentUpdate
from app.services.interfaces.investment_service import IInvestmentService
from app.services.interfaces.brand_service import IBrandService

router = APIRouter()


def _verify_brand(brand_id: int, user: User, brand_service: IBrandService):
    brand = brand_service.get(brand_id, user.id)
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")


@router.post("/{brand_id}/investments", response_model=InvestmentSchema, status_code=status.HTTP_201_CREATED)
def create_investment(
    brand_id: int,
    data: InvestmentCreate,
    current_user: User = Depends(get_current_user),
    service: IInvestmentService = Depends(get_investment_service),
    brand_service: IBrandService = Depends(get_brand_service),
):
    _verify_brand(brand_id, current_user, brand_service)
    return service.create(brand_id, current_user.id, data)


@router.get("/investments/{investment_id}", response_model=InvestmentSchema)
def get_investment(
    investment_id: int,
    current_user: User = Depends(get_current_user),
    service: IInvestmentService = Depends(get_investment_service),
):
    inv = service.get(investment_id)
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investment not found")
    return inv


@router.get("/{brand_id}/investments", response_model=List[InvestmentSchema])
def list_investments(
    brand_id: int,
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    service: IInvestmentService = Depends(get_investment_service),
    brand_service: IBrandService = Depends(get_brand_service),
):
    _verify_brand(brand_id, current_user, brand_service)
    return service.list_by_brand(brand_id, category=category)


@router.patch("/investments/{investment_id}", response_model=InvestmentSchema)
def update_investment(
    investment_id: int,
    data: InvestmentUpdate,
    current_user: User = Depends(get_current_user),
    service: IInvestmentService = Depends(get_investment_service),
):
    try:
        return service.update(investment_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete("/investments/{investment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_investment(
    investment_id: int,
    current_user: User = Depends(get_current_user),
    service: IInvestmentService = Depends(get_investment_service),
):
    try:
        service.delete(investment_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get("/{brand_id}/investments/summary", response_model=InvestmentSummary)
def investment_summary(
    brand_id: int,
    current_user: User = Depends(get_current_user),
    service: IInvestmentService = Depends(get_investment_service),
    brand_service: IBrandService = Depends(get_brand_service),
):
    _verify_brand(brand_id, current_user, brand_service)
    return service.get_summary(brand_id)

from datetime import date
from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user, get_triage_service
from app.models.user import User
from app.schemas.summary import CombinedTriageSummary
from app.services.interfaces.triage_service import ITriageService

router = APIRouter()


@router.get("/daily", response_model=CombinedTriageSummary)
def daily_triage(
    target_date: date = Query(default=None),
    current_user: User = Depends(get_current_user),
    service: ITriageService = Depends(get_triage_service),
):
    """Unified daily triage dashboard — orders, revenue, content, inventory across all brands."""
    return service.get_daily_triage(current_user.id, target_date or date.today())

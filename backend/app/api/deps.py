"""Shared FastAPI dependencies — wires the factory into Depends()."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db, SessionLocal
from app.core.factory import ServiceFactory
from app.core.security import decode_access_token
from app.models.user import User
from app.services.interfaces.auth_service import IAuthService
from app.services.interfaces.project_service import IProjectService
from app.services.interfaces.brand_service import IBrandService
from app.services.interfaces.item_service import IItemService
from app.services.interfaces.inventory_service import IInventoryService
from app.services.interfaces.order_service import IOrderService
from app.services.interfaces.transaction_service import ITransactionService
from app.services.interfaces.investment_service import IInvestmentService
from app.services.interfaces.triage_service import ITriageService

security = HTTPBearer()

_factory = ServiceFactory(SessionLocal)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Decode JWT and return the authenticated User."""
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


# ── Service providers ────────────────────────────────────────────────

def get_auth_service() -> IAuthService:
    return _factory.create_auth_service()


def get_project_service() -> IProjectService:
    return _factory.create_project_service()


def get_brand_service() -> IBrandService:
    return _factory.create_brand_service()


def get_item_service() -> IItemService:
    return _factory.create_item_service()


def get_inventory_service() -> IInventoryService:
    return _factory.create_inventory_service()


def get_order_service() -> IOrderService:
    return _factory.create_order_service()


def get_transaction_service() -> ITransactionService:
    return _factory.create_transaction_service()


def get_investment_service() -> IInvestmentService:
    return _factory.create_investment_service()


def get_triage_service() -> ITriageService:
    return _factory.create_triage_service()

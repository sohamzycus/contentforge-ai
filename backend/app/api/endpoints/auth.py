from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_auth_service, get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, Token, User as UserSchema
from app.services.interfaces.auth_service import IAuthService

router = APIRouter()


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserCreate,
    auth_service: IAuthService = Depends(get_auth_service),
):
    """Register a new user."""
    try:
        return auth_service.register(user_data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/login", response_model=Token)
def login(
    user_data: UserLogin,
    auth_service: IAuthService = Depends(get_auth_service),
):
    """Login and return an access token."""
    try:
        access_token, token_type = auth_service.login(user_data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"access_token": access_token, "token_type": token_type}


@router.get("/me", response_model=UserSchema)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user

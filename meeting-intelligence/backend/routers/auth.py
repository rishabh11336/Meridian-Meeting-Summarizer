"""
routers/auth.py
Registration, login, and current-user endpoints.

First user to register automatically becomes admin.
All subsequent users are assigned the 'member' role.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from auth.dependencies import get_current_user
from auth.tokens import create_access_token, hash_password, verify_password
from models.user_models import (
    AdminUserUpdate,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserPublic,
)
from storage.user_store import (
    count_users,
    create_user,
    get_user_by_email,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest) -> TokenResponse:
    """
    Register a new user account.

    The very first registered user is automatically promoted to admin.
    All subsequent users receive the 'member' role.
    """
    existing = await count_users()
    role = "admin" if existing == 0 else "member"

    try:
        user = await create_user(
            email=str(data.email),
            display_name=data.display_name,
            password_hash=hash_password(data.password),
            role=role,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token, user=UserPublic(**user.model_dump()))


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest) -> TokenResponse:
    """
    Authenticate with email + password and receive a JWT access token.
    """
    user = await get_user_by_email(str(data.email))
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token, user=UserPublic(**user.model_dump()))


@router.get("/me", response_model=UserPublic)
async def me(current_user=Depends(get_current_user)) -> UserPublic:
    """Return the authenticated user's profile."""
    return UserPublic(**current_user.model_dump())

"""
auth/dependencies.py
FastAPI dependency functions for authentication and authorization.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from auth.tokens import decode_access_token
from models.user_models import UserRecord
from storage.user_store import get_user_by_id

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserRecord:
    """
    Resolve the current user from the Bearer token.

    Raises:
        401: If the token is missing, invalid, expired, or user not found.
        403: If the user account is deactivated.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub", "")
        if not user_id:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    user = await get_user_by_id(user_id)
    if not user:
        raise credentials_exc
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Contact an administrator.",
        )
    return user


async def require_admin(current_user: UserRecord = Depends(get_current_user)) -> UserRecord:
    """
    Raise 403 if the current user is not an admin.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return current_user

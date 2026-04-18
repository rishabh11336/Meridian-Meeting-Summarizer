"""
user_models.py
Pydantic v2 models for user auth request/response shapes.
"""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, EmailStr, Field


class UserRecord(BaseModel):
    """Full user record stored on disk (includes password_hash)."""
    id: str
    email: str
    display_name: str
    password_hash: str
    role: Literal["admin", "member"]
    created_at: datetime
    is_active: bool = True


class UserPublic(BaseModel):
    """Safe user representation returned in API responses (no password_hash)."""
    id: str
    email: str
    display_name: str
    role: Literal["admin", "member"]
    created_at: datetime
    is_active: bool


class RegisterRequest(BaseModel):
    email: EmailStr
    display_name: Annotated[str, Field(min_length=1, max_length=60)]
    password: Annotated[str, Field(min_length=8, max_length=128)]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class AdminUserUpdate(BaseModel):
    role: Literal["admin", "member"] | None = None
    is_active: bool | None = None

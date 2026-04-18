"""
auth/tokens.py
JWT creation and verification.
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from config import JWT_ALGORITHM, JWT_EXPIRE_HOURS, JWT_SECRET

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {"sub": user_id, "role": role, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT token.

    Returns:
        Payload dict with 'sub' (user_id) and 'role'.

    Raises:
        JWTError: If token is invalid or expired.
    """
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

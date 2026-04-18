"""
user_store.py
Async user CRUD. One JSON file per user under USERS_DIR.

Layout:
  users/
    {user_id}.json   ← full UserRecord including password_hash
"""

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

import aiofiles

from config import USERS_DIR
from logger import get_logger
from models.user_models import UserRecord

log = get_logger(__name__)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _user_path(user_id: str) -> Path:
    return USERS_DIR / f"{user_id}.json"


async def _read_user_file(path: Path) -> dict[str, Any] | None:
    try:
        async with aiofiles.open(path, "r", encoding="utf-8") as f:
            return json.loads(await f.read())
    except (json.JSONDecodeError, OSError):
        return None


async def _write_user(record: UserRecord) -> None:
    async with aiofiles.open(_user_path(record.id), "w", encoding="utf-8") as f:
        await f.write(record.model_dump_json(indent=2))


# ── Public API ─────────────────────────────────────────────────────────────────

async def count_users() -> int:
    """Return number of registered users."""
    return sum(1 for f in USERS_DIR.glob("*.json"))


async def create_user(
    email: str,
    display_name: str,
    password_hash: str,
    role: str = "member",
) -> UserRecord:
    """
    Create a new user record on disk.

    Raises:
        ValueError: If email is already registered.
    """
    existing = await get_user_by_email(email)
    if existing:
        raise ValueError("An account with this email already exists.")

    record = UserRecord(
        id=str(uuid.uuid4()),
        email=email.lower().strip(),
        display_name=display_name.strip(),
        password_hash=password_hash,
        role=role,
        created_at=datetime.now(),
        is_active=True,
    )
    await _write_user(record)
    log.info("User created: %s (role=%s)", record.email, record.role)
    return record


async def get_user_by_id(user_id: str) -> UserRecord | None:
    """Return UserRecord by ID, or None if not found."""
    data = await _read_user_file(_user_path(user_id))
    if data is None:
        return None
    try:
        return UserRecord(**data)
    except ValueError:
        return None


async def get_user_by_email(email: str) -> UserRecord | None:
    """Scan all user files to find a matching email (case-insensitive)."""
    target = email.lower().strip()
    for path in USERS_DIR.glob("*.json"):
        data = await _read_user_file(path)
        if data and data.get("email", "").lower() == target:
            try:
                return UserRecord(**data)
            except ValueError:
                continue
    return None


async def get_all_users() -> list[UserRecord]:
    """Return all user records, sorted by created_at."""
    records: list[UserRecord] = []
    for path in USERS_DIR.glob("*.json"):
        data = await _read_user_file(path)
        if data:
            try:
                records.append(UserRecord(**data))
            except ValueError:
                continue
    records.sort(key=lambda u: u.created_at)
    return records


async def update_user(user_id: str, **fields: Any) -> UserRecord | None:
    """
    Update arbitrary fields on a user record.

    Args:
        user_id: Target user ID.
        **fields: Fields to update (role, is_active, display_name, etc.)

    Returns:
        Updated UserRecord, or None if user not found.
    """
    record = await get_user_by_id(user_id)
    if not record:
        return None
    updated = record.model_copy(update=fields)
    await _write_user(updated)
    return updated


async def delete_user(user_id: str) -> bool:
    """Delete a user file. Returns True if deleted, False if not found."""
    path = _user_path(user_id)
    if not path.exists():
        return False
    path.unlink()
    log.info("User deleted: %s", user_id)
    return True

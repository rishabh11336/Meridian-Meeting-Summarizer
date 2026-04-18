"""
routers/admin.py
Admin-only user management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from auth.dependencies import require_admin
from models.user_models import AdminUserUpdate, UserPublic, UserRecord
from storage.user_store import delete_user, get_all_users, get_user_by_id, update_user

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserPublic])
async def list_users(_: UserRecord = Depends(require_admin)) -> list[UserPublic]:
    """Return all registered users. Admin only."""
    users = await get_all_users()
    return [UserPublic(**u.model_dump()) for u in users]


@router.patch("/users/{user_id}", response_model=UserPublic)
async def update_user_endpoint(
    user_id: str,
    data: AdminUserUpdate,
    current_admin: UserRecord = Depends(require_admin),
) -> UserPublic:
    """Update a user's role or active status. Admin only."""
    if user_id == current_admin.id and data.role == "member":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot demote yourself from admin.",
        )

    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updated = await update_user(user_id, **updates)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return UserPublic(**updated.model_dump())


@router.delete("/users/{user_id}", response_model=dict)
async def delete_user_endpoint(
    user_id: str,
    current_admin: UserRecord = Depends(require_admin),
) -> dict[str, bool]:
    """Delete a user account. Admin only. Cannot delete yourself."""
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account.",
        )
    deleted = await delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return {"deleted": True}

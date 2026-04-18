"""
routers/projects.py
Project CRUD endpoints and storage info — all scoped to the authenticated user.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from auth.dependencies import get_current_user
from models.project_models import (
    ProjectCreate,
    ProjectListResponse,
    ProjectMeta,
    ProjectRename,
    StorageInfo,
)
from models.user_models import UserRecord
from storage.project_store import (
    create_project,
    delete_project,
    get_all_projects,
    get_project,
    get_storage_info,
    rename_project,
)

router = APIRouter(tags=["projects"])


@router.get("/projects", response_model=ProjectListResponse)
async def list_projects(
    current_user: UserRecord = Depends(get_current_user),
) -> ProjectListResponse:
    projects = await get_all_projects(current_user.id)
    return ProjectListResponse(projects=projects)


@router.post("/projects", response_model=ProjectMeta, status_code=status.HTTP_201_CREATED)
async def create_new_project(
    data: ProjectCreate,
    current_user: UserRecord = Depends(get_current_user),
) -> ProjectMeta:
    try:
        return await create_project(current_user.id, data.name, data.description)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.get("/projects/{slug}", response_model=ProjectMeta)
async def get_single_project(
    slug: str,
    current_user: UserRecord = Depends(get_current_user),
) -> ProjectMeta:
    try:
        return await get_project(current_user.id, slug)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.patch("/projects/{slug}", response_model=ProjectMeta)
async def rename_existing_project(
    slug: str,
    data: ProjectRename,
    current_user: UserRecord = Depends(get_current_user),
) -> ProjectMeta:
    try:
        return await rename_project(current_user.id, slug, data.new_name)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete("/projects/{slug}", response_model=dict)
async def delete_existing_project(
    slug: str,
    current_user: UserRecord = Depends(get_current_user),
) -> dict[str, bool]:
    try:
        await get_project(current_user.id, slug)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    await delete_project(current_user.id, slug)
    return {"deleted": True}


@router.get("/storage", response_model=StorageInfo)
async def storage_info(
    current_user: UserRecord = Depends(get_current_user),
) -> StorageInfo:
    return await get_storage_info(current_user.id)

"""
main.py
FastAPI application entry point.
"""

import shutil
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import BASE_DIR
from logger import get_logger, setup_logging
from routers import admin, auth, chat, meetings, projects

setup_logging()
log = get_logger(__name__)


async def _migrate_legacy_projects() -> None:
    """
    One-time migration: move old-style projects/{slug}/ data under the first admin user.

    Old layout: BASE_DIR/{slug}/project_meta.json
    New layout: BASE_DIR/{user_id}/{slug}/project_meta.json

    Detection: if BASE_DIR contains directories with a project_meta.json directly
    inside (not nested one level deeper), they are legacy projects.
    """
    legacy_dirs = [
        d for d in BASE_DIR.iterdir()
        if d.is_dir() and (d / "project_meta.json").exists()
    ]
    if not legacy_dirs:
        return

    # Import here to avoid circular imports at module level
    from storage.user_store import count_users, create_user, get_all_users
    from auth.tokens import hash_password

    # Ensure there is an admin user to receive the legacy data
    if await count_users() == 0:
        admin_user = await create_user(
            email="admin@meridian.local",
            display_name="Admin",
            password_hash=hash_password("changeme"),
            role="admin",
        )
        log.warning(
            "Created default admin account for legacy data migration. "
            "Email: admin@meridian.local  Password: changeme  "
            "Please change this immediately after first login."
        )
    else:
        users = await get_all_users()
        admin_user = next((u for u in users if u.role == "admin"), users[0])

    user_dir = BASE_DIR / admin_user.id
    user_dir.mkdir(parents=True, exist_ok=True)

    moved = 0
    for legacy_dir in legacy_dirs:
        dest = user_dir / legacy_dir.name
        if not dest.exists():
            await __import__("asyncio").to_thread(shutil.move, str(legacy_dir), str(dest))
            moved += 1

    if moved:
        log.info(
            "Migrated %d legacy project(s) to admin user %s (%s)",
            moved, admin_user.email, admin_user.id,
        )

    # Rebuild project_index.json for the admin user from the moved directories
    import json
    import aiofiles

    index_path = user_dir / "project_index.json"
    entries = []
    for proj_dir in user_dir.iterdir():
        if not proj_dir.is_dir():
            continue
        meta_path = proj_dir / "project_meta.json"
        if not meta_path.exists():
            continue
        try:
            async with aiofiles.open(meta_path, "r", encoding="utf-8") as f:
                meta = json.loads(await f.read())
            entries.append({
                "name": meta.get("name", proj_dir.name),
                "slug": meta.get("slug", proj_dir.name),
                "description": meta.get("description", ""),
                "created_at": meta.get("created_at", ""),
            })
        except (json.JSONDecodeError, OSError):
            continue

    async with aiofiles.open(index_path, "w", encoding="utf-8") as f:
        await f.write(json.dumps(entries, indent=2))

    log.info("project_index.json rebuilt for admin user with %d project(s)", len(entries))


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    log.info("Meeting Intelligence API starting up")
    await _migrate_legacy_projects()
    yield
    log.info("Meeting Intelligence API shutting down")


app = FastAPI(
    title="Meeting Intelligence API",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(meetings.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

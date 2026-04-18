"""
project_store.py
Async project CRUD: folder creation, index management, meta files.

All operations are scoped to a user_id — each user has their own isolated
project tree under BASE_DIR/{user_id}/.

Layout:
  BASE_DIR/
    {user_id}/
      project_index.json
      {slug}/
        project_meta.json
        meetings/
          {meeting_id}/
            ...
"""

import asyncio
import json
import re
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

import aiofiles

from config import BASE_DIR
from logger import get_logger
from models.project_models import ProjectMeta, StorageInfo

log = get_logger(__name__)


# ── Path helpers ───────────────────────────────────────────────────────────────

def _user_dir(user_id: str) -> Path:
    return BASE_DIR / user_id


def _index_path(user_id: str) -> Path:
    return _user_dir(user_id) / "project_index.json"


def _project_dir(user_id: str, slug: str) -> Path:
    return _user_dir(user_id) / slug


# ── Slug ───────────────────────────────────────────────────────────────────────

def slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "_", slug)
    return slug.strip("_") or "project"


# ── Index helpers ──────────────────────────────────────────────────────────────

async def _read_index(user_id: str) -> list[dict[str, Any]]:
    path = _index_path(user_id)
    if not path.exists():
        return []
    try:
        async with aiofiles.open(path, "r", encoding="utf-8") as f:
            return json.loads(await f.read())
    except (json.JSONDecodeError, OSError):
        return []


async def _write_index(user_id: str, projects: list[dict[str, Any]]) -> None:
    async with aiofiles.open(_index_path(user_id), "w", encoding="utf-8") as f:
        await f.write(json.dumps(projects, indent=2, ensure_ascii=False))


# ── Public API ─────────────────────────────────────────────────────────────────

async def get_all_projects(user_id: str) -> list[ProjectMeta]:
    """Return all projects belonging to user_id."""
    raw = await _read_index(user_id)
    result: list[ProjectMeta] = []
    for entry in raw:
        try:
            meta_path = _project_dir(user_id, entry["slug"]) / "project_meta.json"
            if meta_path.exists():
                async with aiofiles.open(meta_path, "r", encoding="utf-8") as f:
                    full = json.loads(await f.read())
                result.append(ProjectMeta(**full))
        except (KeyError, ValueError, OSError):
            continue
    return result


async def create_project(user_id: str, name: str, description: str) -> ProjectMeta:
    """
    Create a new project for user_id.

    Raises:
        ValueError: If a project with the same name already exists for this user.
    """
    udir = _user_dir(user_id)
    await asyncio.to_thread(udir.mkdir, parents=True, exist_ok=True)

    projects = await _read_index(user_id)
    if any(p["name"].lower() == name.lower() for p in projects):
        raise ValueError("A project with this name already exists. Choose a different name.")

    slug = slugify(name)
    existing_slugs = {p["slug"] for p in projects}
    base_slug, counter = slug, 1
    while slug in existing_slugs:
        slug = f"{base_slug}_{counter}"
        counter += 1

    now = datetime.now()
    meta = ProjectMeta(
        name=name,
        slug=slug,
        description=description,
        created_at=now,
        meeting_count=0,
    )

    proj_dir = _project_dir(user_id, slug)
    await asyncio.to_thread(lambda: (
        proj_dir.mkdir(parents=True, exist_ok=True),
        (proj_dir / "meetings").mkdir(exist_ok=True),
    ))

    async with aiofiles.open(proj_dir / "project_meta.json", "w", encoding="utf-8") as f:
        await f.write(meta.model_dump_json(indent=2))

    projects.append({
        "name": name,
        "slug": slug,
        "description": description,
        "created_at": now.isoformat(),
    })
    await _write_index(user_id, projects)

    log.info("Project created: '%s' (slug=%s) for user %s", name, slug, user_id)
    return meta


async def get_project(user_id: str, slug: str) -> ProjectMeta:
    """
    Return ProjectMeta for slug, scoped to user_id.

    Raises:
        FileNotFoundError: If not found.
    """
    meta_path = _project_dir(user_id, slug) / "project_meta.json"
    if not meta_path.exists():
        raise FileNotFoundError(f"Project '{slug}' not found.")
    async with aiofiles.open(meta_path, "r", encoding="utf-8") as f:
        data = json.loads(await f.read())
    return ProjectMeta(**data)


async def update_project_meeting_count(user_id: str, slug: str) -> None:
    meetings_dir = _project_dir(user_id, slug) / "meetings"
    count = 0
    if meetings_dir.exists():
        count = sum(1 for d in meetings_dir.iterdir() if d.is_dir())

    meta_path = _project_dir(user_id, slug) / "project_meta.json"
    if not meta_path.exists():
        return
    async with aiofiles.open(meta_path, "r", encoding="utf-8") as f:
        data = json.loads(await f.read())
    data["meeting_count"] = count
    async with aiofiles.open(meta_path, "w", encoding="utf-8") as f:
        await f.write(json.dumps(data, indent=2, ensure_ascii=False))


async def rename_project(user_id: str, slug: str, new_name: str) -> ProjectMeta:
    meta_path = _project_dir(user_id, slug) / "project_meta.json"
    if not meta_path.exists():
        raise FileNotFoundError(f"Project '{slug}' not found.")

    async with aiofiles.open(meta_path, "r", encoding="utf-8") as f:
        data = json.loads(await f.read())
    data["name"] = new_name
    async with aiofiles.open(meta_path, "w", encoding="utf-8") as f:
        await f.write(json.dumps(data, indent=2, ensure_ascii=False))

    projects = await _read_index(user_id)
    for p in projects:
        if p["slug"] == slug:
            p["name"] = new_name
            break
    await _write_index(user_id, projects)
    return ProjectMeta(**data)


async def delete_project(user_id: str, slug: str) -> None:
    proj_dir = _project_dir(user_id, slug)
    if proj_dir.exists():
        await asyncio.to_thread(shutil.rmtree, proj_dir)

    projects = await _read_index(user_id)
    await _write_index(user_id, [p for p in projects if p["slug"] != slug])
    log.info("Project deleted: slug=%s for user %s", slug, user_id)


async def get_storage_info(user_id: str) -> StorageInfo:
    """Return disk usage for the current user's project folder."""
    udir = _user_dir(user_id)

    def _compute() -> tuple[float, float]:
        if not udir.exists():
            return 0.0, shutil.disk_usage(BASE_DIR).free / (1024 ** 3)
        total_bytes = sum(f.stat().st_size for f in udir.rglob("*") if f.is_file())
        free = shutil.disk_usage(BASE_DIR).free
        return total_bytes / (1024 * 1024), free / (1024 ** 3)

    size_mb, free_gb = await asyncio.to_thread(_compute)

    projects = await _read_index(user_id)
    total_meetings = 0
    for p in projects:
        meta_path = _project_dir(user_id, p.get("slug", "")) / "project_meta.json"
        if meta_path.exists():
            try:
                async with aiofiles.open(meta_path, "r", encoding="utf-8") as f:
                    meta = json.loads(await f.read())
                total_meetings += meta.get("meeting_count", 0)
            except (json.JSONDecodeError, OSError):
                pass

    return StorageInfo(
        projects_size_mb=round(size_mb, 2),
        total_projects=len(projects),
        total_meetings=total_meetings,
        free_disk_gb=round(free_gb, 2),
    )

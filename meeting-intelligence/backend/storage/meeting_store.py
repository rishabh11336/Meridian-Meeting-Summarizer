"""
meeting_store.py
Async meeting CRUD and project context builder.

All operations are scoped to (user_id, project_slug).

Layout:
  BASE_DIR/{user_id}/{project_slug}/meetings/{meeting_id}/
    meta.json
    transcript_raw.txt
    transcript_corrected.txt   (optional)
    summary.txt                (added after summarization)
"""

import asyncio
import json
import shutil
from datetime import datetime
from pathlib import Path

import aiofiles

from config import BASE_DIR
from logger import get_logger
from models.meeting_models import MeetingDetail, MeetingMeta
from storage.project_store import update_project_meeting_count

log = get_logger(__name__)


# ── Path helpers ───────────────────────────────────────────────────────────────

def _meetings_dir(user_id: str, project_slug: str) -> Path:
    return BASE_DIR / user_id / project_slug / "meetings"


def _meeting_dir(user_id: str, project_slug: str, meeting_id: str) -> Path:
    return _meetings_dir(user_id, project_slug) / meeting_id


# ── ID generation ──────────────────────────────────────────────────────────────

def _generate_meeting_id() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


# ── Write ──────────────────────────────────────────────────────────────────────

async def create_meeting_record(
    user_id: str,
    project_slug: str,
    filename: str,
    duration: float,
    transcript_raw: str,
) -> str:
    meeting_id = _generate_meeting_id()
    mdir = _meeting_dir(user_id, project_slug, meeting_id)
    await asyncio.to_thread(mdir.mkdir, parents=True, exist_ok=True)

    meta = {
        "meeting_id": meeting_id,
        "project_slug": project_slug,
        "original_filename": filename,
        "duration_seconds": duration,
        "uploaded_at": datetime.now().isoformat(),
        "has_correction": False,
        "has_summary": False,
    }

    async with aiofiles.open(mdir / "meta.json", "w", encoding="utf-8") as f:
        await f.write(json.dumps(meta, indent=2, ensure_ascii=False))

    async with aiofiles.open(mdir / "transcript_raw.txt", "w", encoding="utf-8") as f:
        await f.write(transcript_raw)

    await update_project_meeting_count(user_id, project_slug)
    log.info("Meeting record created: %s in project '%s' (user=%s, %.1fs)",
             meeting_id, project_slug, user_id, duration)
    return meeting_id


async def add_meeting_summary(
    user_id: str,
    project_slug: str,
    meeting_id: str,
    summary: str,
) -> None:
    mdir = _meeting_dir(user_id, project_slug, meeting_id)

    async with aiofiles.open(mdir / "summary.txt", "w", encoding="utf-8") as f:
        await f.write(summary)

    meta_path = mdir / "meta.json"
    async with aiofiles.open(meta_path, "r", encoding="utf-8") as f:
        meta = json.loads(await f.read())
    meta["has_summary"] = True
    async with aiofiles.open(meta_path, "w", encoding="utf-8") as f:
        await f.write(json.dumps(meta, indent=2, ensure_ascii=False))
    log.info("Summary saved: meeting=%s project=%s user=%s", meeting_id, project_slug, user_id)


async def save_correction(
    user_id: str,
    project_slug: str,
    meeting_id: str,
    corrected_text: str,
) -> MeetingMeta:
    mdir = _meeting_dir(user_id, project_slug, meeting_id)

    async with aiofiles.open(mdir / "transcript_corrected.txt", "w", encoding="utf-8") as f:
        await f.write(corrected_text)

    meta_path = mdir / "meta.json"
    async with aiofiles.open(meta_path, "r", encoding="utf-8") as f:
        meta = json.loads(await f.read())
    meta["has_correction"] = True
    async with aiofiles.open(meta_path, "w", encoding="utf-8") as f:
        await f.write(json.dumps(meta, indent=2, ensure_ascii=False))

    log.info("Correction saved: meeting=%s project=%s user=%s", meeting_id, project_slug, user_id)
    return MeetingMeta(**meta)


# ── Read ───────────────────────────────────────────────────────────────────────

async def get_all_meetings(user_id: str, project_slug: str) -> list[MeetingMeta]:
    mdir = _meetings_dir(user_id, project_slug)
    if not mdir.exists():
        return []

    results: list[MeetingMeta] = []
    for meeting_dir in mdir.iterdir():
        if not meeting_dir.is_dir():
            continue
        meta_path = meeting_dir / "meta.json"
        if not meta_path.exists():
            continue
        try:
            async with aiofiles.open(meta_path, "r", encoding="utf-8") as f:
                data = json.loads(await f.read())
            results.append(MeetingMeta(**data))
        except (json.JSONDecodeError, ValueError, OSError):
            continue

    results.sort(key=lambda m: m.uploaded_at, reverse=True)
    return results


async def get_meeting_detail(user_id: str, project_slug: str, meeting_id: str) -> MeetingDetail:
    mdir = _meeting_dir(user_id, project_slug, meeting_id)
    if not mdir.exists():
        raise FileNotFoundError(f"Meeting '{meeting_id}' not found.")

    async with aiofiles.open(mdir / "meta.json", "r", encoding="utf-8") as f:
        meta_data = json.loads(await f.read())

    async with aiofiles.open(mdir / "transcript_raw.txt", "r", encoding="utf-8") as f:
        transcript_raw = await f.read()

    transcript_corrected: str | None = None
    corrected_path = mdir / "transcript_corrected.txt"
    if corrected_path.exists():
        async with aiofiles.open(corrected_path, "r", encoding="utf-8") as f:
            transcript_corrected = await f.read()

    summary = ""
    summary_path = mdir / "summary.txt"
    if summary_path.exists():
        async with aiofiles.open(summary_path, "r", encoding="utf-8") as f:
            summary = await f.read()

    return MeetingDetail(
        meeting_id=meta_data["meeting_id"],
        original_filename=meta_data["original_filename"],
        uploaded_at=meta_data["uploaded_at"],
        duration_seconds=meta_data["duration_seconds"],
        has_summary=meta_data.get("has_summary", False),
        has_correction=meta_data.get("has_correction", False),
        summary=summary,
        transcript_raw=transcript_raw,
        transcript_corrected=transcript_corrected,
    )



# ── Delete ─────────────────────────────────────────────────────────────────────

async def delete_meeting(user_id: str, project_slug: str, meeting_id: str) -> None:
    mdir = _meeting_dir(user_id, project_slug, meeting_id)
    if mdir.exists():
        await asyncio.to_thread(shutil.rmtree, mdir)
    await update_project_meeting_count(user_id, project_slug)
    log.info("Meeting deleted: %s from project '%s' (user=%s)", meeting_id, project_slug, user_id)


# ── Prior context for context-aware summarization ─────────────────────────────

async def get_prior_summaries(user_id: str, project_slug: str, current_meeting_id: str) -> str:
    """
    Return formatted summaries of all meetings uploaded before current_meeting_id.
    Returns empty string if no prior summarized meetings exist.
    """
    mdir = _meetings_dir(user_id, project_slug)
    if not mdir.exists():
        return ""

    entries: list[tuple[dict, Path]] = []
    for meeting_dir in mdir.iterdir():
        if not meeting_dir.is_dir():
            continue
        meta_path = meeting_dir / "meta.json"
        if not meta_path.exists():
            continue
        try:
            async with aiofiles.open(meta_path, "r", encoding="utf-8") as f:
                meta = json.loads(await f.read())
        except (json.JSONDecodeError, OSError):
            continue

        if meta.get("meeting_id") == current_meeting_id:
            continue
        if not meta.get("has_summary", False):
            continue

        entries.append((meta, meeting_dir))

    if not entries:
        return ""

    entries.sort(key=lambda x: x[0].get("uploaded_at", ""))

    parts: list[str] = []
    for meta, meeting_dir in entries:
        filename = meta.get("original_filename", "Unknown")
        uploaded_at = meta.get("uploaded_at", "Unknown")

        summary_path = meeting_dir / "summary.txt"
        if not summary_path.exists():
            continue
        try:
            async with aiofiles.open(summary_path, "r", encoding="utf-8") as f:
                summary = await f.read()
        except OSError:
            continue

        parts.append(
            f"=== Previous Meeting: {filename} | Date: {uploaded_at} ===\n"
            f"{summary}\n"
            f"=== End ==="
        )

    return "\n\n".join(parts)


# ── Context builder (chat) ─────────────────────────────────────────────────────

async def build_project_context(user_id: str, project_slug: str) -> str:
    """
    Build a compact context string from all meeting summaries for chat.
    Uses summaries only — not full transcripts — to minimise token cost.
    """
    mdir = _meetings_dir(user_id, project_slug)
    if not mdir.exists():
        return ""

    entries: list[tuple[dict, Path]] = []
    for meeting_dir in mdir.iterdir():
        if not meeting_dir.is_dir():
            continue
        meta_path = meeting_dir / "meta.json"
        if not meta_path.exists():
            continue
        try:
            async with aiofiles.open(meta_path, "r", encoding="utf-8") as f:
                meta = json.loads(await f.read())
            entries.append((meta, meeting_dir))
        except (json.JSONDecodeError, OSError):
            continue

    entries.sort(key=lambda x: x[0].get("uploaded_at", ""))

    parts: list[str] = []
    for meta, meeting_dir in entries:
        filename = meta.get("original_filename", "Unknown")
        uploaded_at = meta.get("uploaded_at", "Unknown")

        summary = "[Summary not yet generated]"
        summary_path = meeting_dir / "summary.txt"
        if summary_path.exists():
            try:
                async with aiofiles.open(summary_path, "r", encoding="utf-8") as f:
                    summary = await f.read()
            except OSError:
                pass

        parts.append(
            f"=== Meeting: {filename} | Date: {uploaded_at} ===\n"
            f"{summary}\n"
            f"=== End ==="
        )

    return "\n\n".join(parts)

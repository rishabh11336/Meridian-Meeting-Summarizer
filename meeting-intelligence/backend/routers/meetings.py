"""
routers/meetings.py
Meeting upload, processing, correction, and CRUD — scoped to authenticated user.
"""

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from auth.dependencies import get_current_user
from config import AUDIO_FORMATS, MAX_UPLOAD_BYTES, SUPPORTED_FORMATS, TEMP_DIR
from models.meeting_models import (
    CorrectionRequest,
    MeetingDetail,
    MeetingListResponse,
    MeetingMeta,
    SummarizeRequest,
    SummarizeResponse,
    TranscriptionResult,
)
from models.user_models import UserRecord
from services.audio_service import cleanup_temp_dir, extract_audio, get_duration
from services.summarization_service import summarize
from services.transcription_service import transcribe
from storage.meeting_store import (
    add_meeting_summary,
    build_project_context,
    create_meeting_record,
    delete_meeting,
    get_all_meetings,
    get_meeting_detail,
    get_prior_summaries,
    save_correction,
)
from storage.project_store import get_project

router = APIRouter(tags=["meetings"])


@router.get("/projects/{slug}/meetings", response_model=MeetingListResponse)
async def list_meetings(
    slug: str,
    current_user: UserRecord = Depends(get_current_user),
) -> MeetingListResponse:
    try:
        await get_project(current_user.id, slug)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    meetings = await get_all_meetings(current_user.id, slug)
    return MeetingListResponse(meetings=meetings)


@router.get("/projects/{slug}/meetings/{meeting_id}", response_model=MeetingDetail)
async def get_meeting(
    slug: str,
    meeting_id: str,
    current_user: UserRecord = Depends(get_current_user),
) -> MeetingDetail:
    try:
        return await get_meeting_detail(current_user.id, slug, meeting_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post(
    "/projects/{slug}/meetings/upload",
    response_model=TranscriptionResult,
    status_code=status.HTTP_201_CREATED,
)
async def upload_meeting(
    slug: str,
    video: UploadFile = File(...),
    current_user: UserRecord = Depends(get_current_user),
) -> TranscriptionResult:
    try:
        await get_project(current_user.id, slug)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    if video.filename is None:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                            detail="No filename provided.")
    ext = video.filename.rsplit(".", 1)[-1].lower() if "." in video.filename else ""
    if ext not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported format '.{ext}'. Supported: {', '.join(SUPPORTED_FORMATS)}.",
        )

    video_path = str(TEMP_DIR / f"upload.{ext}")
    total_bytes = 0

    try:
        async with aiofiles.open(video_path, "wb") as tmp:
            while True:
                chunk = await video.read(1024 * 1024)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File exceeds the 500 MB limit.",
                    )
                await tmp.write(chunk)

        # If the client already extracted audio (e.g. via FFmpeg.wasm), skip
        # the server-side extraction step — the file is ready to chunk directly.
        if ext in AUDIO_FORMATS:
            audio_path = video_path
        else:
            audio_path = await extract_audio(video_path)
        duration = await get_duration(audio_path)

        try:
            transcript = await transcribe(audio_path)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
        except Exception as exc:
            msg = str(exc).lower()
            if "rate limit" in msg or "429" in msg:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Groq rate limit reached. Please wait 60 seconds and try again.",
                )
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY,
                                detail=f"Transcription failed: {exc}")

        if not transcript or not transcript.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Transcription returned empty. The audio may be silent or corrupted.",
            )

        meeting_id = await create_meeting_record(
            user_id=current_user.id,
            project_slug=slug,
            filename=video.filename,
            duration=duration,
            transcript_raw=transcript,
        )
        return TranscriptionResult(meeting_id=meeting_id, transcript=transcript,
                                   duration_seconds=duration)
    finally:
        await cleanup_temp_dir()


@router.post("/projects/{slug}/meetings/{meeting_id}/summarize",
             response_model=SummarizeResponse)
async def summarize_meeting(
    slug: str,
    meeting_id: str,
    data: SummarizeRequest,
    current_user: UserRecord = Depends(get_current_user),
) -> SummarizeResponse:
    try:
        await get_meeting_detail(current_user.id, slug, meeting_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    if data.use_correction:
        await save_correction(current_user.id, slug, meeting_id, data.transcript)

    prior_summaries = await get_prior_summaries(current_user.id, slug, meeting_id)

    try:
        summary = await summarize(data.transcript, prior_summaries)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
    except Exception as exc:
        msg = str(exc).lower()
        if "rate limit" in msg or "429" in msg:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY,
                                detail="Gemini rate limit reached. Please wait and try again.")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY,
                            detail=f"Summarization failed: {exc}")

    await add_meeting_summary(current_user.id, slug, meeting_id, summary)
    return SummarizeResponse(meeting_id=meeting_id, summary=summary)


@router.patch("/projects/{slug}/meetings/{meeting_id}/correction", response_model=MeetingMeta)
async def save_transcript_correction(
    slug: str,
    meeting_id: str,
    data: CorrectionRequest,
    current_user: UserRecord = Depends(get_current_user),
) -> MeetingMeta:
    try:
        return await save_correction(current_user.id, slug, meeting_id, data.corrected_text)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete("/projects/{slug}/meetings/{meeting_id}", response_model=dict)
async def delete_meeting_endpoint(
    slug: str,
    meeting_id: str,
    current_user: UserRecord = Depends(get_current_user),
) -> dict[str, bool]:
    try:
        await get_meeting_detail(current_user.id, slug, meeting_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    await delete_meeting(current_user.id, slug, meeting_id)
    return {"deleted": True}

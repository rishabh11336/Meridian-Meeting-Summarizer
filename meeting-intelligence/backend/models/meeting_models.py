"""
meeting_models.py
Pydantic v2 models for meeting request/response shapes.
"""

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field


class MeetingMeta(BaseModel):
    meeting_id: str
    original_filename: str
    uploaded_at: datetime
    duration_seconds: float
    has_summary: bool = False
    has_correction: bool = False


class MeetingDetail(BaseModel):
    meeting_id: str
    original_filename: str
    uploaded_at: datetime
    duration_seconds: float
    has_summary: bool = False
    has_correction: bool = False
    summary: str
    transcript_raw: str
    transcript_corrected: str | None


class MeetingListResponse(BaseModel):
    meetings: list[MeetingMeta]


class TranscriptionResult(BaseModel):
    meeting_id: str
    transcript: str
    duration_seconds: float


class SummarizeRequest(BaseModel):
    transcript: str
    use_correction: bool = False


class SummarizeResponse(BaseModel):
    meeting_id: str
    summary: str


class CorrectionRequest(BaseModel):
    corrected_text: Annotated[str, Field(min_length=1)]

"""
transcription_service.py
Async Groq Whisper transcription with retry and auto-chunking.
"""

import asyncio
import os
import time

import groq as groq_lib
from groq import Groq

from config import CHUNK_MINUTES, GROQ_API_KEY, GROQ_WHISPER_MODEL
from logger import get_logger
from services.audio_service import chunk_audio, cleanup_files, get_duration

log = get_logger(__name__)

_MAX_RETRIES: int = 3
_RETRY_WAIT_SECONDS: int = 5


def _transcribe_single_sync(client: Groq, audio_path: str) -> str:
    """
    Transcribe a single WAV file with exponential-backoff retry (sync).

    Raises:
        groq_lib.AuthenticationError: On invalid API key.
        groq_lib.RateLimitError: After all retries exhausted.
        RuntimeError: On other unrecoverable errors.
    """
    last_error: Exception = RuntimeError("Unknown transcription error.")
    ext = os.path.splitext(audio_path)[1].lower()
    mime = "audio/wav" if ext == ".wav" else "audio/mpeg"

    for attempt in range(_MAX_RETRIES):
        try:
            with open(audio_path, "rb") as audio_file:
                result = client.audio.transcriptions.create(
                    file=(os.path.basename(audio_path), audio_file, mime),
                    model=GROQ_WHISPER_MODEL,
                    response_format="text",
                )
            return str(result)

        except groq_lib.AuthenticationError:
            raise

        except groq_lib.RateLimitError as exc:
            last_error = exc
            if attempt < _MAX_RETRIES - 1:
                wait = _RETRY_WAIT_SECONDS * (attempt + 1)
                log.warning("Groq rate limit hit (attempt %d/%d) — retrying in %ds",
                            attempt + 1, _MAX_RETRIES, wait)
                time.sleep(wait)

        except Exception as exc:
            last_error = exc
            if attempt < _MAX_RETRIES - 1:
                log.warning("Transcription attempt %d/%d failed: %s — retrying",
                            attempt + 1, _MAX_RETRIES, exc)
                time.sleep(_RETRY_WAIT_SECONDS)

    raise last_error


async def transcribe(audio_path: str) -> str:
    """
    Transcribe an audio file using Groq Whisper Large V3.

    Automatically chunks audio files longer than CHUNK_MINUTES to stay
    within Groq's 25 MB per-request limit.

    Raises:
        ValueError: If GROQ_API_KEY is not configured.
    """
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not found. Add it to your .env file.")

    client = Groq(api_key=GROQ_API_KEY)
    duration = await get_duration(audio_path)
    log.info("Starting transcription: %.1f min audio at %s", duration / 60, audio_path)

    if duration <= CHUNK_MINUTES * 60:
        transcript = await asyncio.to_thread(_transcribe_single_sync, client, audio_path)
        log.info("Transcription complete: %d chars", len(transcript))
        return transcript

    chunk_paths: list[str] = []
    try:
        chunk_paths = await chunk_audio(audio_path, CHUNK_MINUTES)
        log.info("Audio split into %d chunks for transcription", len(chunk_paths))
        parts: list[str] = []
        for i, chunk in enumerate(chunk_paths, 1):
            log.info("Transcribing chunk %d/%d", i, len(chunk_paths))
            part = await asyncio.to_thread(_transcribe_single_sync, client, chunk)
            parts.append(part)
        transcript = "\n".join(parts)
        log.info("Chunked transcription complete: %d chars total", len(transcript))
        return transcript
    finally:
        await cleanup_files(chunk_paths)

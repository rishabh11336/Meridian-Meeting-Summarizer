"""
audio_service.py
Async wrappers for audio extraction and chunking.

Blocking operations (moviepy, pydub) are offloaded to a thread pool
via asyncio.to_thread so they do not block the FastAPI event loop.
"""

import asyncio
import shutil
import warnings
from pathlib import Path

import imageio_ffmpeg as _imageio_ffmpeg

# Configure pydub's ffmpeg path before importing it.
_FFMPEG_PATH: str = _imageio_ffmpeg.get_ffmpeg_exe()

warnings.filterwarnings(
    "ignore",
    message="Couldn't find ffmpeg or avconv",
    category=RuntimeWarning,
)

import pydub
from pydub import AudioSegment

pydub.AudioSegment.converter = _FFMPEG_PATH
pydub.AudioSegment.ffmpeg = _FFMPEG_PATH

from moviepy.editor import VideoFileClip

from config import AUDIO_SAMPLE_RATE, CHUNK_MINUTES, TEMP_DIR
from logger import get_logger

log = get_logger(__name__)


# ── Extraction ─────────────────────────────────────────────────────────────────

def _extract_audio_sync(video_path: str, output_path: str) -> None:
    """
    Synchronous audio extraction (runs in thread pool).

    Raises:
        ValueError: If the video has no audio track.
    """
    clip = VideoFileClip(video_path)
    try:
        if clip.audio is None:
            raise ValueError(
                "The video file has no audio track. "
                "Try re-saving the video in MP4 format."
            )
        clip.audio.write_audiofile(
            output_path,
            fps=AUDIO_SAMPLE_RATE,
            nbytes=2,
            buffersize=2000,
            codec="pcm_s16le",
            ffmpeg_params=["-ac", "1"],
            verbose=False,
            logger=None,
        )
    finally:
        clip.close()


async def extract_audio(video_path: str) -> str:
    """
    Extract audio from a video file and save as mono 16 kHz WAV.

    Returns:
        Absolute path to the extracted WAV file in TEMP_DIR.
    """
    output_path = str(TEMP_DIR / "extracted_audio.wav")
    log.info("Extracting audio from %s", video_path)
    await asyncio.to_thread(_extract_audio_sync, video_path, output_path)
    log.info("Audio extracted to %s", output_path)
    return output_path


# ── Duration ───────────────────────────────────────────────────────────────────

def _get_duration_sync(audio_path: str) -> float:
    """Return duration in seconds (sync, runs in thread pool)."""
    audio = AudioSegment.from_file(audio_path)
    return len(audio) / 1000.0


async def get_duration(audio_path: str) -> float:
    """Return audio file duration in seconds."""
    return await asyncio.to_thread(_get_duration_sync, audio_path)


# ── Chunking ───────────────────────────────────────────────────────────────────

def _chunk_audio_sync(audio_path: str, chunk_minutes: int) -> list[str]:
    """Split audio into fixed-duration chunks (sync, runs in thread pool)."""
    chunk_ms = chunk_minutes * 60 * 1000
    audio = AudioSegment.from_file(audio_path)
    chunks: list[str] = []

    for i, start_ms in enumerate(range(0, len(audio), chunk_ms)):
        chunk = audio[start_ms : start_ms + chunk_ms]
        chunk_path = str(TEMP_DIR / f"chunk_{i:03d}.wav")
        chunk.export(chunk_path, format="wav")
        chunks.append(chunk_path)

    return chunks


async def chunk_audio(
    audio_path: str, chunk_minutes: int = CHUNK_MINUTES
) -> list[str]:
    """
    Split a WAV file into fixed-length chunks saved to TEMP_DIR.

    Returns:
        Ordered list of absolute paths to chunk WAV files.
    """
    chunks = await asyncio.to_thread(_chunk_audio_sync, audio_path, chunk_minutes)
    log.info("Audio chunked into %d x %d-min segments", len(chunks), chunk_minutes)
    return chunks


# ── Cleanup ────────────────────────────────────────────────────────────────────

async def cleanup_files(paths: list[str]) -> None:
    """Delete a list of temp files, ignoring missing files."""

    def _rm() -> None:
        for path in paths:
            try:
                p = Path(path)
                if p.exists():
                    p.unlink()
            except OSError:
                pass

    await asyncio.to_thread(_rm)


async def cleanup_temp_dir() -> None:
    """Delete all files and subdirectories inside TEMP_DIR."""

    def _rm() -> None:
        for item in TEMP_DIR.iterdir():
            try:
                if item.is_file():
                    item.unlink()
                elif item.is_dir():
                    shutil.rmtree(item)
            except OSError:
                pass

    log.debug("Cleaning up TEMP_DIR")
    await asyncio.to_thread(_rm)

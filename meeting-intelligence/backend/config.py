"""
config.py
All application settings, paths, and constants.
All other modules import from here — no hardcoded values anywhere else.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR: Path = Path(__file__).parent / "projects"
TEMP_DIR: Path = Path(__file__).parent / "temp"
USERS_DIR: Path = Path(__file__).parent / "users"

# ── Upload constraints ─────────────────────────────────────────────────────────
MAX_UPLOAD_BYTES: int = 500 * 1024 * 1024       # 500 MB
SUPPORTED_FORMATS: list[str] = ["mp4", "mov", "mkv", "webm", "avi", "m4v", "wmv", "mp3", "wav"]
# Formats that are already audio — skip the video→audio extraction step.
AUDIO_FORMATS: set[str] = {"mp3", "wav", "m4a", "ogg", "flac"}

# ── Audio processing ───────────────────────────────────────────────────────────
# 12 min chunks: 16 kHz mono 16-bit WAV ≈ 23 MB — comfortably under Groq's 25 MB limit.
# Fewer chunks = fewer API round-trips for long meetings.
CHUNK_MINUTES: int = 12
AUDIO_SAMPLE_RATE: int = 16000

# ── Groq ───────────────────────────────────────────────────────────────────────
# whisper-large-v3-turbo: $0.04/hr vs $0.111/hr for large-v3 (2.8× cheaper).
# Quality difference is negligible for conference-call / meeting audio.
# Switch back to "whisper-large-v3" only if accent or technical vocab accuracy degrades.
GROQ_WHISPER_MODEL: str = "whisper-large-v3-turbo"

# ── Gemini ─────────────────────────────────────────────────────────────────────
GEMINI_MODEL: str = "gemini-2.5-flash"
# Summarization: a detailed 30-min meeting fills all 7 sections at ~3-4K tokens.
# 8192 gives full headroom for even long meetings without truncating any section.
GEMINI_MAX_TOKENS: int = 8192
GEMINI_TEMPERATURE: float = 0.3
# Chat: conversational answers rarely exceed 500 tokens.
# Output is priced 4× higher than input — keeping this tight matters.
GEMINI_CHAT_MAX_TOKENS: int = 800

# ── UX thresholds ─────────────────────────────────────────────────────────────
CROSS_MEETING_SOFT_WARN: int = 50

# ── API keys (loaded from .env) ────────────────────────────────────────────────
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

# ── Auth ───────────────────────────────────────────────────────────────────────
# Generate a strong secret: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET: str = os.getenv("JWT_SECRET", "CHANGE_ME_use_a_long_random_secret_in_production")
JWT_ALGORITHM: str = "HS256"
JWT_EXPIRE_HOURS: int = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

# ── Ensure runtime directories exist ──────────────────────────────────────────
BASE_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR.mkdir(parents=True, exist_ok=True)
USERS_DIR.mkdir(parents=True, exist_ok=True)

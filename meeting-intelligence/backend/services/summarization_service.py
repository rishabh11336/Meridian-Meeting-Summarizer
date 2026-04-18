"""
summarization_service.py
Async Gemini 2.5 Flash meeting summarization.

Two modes:
- Standalone (no prior context): uses SUMMARIZER_SYSTEM_PROMPT
- Context-aware (prior summaries available): uses CONTEXT_AWARE_SUMMARIZER_PROMPT,
  which instructs the model to surface what changed since the last meeting.
"""

import asyncio

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from config import GEMINI_API_KEY, GEMINI_MAX_TOKENS, GEMINI_MODEL, GEMINI_TEMPERATURE
from logger import get_logger
from prompts import CONTEXT_AWARE_SUMMARIZER_PROMPT, SUMMARIZER_SYSTEM_PROMPT

log = get_logger(__name__)

# Configure once at import time — not on every request.
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

_standalone_model = genai.GenerativeModel(
    model_name=GEMINI_MODEL,
    system_instruction=SUMMARIZER_SYSTEM_PROMPT,
    generation_config=GenerationConfig(
        temperature=GEMINI_TEMPERATURE,
        max_output_tokens=GEMINI_MAX_TOKENS,
    ),
)

_context_aware_model = genai.GenerativeModel(
    model_name=GEMINI_MODEL,
    system_instruction=CONTEXT_AWARE_SUMMARIZER_PROMPT,
    generation_config=GenerationConfig(
        temperature=GEMINI_TEMPERATURE,
        max_output_tokens=GEMINI_MAX_TOKENS,
    ),
)


def _summarize_sync(transcript: str, prior_summaries: str) -> str:
    """Synchronous Gemini summarization (runs in thread pool)."""
    if prior_summaries:
        prompt = (
            f"PREVIOUS MEETINGS IN THIS PROJECT:\n\n"
            f"{prior_summaries}\n\n"
            f"---\n\n"
            f"NEW MEETING TRANSCRIPT TO SUMMARIZE:\n\n"
            f"{transcript}"
        )
        response = _context_aware_model.generate_content(prompt)
    else:
        response = _standalone_model.generate_content(
            f"Here is the meeting transcript:\n\n{transcript}"
        )
    return response.text


async def summarize(transcript: str, prior_summaries: str = "") -> str:
    """
    Summarize a meeting transcript using Gemini 2.5 Flash.

    When prior_summaries is provided (non-empty), switches to context-aware mode:
    the model compares the new meeting against prior ones and surfaces what changed.

    Args:
        transcript: Raw or user-corrected meeting transcript.
        prior_summaries: Formatted summaries of earlier meetings in the project.
                         Empty string = first meeting, use standalone mode.

    Raises:
        ValueError: If GEMINI_API_KEY is not configured.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not found. Add it to your .env file.")

    mode = "context-aware" if prior_summaries else "standalone"
    log.info(
        "Starting summarization [%s]: %d chars transcript, %d chars prior context",
        mode,
        len(transcript),
        len(prior_summaries),
    )
    summary = await asyncio.to_thread(_summarize_sync, transcript, prior_summaries)
    log.info("Summarization complete [%s]: %d chars summary", mode, len(summary))
    return summary

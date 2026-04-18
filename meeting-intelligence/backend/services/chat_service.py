"""
chat_service.py
Async Gemini 2.5 Flash project-level Q&A chat.
"""

import asyncio
from typing import Any

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from config import GEMINI_API_KEY, GEMINI_CHAT_MAX_TOKENS, GEMINI_MODEL
from logger import get_logger
from models.chat_models import ChatMessage
from prompts import PROJECT_CHAT_PROMPT

log = get_logger(__name__)

# Configure once at import time — not on every request.
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def _answer_sync(
    question: str,
    project_context: str,
    history: list[dict[str, Any]],
) -> str:
    """Synchronous Gemini multi-turn chat (runs in thread pool)."""
    system_instruction = PROJECT_CHAT_PROMPT + f"\n\nPROJECT MEETINGS:\n{project_context}"

    # Model is instantiated per-call because the system instruction changes with
    # project context. The API key and genai configuration are already set at
    # module load time.
    model = genai.GenerativeModel(
        model_name=GEMINI_MODEL,
        system_instruction=system_instruction,
        generation_config=GenerationConfig(
            temperature=0.2,
            max_output_tokens=GEMINI_CHAT_MAX_TOKENS,
        ),
    )

    session = model.start_chat(history=history)
    response = session.send_message(question)
    return response.text


async def answer_question(
    question: str,
    project_context: str,
    history: list[ChatMessage],
) -> str:
    """
    Answer a question about a project using meeting summaries as context.

    Context is summaries-only (not full transcripts) to keep input token count
    proportional to the number of meetings, not their raw length.

    Raises:
        ValueError: If GEMINI_API_KEY is not configured.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not found. Add it to your .env file.")

    log.info(
        "Chat question received (%d chars), history turns: %d",
        len(question),
        len(history),
    )

    gemini_history = [
        {"role": msg.role, "parts": [msg.content]} for msg in history
    ]

    answer = await asyncio.to_thread(
        _answer_sync, question, project_context, gemini_history
    )
    log.info("Chat answer generated: %d chars", len(answer))
    return answer

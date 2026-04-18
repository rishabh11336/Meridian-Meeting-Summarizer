"""
chat_models.py
Pydantic v2 models for chat request/response shapes.
"""

from typing import Annotated, Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "model"]
    content: str


class ChatRequest(BaseModel):
    question: Annotated[str, Field(min_length=1)]
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    answer: str

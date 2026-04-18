"""
routers/chat.py
Project-level chat endpoint — scoped to authenticated user.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from auth.dependencies import get_current_user
from models.chat_models import ChatRequest, ChatResponse
from models.user_models import UserRecord
from services.chat_service import answer_question
from storage.meeting_store import build_project_context
from storage.project_store import get_project

router = APIRouter(tags=["chat"])


@router.post("/projects/{slug}/chat", response_model=ChatResponse)
async def chat(
    slug: str,
    data: ChatRequest,
    current_user: UserRecord = Depends(get_current_user),
) -> ChatResponse:
    try:
        await get_project(current_user.id, slug)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    project_context = await build_project_context(current_user.id, slug)

    try:
        answer = await answer_question(
            question=data.question,
            project_context=project_context,
            history=data.history,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
    except Exception as exc:
        msg = str(exc).lower()
        if "rate limit" in msg or "429" in msg:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Gemini rate limit reached. Please wait a moment and try again.",
            )
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY,
                            detail=f"Chat failed: {exc}")

    return ChatResponse(answer=answer)

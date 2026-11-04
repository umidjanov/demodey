from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.services.ai_service import ai_service
from app.schemas.ai_schemas import (
    AIChatRequest,
    AIChatResponse,
    AIEvaluateWrittenRequest,
    AIEvaluateWrittenResponse,
)

router = APIRouter(prefix="/ai", tags=["AI Engine"])


@router.post("/chat", response_model=AIChatResponse)
async def ai_chat_assistant(
    req: AIChatRequest,
    current_user: dict = Depends(get_current_user)
):
    return await ai_service.chat_assistant(req)


@router.post("/evaluate-written", response_model=AIEvaluateWrittenResponse)
async def evaluate_written_answer(req: AIEvaluateWrittenRequest):
    return await ai_service.evaluate_written_answer(req)

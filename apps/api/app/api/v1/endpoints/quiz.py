from typing import Any, Dict, List
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import get_current_user
from app.services.quiz_service import quiz_service
from app.schemas.quiz_schemas import (
    CategoryResponse,
    QuizResultResponse,
    SaveAnswerRequest,
    Stage1ReviewResponse,
    Stage2VideoResponse,
    Stage3PlayResponse,
    StartQuizRequest,
    SubmitQuizRequest,
    TopicResponse,
    VideoResourceResponse,
)

router = APIRouter(tags=["Quiz Engine"])


@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(language: str = None):
    return await quiz_service.get_categories(language)


@router.get("/categories/{category_id}/topics", response_model=List[TopicResponse])
async def list_category_topics(category_id: str):
    return await quiz_service.get_topics(category_id)


@router.get("/topics/{topic_id}/video", response_model=VideoResourceResponse)
async def get_topic_educational_video(topic_id: str):
    return await quiz_service.get_topic_video(topic_id)


@router.post("/attempts/start", status_code=status.HTTP_201_CREATED)
async def start_quiz_attempt(
    req: StartQuizRequest,
    current_user: dict = Depends(get_current_user)
):
    return await quiz_service.start_quiz(current_user["_id"], req)


@router.get("/attempts/{attempt_id}/stage-1-review", response_model=Stage1ReviewResponse)
async def get_stage_1_review(
    attempt_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await quiz_service.get_stage_1_review(attempt_id)


@router.get("/attempts/{attempt_id}/stage-2-video", response_model=Stage2VideoResponse)
async def get_stage_2_video(
    attempt_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await quiz_service.get_stage_2_video(attempt_id)


@router.post("/attempts/{attempt_id}/stage-3-begin", response_model=Stage3PlayResponse)
async def begin_stage_3_play(
    attempt_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await quiz_service.begin_stage_3_play(attempt_id)


@router.post("/attempts/{attempt_id}/save-answer")
async def save_answer(
    attempt_id: str,
    req: SaveAnswerRequest,
    current_user: dict = Depends(get_current_user)
):
    return await quiz_service.save_answer(attempt_id, req)


@router.post("/attempts/{attempt_id}/submit", response_model=QuizResultResponse)
async def submit_quiz(
    attempt_id: str,
    req: SubmitQuizRequest,
    current_user: dict = Depends(get_current_user)
):
    return await quiz_service.submit_quiz(current_user["_id"], attempt_id, req)


@router.get("/attempts/{attempt_id}/stage-4-results", response_model=QuizResultResponse)
async def get_stage_4_results(
    attempt_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await quiz_service.get_stage_4_results(attempt_id)

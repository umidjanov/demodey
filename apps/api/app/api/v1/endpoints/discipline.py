from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from app.core.dependencies import get_current_user
from app.services.discipline_service import discipline_service
from app.schemas.discipline_schemas import (
    DisciplineStatsResponse,
    DisciplineTaskCreate,
    DisciplineTaskResponse,
)

router = APIRouter(prefix="/discipline", tags=["Discipline & Habit Tracker"])


@router.get("/stats", response_model=DisciplineStatsResponse)
async def get_discipline_stats(
    date: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    return await discipline_service.get_discipline_stats(current_user["_id"], date)


@router.post("/tasks", response_model=DisciplineTaskResponse, status_code=status.HTTP_201_CREATED)
async def create_discipline_task(
    req: DisciplineTaskCreate,
    current_user: dict = Depends(get_current_user)
):
    return await discipline_service.create_task(current_user["_id"], req)


@router.patch("/tasks/{task_id}/toggle", response_model=DisciplineTaskResponse)
async def toggle_discipline_task(
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await discipline_service.toggle_task(current_user["_id"], task_id)


@router.delete("/tasks/{task_id}")
async def delete_discipline_task(
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await discipline_service.delete_task(current_user["_id"], task_id)

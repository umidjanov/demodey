from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user
from app.services.leaderboard_service import leaderboard_service
from app.schemas.gamification_schemas import LeaderboardResponse

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("", response_model=LeaderboardResponse)
async def get_leaderboard(
    period: str = Query("all_time", pattern="^(all_time|monthly|weekly|friends)$"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    return await leaderboard_service.get_leaderboard(
        current_user_id=current_user["_id"],
        period=period,
        limit=limit,
        skip=skip
    )

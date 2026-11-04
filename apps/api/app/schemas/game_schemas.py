from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class MiniGameInfo(BaseModel):
    id: str
    slug: str
    title: str
    subtitle: str
    description: str
    category: str
    gradient: str
    icon: str
    difficulty: str
    time_limit_seconds: Optional[int] = None
    plays_count: int = 0
    top_score: int = 0


class MiniGameScoreSubmit(BaseModel):
    game_slug: str
    score: int
    duration_seconds: int
    accuracy_percentage: Optional[float] = None
    items_completed: Optional[int] = None


class MiniGameScoreResponse(BaseModel):
    game_slug: str
    score: int
    is_personal_best: bool
    earned_xp: int
    ranking_coins_awarded: int = 0
    feedback_message: str

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class DisciplineTaskCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    priority: str = Field("medium", pattern="^(low|medium|high)$")
    due_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")  # YYYY-MM-DD
    due_time: Optional[str] = None  # e.g. "18:00"
    is_recurring: bool = False


class DisciplineTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    is_completed: Optional[bool] = None


class DisciplineTaskResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    priority: str
    due_date: str
    due_time: Optional[str] = None
    is_recurring: bool
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime


class DisciplineDayProgress(BaseModel):
    date: str
    total_tasks: int
    completed_tasks: int
    percentage: float


class DisciplineStatsResponse(BaseModel):
    today_date: str
    today_total: int
    today_completed: int
    today_percentage: float
    current_streak: int
    weekly_history: List[DisciplineDayProgress]
    tasks: List[DisciplineTaskResponse]

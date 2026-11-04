from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class AchievementResponse(BaseModel):
    id: str
    code: str
    name: str
    description: str
    icon: str
    category: str
    xp_reward: int
    coin_reward: int
    unlocked: bool = False
    unlocked_at: Optional[datetime] = None
    progress: int = 0
    target: int = 1


class DailyQuestResponse(BaseModel):
    id: str
    code: str
    title: str
    description: str
    xp_reward: int
    coin_reward: int
    target: int
    current: int = 0
    is_completed: bool = False
    is_claimed: bool = False


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    username: str
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None
    level: int
    level_title: str
    total_xp: int
    ranking_coins: int
    completed_quizzes: int
    accuracy_percentage: float
    streak: int
    is_current_user: bool = False


class LeaderboardResponse(BaseModel):
    period: str  # all_time, monthly, weekly, friends
    podium: List[LeaderboardEntry]  # Top 3
    rankings: List[LeaderboardEntry]
    current_user_entry: Optional[LeaderboardEntry] = None
    total_participants: int = 0


class MonthlyRewardRecord(BaseModel):
    id: str
    month_year: str  # e.g. "October 2026"
    first_place_user: str
    first_place_avatar: Optional[str] = None
    first_place_bonus_coins: int = 900
    first_place_achievement: str = "Clever"
    first_place_stars: int = 5
    second_place_user: str
    third_place_user: str
    distributed_at: datetime

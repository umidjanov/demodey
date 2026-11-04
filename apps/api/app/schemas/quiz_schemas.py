from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    icon: str
    description: str
    language: Optional[str] = "all"
    topic_count: int = 0
    total_questions: int = 0


class TopicResponse(BaseModel):
    id: str
    category_id: str
    name: str
    slug: str
    icon: Optional[str] = None
    description: Optional[str] = None
    question_counts_by_difficulty: Dict[str, int] = {}
    total_questions: int = 0


class QuestionOption(BaseModel):
    id: str  # "A", "B", "C", "D"
    text: str


class QuestionReviewItem(BaseModel):
    id: str
    topic_id: str
    difficulty: str
    type: str  # multiple_choice, true_false, short_answer, fill_blank
    stem: str
    media_url: Optional[str] = None
    learning_notes: Optional[str] = None


class VideoResourceResponse(BaseModel):
    id: str
    topic_id: str
    youtube_id: str
    title: str
    channel: str
    duration_seconds: int
    duration_formatted: str
    description: str
    fallback_content: Optional[str] = None


class StartQuizRequest(BaseModel):
    category_id: str
    topic_id: str
    difficulty: str = Field("medium", pattern="^(very_easy|easy|medium|hard|very_hard|adaptive)$")
    question_count: int = Field(10, ge=10, le=14)
    selection_mode: str = Field("random", pattern="^(random|manual)$")
    selected_question_ids: Optional[List[str]] = None
    time_limit_minutes: int = Field(15, ge=1, le=30)
    language: Optional[str] = "all"
    use_rapidapi: Optional[bool] = False


class ActiveQuestionResponse(BaseModel):
    id: str
    index: int
    difficulty: str
    type: str
    stem: str
    media_url: Optional[str] = None
    options: Optional[List[QuestionOption]] = None


class Stage1ReviewResponse(BaseModel):
    attempt_id: str
    topic_name: str
    category_name: str
    difficulty: str
    question_count: int
    time_limit_minutes: int
    questions: List[QuestionReviewItem]


class Stage2VideoResponse(BaseModel):
    attempt_id: str
    topic_name: str
    video: VideoResourceResponse


class Stage3PlayResponse(BaseModel):
    attempt_id: str
    topic_name: str
    difficulty: str
    time_limit_seconds: int
    remaining_seconds: int
    started_at: datetime
    questions: List[ActiveQuestionResponse]
    saved_answers: Dict[str, str] = {}


class AnswerSubmission(BaseModel):
    question_id: str
    answer: str


class SaveAnswerRequest(BaseModel):
    question_id: str
    answer: str


class SubmitQuizRequest(BaseModel):
    answers: List[AnswerSubmission]


class QuestionResultItem(BaseModel):
    question_id: str
    stem: str
    media_url: Optional[str] = None
    user_answer: Optional[str] = None
    correct_answer: str
    is_correct: bool
    explanation: str
    why_correct: str
    why_user_incorrect: Optional[str] = None
    options: Optional[List[QuestionOption]] = None


class QuizResultResponse(BaseModel):
    attempt_id: str
    quiz_title: str
    category_name: str
    topic_name: str
    difficulty: str
    score_percentage: float
    correct_count: int
    incorrect_count: int
    unanswered_count: int
    duration_seconds: int
    duration_formatted: str
    earned_xp: int
    earned_coins: int
    coins_awarded: bool
    leaderboard_rank: int
    submitted_at: datetime
    questions: List[QuestionResultItem]

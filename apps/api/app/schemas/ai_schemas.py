from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AIChatContext(BaseModel):
    question_stem: Optional[str] = None
    user_answer: Optional[str] = None
    correct_answer: Optional[str] = None
    topic_name: Optional[str] = None
    explanation: Optional[str] = None


class AIChatMessage(BaseModel):
    role: str  # user, assistant, system
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    context: Optional[AIChatContext] = None
    history: Optional[List[AIChatMessage]] = []


class AIChatResponse(BaseModel):
    response: str
    suggested_followups: List[str] = []
    pedagogical_focus: Optional[str] = None


class AIEvaluateWrittenRequest(BaseModel):
    question_id: str
    stem: str
    user_answer: str
    expected_answer: str
    rubric_key_phrases: Optional[List[str]] = []


class AIEvaluateWrittenResponse(BaseModel):
    score: int  # 0 to 100
    is_acceptable: bool
    feedback: str
    factual_correctness: float  # 0.0 to 1.0
    rubric_match_ratio: float

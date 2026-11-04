from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field


# Auth Schemas
class UserRegisterRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    phone_number: Optional[str] = Field(None, max_length=25)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    confirm_password: str = Field(..., min_length=6, max_length=128)
    terms_agreed: bool = Field(...)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    first_name: str
    last_name: str
    role: str
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


# Profile Schemas
class PrivacySettings(BaseModel):
    show_email: bool = False
    show_phone: bool = False
    show_activity: bool = True
    allow_invitations: bool = True


class UserProfileResponse(BaseModel):
    user_id: str
    username: str
    first_name: str
    last_name: str
    email: str
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    level: int = 1
    level_title: str = "Beginner"
    total_xp: int = 0
    ranking_coins: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    completed_quizzes_count: int = 0
    total_questions_answered: int = 0
    total_correct_answers: int = 0
    total_incorrect_answers: int = 0
    average_score: float = 0.0
    rank_position: int = 1
    privacy_settings: PrivacySettings = PrivacySettings()
    created_at: Optional[datetime] = None


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    privacy_settings: Optional[PrivacySettings] = None

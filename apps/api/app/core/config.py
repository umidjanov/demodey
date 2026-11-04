from typing import List, Optional
from pydantic import ConfigDict, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "QUIZORA API"
    VERSION: str = "1.0.0"

    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "https://demodey-6q51.vercel.app",
    ]

    # JWT Security
    JWT_SECRET_KEY: str = "quizora-production-grade-super-secure-jwt-secret-key-32-chars-min"
    JWT_REFRESH_SECRET_KEY: str = "quizora-production-grade-refresh-token-secret-key-32-chars-min"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "quizora"

    # Redis
    REDIS_URI: str = "redis://localhost:6379/0"

    # AI Provider
    AI_PROVIDER: str = "gemini"  # gemini, openai, claude, or heuristic
    AI_PROVIDER_API_KEY: Optional[str] = None
    AI_MODEL_NAME: str = "gemini-1.5-flash"

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # YouTube API
    YOUTUBE_API_KEY: Optional[str] = None

    # RapidAPI & External Quiz Providers
    RAPIDAPI_KEY: Optional[str] = None
    RAPIDAPI_HOST: str = "quizapi.io"
    RAPIDAPI_QUIZ_URL: str = "https://quizapi.io/api/v1/questions"

    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow"
    )


settings = Settings()

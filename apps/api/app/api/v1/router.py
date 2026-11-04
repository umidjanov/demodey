from fastapi import APIRouter
from app.api.v1.endpoints import (
    admin,
    ai,
    auth,
    discipline,
    games,
    gamification,
    leaderboard,
    profiles,
    quiz,
    results,
    social,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(profiles.router)
api_router.include_router(quiz.router)
api_router.include_router(results.router)
api_router.include_router(ai.router)
api_router.include_router(leaderboard.router)
api_router.include_router(gamification.router)
api_router.include_router(social.router)
api_router.include_router(discipline.router)
api_router.include_router(games.router)
api_router.include_router(admin.router)

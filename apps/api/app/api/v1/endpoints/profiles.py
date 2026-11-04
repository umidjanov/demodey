from datetime import datetime, timezone
from typing import Any, Dict
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_current_user
from app.core.database import db_manager
from app.services.gamification_service import gamification_service
from app.schemas.auth_schemas import UserProfileResponse, UpdateProfileRequest, PrivacySettings

router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    profiles_col = db_manager.get_collection("user_profiles")

    profile = await profiles_col.find_one({"user_id": user_id})
    if not profile:
        # Create profile lazily if needed
        now = datetime.now(timezone.utc)
        profile = {
            "user_id": user_id,
            "bio": "Excited to learn on Quizora!",
            "level": 1,
            "total_xp": 120,
            "ranking_coins": 20,
            "current_streak": 3,
            "longest_streak": 5,
            "last_active_date": now.strftime("%Y-%m-%d"),
            "completed_quizzes_count": 2,
            "total_questions_answered": 20,
            "total_correct_answers": 19,
            "total_incorrect_answers": 1,
            "average_score": 95.0,
            "privacy_settings": {"show_email": False, "show_phone": False, "show_activity": True, "allow_invitations": True},
            "created_at": now,
            "updated_at": now
        }
        await profiles_col.insert_one(profile)

    lvl, lvl_title = gamification_service.calculate_level(profile.get("total_xp", 0))

    return UserProfileResponse(
        user_id=str(user_id),
        username=current_user.get("username", "learner"),
        first_name=current_user.get("first_name", ""),
        last_name=current_user.get("last_name", ""),
        email=current_user.get("email", ""),
        phone_number=current_user.get("phone_number"),
        avatar_url=current_user.get("avatar_url"),
        bio=profile.get("bio"),
        level=lvl,
        level_title=lvl_title,
        total_xp=profile.get("total_xp", 0),
        ranking_coins=profile.get("ranking_coins", 0),
        current_streak=profile.get("current_streak", 1),
        longest_streak=profile.get("longest_streak", 1),
        completed_quizzes_count=profile.get("completed_quizzes_count", 0),
        total_questions_answered=profile.get("total_questions_answered", 0),
        total_correct_answers=profile.get("total_correct_answers", 0),
        total_incorrect_answers=profile.get("total_incorrect_answers", 0),
        average_score=profile.get("average_score", 0.0),
        rank_position=1,
        privacy_settings=PrivacySettings(**profile.get("privacy_settings", {})),
        created_at=current_user.get("created_at")
    )


@router.put("/me", response_model=UserProfileResponse)
async def update_my_profile(
    req: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["_id"]
    users_col = db_manager.get_collection("users")
    profiles_col = db_manager.get_collection("user_profiles")

    user_update = {}
    if req.first_name is not None:
        user_update["first_name"] = req.first_name
    if req.last_name is not None:
        user_update["last_name"] = req.last_name
    if req.avatar_url is not None:
        user_update["avatar_url"] = req.avatar_url

    if user_update:
        await users_col.update_one({"_id": user_id}, {"$set": user_update})

    profile_update = {}
    if req.bio is not None:
        profile_update["bio"] = req.bio
    if req.privacy_settings is not None:
        profile_update["privacy_settings"] = req.privacy_settings.model_dump()

    if profile_update:
        await profiles_col.update_one({"user_id": user_id}, {"$set": profile_update})

    # Return refreshed profile
    updated_user = await users_col.find_one({"_id": user_id})
    return await get_my_profile(updated_user)


@router.get("/me/lifetime-progress")
async def get_lifetime_progress(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    profiles_col = db_manager.get_collection("user_profiles")
    profile = await profiles_col.find_one({"user_id": user_id}) or {}

    return {
        "registration_date": (current_user.get("created_at") or datetime.now(timezone.utc)).strftime("%B %d, %Y"),
        "total_earned_coins": profile.get("ranking_coins", 0),
        "total_xp": profile.get("total_xp", 0),
        "completed_quizzes": profile.get("completed_quizzes_count", 0),
        "accuracy_percentage": profile.get("average_score", 0.0),
        "weekly_accuracy_gain": "+4.2%",
        "performance_chart": [
            {"day": "Mon", "score": 85, "xp": 120, "quizzes": 1},
            {"day": "Tue", "score": 90, "xp": 150, "quizzes": 2},
            {"day": "Wed", "score": 95, "xp": 210, "quizzes": 2},
            {"day": "Thu", "score": 90, "xp": 180, "quizzes": 1},
            {"day": "Fri", "score": 100, "xp": 260, "quizzes": 3},
            {"day": "Sat", "score": 92, "xp": 190, "quizzes": 2},
            {"day": "Sun", "score": 98, "xp": 240, "quizzes": 2},
        ]
    }

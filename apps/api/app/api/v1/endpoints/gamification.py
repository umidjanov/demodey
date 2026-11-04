from typing import List
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_current_user
from app.core.database import db_manager
from app.schemas.gamification_schemas import AchievementResponse, DailyQuestResponse, MonthlyRewardRecord

router = APIRouter(tags=["Gamification & Rewards"])


@router.get("/achievements", response_model=List[AchievementResponse])
async def list_achievements(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    ach_col = db_manager.get_collection("achievements")
    user_ach_col = db_manager.get_collection("user_achievements")

    all_ach = await ach_col.find({}).to_list(100)
    user_unlocked = await user_ach_col.find({"user_id": user_id}).to_list(100)
    unlocked_map = {u["code"]: u.get("unlocked_at") for u in user_unlocked}

    res = []
    for a in all_ach:
        code = a["code"]
        is_unlocked = code in unlocked_map
        res.append(
            AchievementResponse(
                id=str(a["_id"]),
                code=code,
                name=a["name"],
                description=a["description"],
                icon=a.get("icon", "Award"),
                category=a.get("category", "General"),
                xp_reward=a.get("xp_reward", 100),
                coin_reward=a.get("coin_reward", 0),
                unlocked=is_unlocked,
                unlocked_at=unlocked_map.get(code),
                progress=1 if is_unlocked else 0,
                target=1
            )
        )
    return res


@router.get("/daily-quests", response_model=List[DailyQuestResponse])
async def list_daily_quests(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    quests_col = db_manager.get_collection("daily_quests")
    all_quests = await quests_col.find({"is_active": True}).to_list(20)

    # Calculate user progress
    profiles_col = db_manager.get_collection("user_profiles")
    profile = await profiles_col.find_one({"user_id": user_id}) or {}
    completed_q = profile.get("completed_quizzes_count", 0)

    res = []
    for q in all_quests:
        code = q["code"]
        target = q.get("target", 2)
        cur = min(completed_q, target) if code == "complete_2_quizzes" else 1
        is_comp = cur >= target

        res.append(
            DailyQuestResponse(
                id=str(q["_id"]),
                code=code,
                title=q["title"],
                description=q["description"],
                xp_reward=q.get("xp_reward", 50),
                coin_reward=q.get("coin_reward", 5),
                target=target,
                current=cur,
                is_completed=is_comp,
                is_claimed=False
            )
        )
    return res


@router.post("/daily-quests/{quest_id}/claim")
async def claim_quest_reward(quest_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    profiles_col = db_manager.get_collection("user_profiles")
    await profiles_col.update_one(
        {"user_id": user_id},
        {"$inc": {"total_xp": 50, "ranking_coins": 5}}
    )
    return {"status": "claimed", "reward": {"xp": 50, "coins": 5}}


@router.get("/rewards/monthly-history", response_model=List[MonthlyRewardRecord])
async def get_monthly_rewards_history():
    col = db_manager.get_collection("monthly_rewards")
    records = await col.find({}).sort("distributed_at", -1).to_list(50)
    return [
        MonthlyRewardRecord(
            id=str(r["_id"]),
            month_year=r.get("month_year", "October 2026"),
            first_place_user=r.get("first_place_user", "sarah_connor"),
            first_place_avatar=r.get("first_place_avatar"),
            first_place_bonus_coins=r.get("first_place_bonus_coins", 900),
            first_place_achievement=r.get("first_place_achievement", "Clever"),
            first_place_stars=r.get("first_place_stars", 5),
            second_place_user=r.get("second_place_user", "alex_rivera"),
            third_place_user=r.get("third_place_user", "kenji_sato"),
            distributed_at=r.get("distributed_at")
        )
        for r in records
    ]

from datetime import datetime
from typing import Any, Dict, List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user
from app.core.database import db_manager

router = APIRouter(prefix="/results", tags=["Quiz Results"])


@router.get("")
async def get_my_quiz_results(
    category_id: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["_id"]
    attempts_col = db_manager.get_collection("quiz_attempts")
    topics_col = db_manager.get_collection("topics")
    cats_col = db_manager.get_collection("categories")

    query: Dict[str, Any] = {
        "user_id": user_id,
        "status": "completed"
    }
    if difficulty:
        query["difficulty"] = difficulty
    if category_id:
        query["category_id"] = ObjectId(category_id) if ObjectId.is_valid(category_id) else category_id
    if min_score is not None:
        query["score_percentage"] = {"$gte": min_score}

    attempts = await attempts_col.find(query).sort("completed_at", -1).to_list(100)

    res = []
    for att in attempts:
        t = await topics_col.find_one({"_id": att.get("topic_id")})
        c = await cats_col.find_one({"_id": att.get("category_id")})
        dur_sec = att.get("duration_seconds", 0)
        mins, secs = divmod(dur_sec, 60)

        res.append({
            "id": str(att["_id"]),
            "quiz_title": f"{t.get('name', 'General')} Mastery Quiz" if t else "Quiz",
            "category_name": c.get("name", "Category") if c else "Category",
            "topic_name": t.get("name", "Topic") if t else "Topic",
            "difficulty": att.get("difficulty", "medium"),
            "score_percentage": att.get("score_percentage", 0.0),
            "correct_count": att.get("correct_count", 0),
            "incorrect_count": att.get("incorrect_count", 0),
            "unanswered_count": att.get("unanswered_count", 0),
            "duration_formatted": f"{mins:02d}:{secs:02d}",
            "evaluation_status": "completed",
            "earned_coins": att.get("earned_coins", 0),
            "earned_xp": att.get("earned_xp", 0),
            "completed_at": att.get("completed_at") or att.get("submitted_at")
        })

    return res

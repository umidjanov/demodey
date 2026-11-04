from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from app.core.dependencies import get_current_admin
from app.core.database import db_manager
from app.services.gamification_service import gamification_service

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


class CreateQuestionRequest(BaseModel):
    category_id: str
    topic_id: str
    difficulty: str  # very_easy, easy, medium, hard, very_hard
    type: str  # multiple_choice, true_false, short_answer, fill_blank
    stem: str
    media_url: Optional[str] = None
    options: Optional[List[Dict[str, str]]] = None
    correct_answer: str
    explanation: str
    why_correct: str
    learning_notes: Optional[str] = None


class BulkImportResponse(BaseModel):
    status: str
    imported_count: int
    duplicates_skipped: int
    failed_count: int


class UpdateUserStatusRequest(BaseModel):
    is_active: bool


class UpdateUserRoleRequest(BaseModel):
    role: str


@router.get("/stats")
async def get_admin_dashboard_stats(admin: dict = Depends(get_current_admin)):
    users_col = db_manager.get_collection("users")
    questions_col = db_manager.get_collection("questions")
    attempts_col = db_manager.get_collection("quiz_attempts")
    cats_col = db_manager.get_collection("categories")

    total_users = await users_col.count_documents({})
    active_users = await users_col.count_documents({"is_active": True})
    admins_count = await users_col.count_documents({"role": "admin"})
    total_questions = await questions_col.count_documents({})
    total_attempts = await attempts_col.count_documents({})
    total_categories = await cats_col.count_documents({})

    # Query real recent events from DB
    recent_users = await users_col.find({}).sort("created_at", -1).limit(5).to_list(5)
    recent_attempts = await attempts_col.find({}).sort("completed_at", -1).limit(5).to_list(5)

    recent_activity = []
    for u in recent_users:
        created_val = u.get("created_at")
        time_str = created_val.strftime("%Y-%m-%d %H:%M") if hasattr(created_val, "strftime") else "Yaqinda"
        recent_activity.append({
            "action": "Yangi foydalanuvchi ro'yxatdan o'tdi",
            "user": u.get("username", "user"),
            "time": time_str
        })
    for a in recent_attempts:
        comp_val = a.get("completed_at")
        time_str = comp_val.strftime("%Y-%m-%d %H:%M") if hasattr(comp_val, "strftime") else "Yaqinda"
        recent_activity.append({
            "action": f"Test yakunlandi ({a.get('score_percentage', 100)}%)",
            "user": a.get("username", "user"),
            "reward": f"+{a.get('earned_coins', 0)} Tangalar",
            "time": time_str
        })

    return {
        "kpis": {
            "total_registered_users": total_users,
            "active_users_count": active_users,
            "admins_count": admins_count,
            "total_questions_in_pool": total_questions,
            "total_quiz_attempts_completed": total_attempts,
            "total_active_categories": total_categories,
            "ai_evaluation_queue_health": "Healthy (0 pending)",
            "average_system_latency_ms": 32
        },
        "recent_activity": recent_activity
    }


@router.get("/users")
async def get_admin_users(admin: dict = Depends(get_current_admin)):
    users_col = db_manager.get_collection("users")
    profiles_col = db_manager.get_collection("user_profiles")

    users = await users_col.find({}).sort("created_at", -1).to_list(500)
    result = []
    for u in users:
        p = await profiles_col.find_one({"user_id": u["_id"]}) or {}
        lvl, lvl_title = gamification_service.calculate_level(p.get("total_xp", 0))
        created_val = u.get("created_at")
        created_str = created_val.isoformat() if hasattr(created_val, "isoformat") else str(created_val or "")
        login_val = u.get("last_login_at")
        login_str = login_val.isoformat() if hasattr(login_val, "isoformat") else str(login_val or "")

        result.append({
            "id": str(u["_id"]),
            "email": u["email"],
            "username": u["username"],
            "first_name": u.get("first_name", ""),
            "last_name": u.get("last_name", ""),
            "phone_number": u.get("phone_number") or "",
            "role": u.get("role", "user"),
            "is_active": u.get("is_active", True),
            "is_verified": u.get("is_verified", False),
            "avatar_url": u.get("avatar_url") or f"https://api.dicebear.com/7.x/bottts/svg?seed={u['username']}",
            "created_at": created_str,
            "last_login_at": login_str,
            "last_active_date": p.get("last_active_date", ""),
            "level": p.get("level", lvl),
            "level_title": p.get("level_title", lvl_title),
            "total_xp": p.get("total_xp", 0),
            "coins": p.get("ranking_coins", 0),
            "ranking_coins": p.get("ranking_coins", 0),
            "current_streak": p.get("current_streak", 0),
            "longest_streak": p.get("longest_streak", 0),
            "completed_quizzes_count": p.get("completed_quizzes_count", 0),
            "total_questions_answered": p.get("total_questions_answered", 0),
            "total_correct_answers": p.get("total_correct_answers", 0),
            "total_incorrect_answers": p.get("total_incorrect_answers", 0),
            "average_score": p.get("average_score", 0.0),
            "bio": p.get("bio", "")
        })
    return result


@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    req: UpdateUserStatusRequest,
    admin: dict = Depends(get_current_admin)
):
    users_col = db_manager.get_collection("users")
    u_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
    user = await users_col.find_one({"_id": u_id})
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi.")
    
    if str(admin["_id"]) == str(user["_id"]) and not req.is_active:
        raise HTTPException(status_code=400, detail="O'z admin hisobingizni bloklay olmaysiz.")
    
    await users_col.update_one({"_id": u_id}, {"$set": {"is_active": req.is_active}})
    return {"status": "success", "message": f"Foydalanuvchi holati {'Faol' if req.is_active else 'Bloklangan'}ga o'zgartirildi."}


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    req: UpdateUserRoleRequest,
    admin: dict = Depends(get_current_admin)
):
    if req.role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Noto'g'ri rol. 'admin' yoki 'user' bo'lishi kerak.")
    
    users_col = db_manager.get_collection("users")
    u_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
    user = await users_col.find_one({"_id": u_id})
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi.")
    
    if str(admin["_id"]) == str(user["_id"]) and req.role != "admin":
        raise HTTPException(status_code=400, detail="O'z admin huquqingizni bekor qila olmaysiz.")
    
    await users_col.update_one({"_id": u_id}, {"$set": {"role": req.role}})
    return {"status": "success", "message": f"Foydalanuvchi roli {req.role}ga o'zgartirildi."}


@router.delete("/users/{user_id}")
async def delete_user_account(
    user_id: str,
    admin: dict = Depends(get_current_admin)
):
    users_col = db_manager.get_collection("users")
    profiles_col = db_manager.get_collection("user_profiles")
    attempts_col = db_manager.get_collection("quiz_attempts")
    friends_col = db_manager.get_collection("friends")

    u_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
    user = await users_col.find_one({"_id": u_id})
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi.")
    
    if str(admin["_id"]) == str(user["_id"]):
        raise HTTPException(status_code=400, detail="O'z admin hisobingizni o'chira olmaysiz.")
    
    await users_col.delete_one({"_id": u_id})
    await profiles_col.delete_many({"user_id": u_id})
    await attempts_col.delete_many({"user_id": u_id})
    await friends_col.delete_many({"$or": [{"user_id_1": u_id}, {"user_id_2": u_id}]})
    return {"status": "success", "message": f"Foydalanuvchi '{user.get('username')}' butunlay o'chirildi."}


@router.post("/purge-fake-users")
async def purge_fake_users_endpoint(admin: dict = Depends(get_current_admin)):
    from app.seeds.seed_data import purge_fake_users
    await purge_fake_users()
    return {"status": "success", "message": "Barcha soxta (mock) foydalanuvchilar ma'lumotlar bazasidan to'liq o'chirildi."}


@router.post("/questions", status_code=status.HTTP_201_CREATED)
async def create_single_question(
    req: CreateQuestionRequest,
    admin: dict = Depends(get_current_admin)
):
    questions_col = db_manager.get_collection("questions")
    now = datetime.now(timezone.utc)

    doc = {
        "category_id": ObjectId(req.category_id) if ObjectId.is_valid(req.category_id) else req.category_id,
        "topic_id": ObjectId(req.topic_id) if ObjectId.is_valid(req.topic_id) else req.topic_id,
        "difficulty": req.difficulty,
        "type": req.type,
        "stem": req.stem,
        "media_url": req.media_url,
        "options": req.options or [],
        "correct_answer": req.correct_answer,
        "explanation": req.explanation,
        "why_correct": req.why_correct,
        "learning_notes": req.learning_notes or "Review fundamental definitions.",
        "is_approved": True,
        "created_by": admin["_id"],
        "created_at": now
    }
    res = await questions_col.insert_one(doc)
    return {"id": str(res.inserted_id), "status": "created"}


@router.post("/questions/bulk-import", response_model=BulkImportResponse)
async def bulk_import_questions(
    questions: List[CreateQuestionRequest],
    admin: dict = Depends(get_current_admin)
):
    questions_col = db_manager.get_collection("questions")
    now = datetime.now(timezone.utc)

    docs = []
    for q in questions:
        docs.append({
            "category_id": ObjectId(q.category_id) if ObjectId.is_valid(q.category_id) else q.category_id,
            "topic_id": ObjectId(q.topic_id) if ObjectId.is_valid(q.topic_id) else q.topic_id,
            "difficulty": q.difficulty,
            "type": q.type,
            "stem": q.stem,
            "media_url": q.media_url,
            "options": q.options or [],
            "correct_answer": q.correct_answer,
            "explanation": q.explanation,
            "why_correct": q.why_correct,
            "learning_notes": q.learning_notes or "Focus on accurate recall.",
            "is_approved": True,
            "created_by": admin["_id"],
            "created_at": now
        })

    if docs:
        await questions_col.insert_many(docs)

    return BulkImportResponse(
        status="success",
        imported_count=len(docs),
        duplicates_skipped=0,
        failed_count=0
    )


@router.post("/monthly-rewards/process")
async def trigger_monthly_rewards(
    month_year: str = "October 2026",
    admin: dict = Depends(get_current_admin)
):
    record = await gamification_service.process_monthly_champions(month_year)
    return {"status": "success", "record": record}

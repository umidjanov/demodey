from typing import List
from fastapi import APIRouter, Depends, Query, status
from app.core.dependencies import get_current_user
from app.services.social_service import social_service
from app.schemas.social_schemas import (
    CreateRoomRequest,
    FriendsListResponse,
    MessageResponse,
    RoomResponse,
    SendMessageRequest,
)

router = APIRouter(tags=["Social & Multiplayer"])


@router.get("/friends", response_model=FriendsListResponse)
async def get_my_friends(current_user: dict = Depends(get_current_user)):
    return await social_service.get_friends_list(current_user["_id"])


@router.get("/community")
async def get_community_learners(
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    from app.core.database import db_manager
    users_col = db_manager.get_collection("users")
    profiles_col = db_manager.get_collection("user_profiles")

    all_users = await users_col.find({
        "_id": {"$ne": current_user["_id"]},
        "is_active": True
    }).limit(limit).to_list(limit)

    result = []
    for u in all_users:
        p = await profiles_col.find_one({"user_id": u["_id"]}) or {}
        lvl = p.get("level", 1)
        result.append({
            "id": str(u["_id"]),
            "username": u.get("username", "learner"),
            "first_name": u.get("first_name", ""),
            "last_name": u.get("last_name", ""),
            "avatar_url": u.get("avatar_url") or f"https://api.dicebear.com/7.x/bottts/svg?seed={u.get('username')}",
            "level": lvl,
            "is_online": True,
            "activity": "Quizora testlarini yechmoqda",
            "accuracy_percentage": p.get("average_score", 0.0)
        })
    return result


@router.post("/friends/request")
async def send_friend_request(
    username: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    return await social_service.send_friend_request(current_user["_id"], username)


@router.post("/friends/respond")
async def respond_friend_request(
    request_id: str = Query(...),
    accept: bool = Query(...),
    current_user: dict = Depends(get_current_user)
):
    return await social_service.respond_friend_request(current_user["_id"], request_id, accept)


@router.get("/messages/{other_user_id}", response_model=List[MessageResponse])
async def get_conversation_messages(
    other_user_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await social_service.get_messages(current_user["_id"], other_user_id)


@router.post("/messages", response_model=MessageResponse)
async def send_direct_message(
    req: SendMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    return await social_service.send_message(current_user["_id"], req)


# Multiplayer Quiz Rooms
@router.post("/rooms/create", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz_room(
    req: CreateRoomRequest,
    current_user: dict = Depends(get_current_user)
):
    return await social_service.create_room(current_user["_id"], req)


@router.post("/rooms/join", response_model=RoomResponse)
async def join_quiz_room(
    room_code: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    return await social_service.join_room(current_user["_id"], room_code)

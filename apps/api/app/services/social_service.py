import random
import string
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from fastapi import HTTPException
from app.core.database import db_manager
from app.schemas.social_schemas import (
    ConversationResponse,
    CreateRoomRequest,
    FriendRequestResponse,
    FriendsListResponse,
    FriendUser,
    MessageResponse,
    RoomParticipant,
    RoomResponse,
    SendMessageRequest,
)


class SocialService:
    def _users_col(self):
        return db_manager.get_collection("users")

    def _profiles_col(self):
        return db_manager.get_collection("user_profiles")

    def _friends_col(self):
        return db_manager.get_collection("friends")

    def _requests_col(self):
        return db_manager.get_collection("friend_requests")

    def _messages_col(self):
        return db_manager.get_collection("messages")

    def _rooms_col(self):
        return db_manager.get_collection("quiz_rooms")

    def _topics_col(self):
        return db_manager.get_collection("topics")

    async def get_friends_list(self, user_id: ObjectId) -> FriendsListResponse:
        friends_col = self._friends_col()
        reqs_col = self._requests_col()
        profiles_col = self._profiles_col()
        users_col = self._users_col()

        # Find friendships
        friendships = await friends_col.find({
            "$or": [{"user_id_1": user_id}, {"user_id_2": user_id}]
        }).to_list(100)

        friend_ids = []
        for f in friendships:
            other = f["user_id_2"] if f["user_id_1"] == user_id else f["user_id_1"]
            friend_ids.append(other)

        friends_data: List[FriendUser] = []
        for fid in friend_ids:
            u = await users_col.find_one({"_id": fid})
            p = await profiles_col.find_one({"user_id": fid})
            if u:
                friends_data.append(
                    FriendUser(
                        user_id=str(u["_id"]),
                        username=u.get("username", "friend"),
                        first_name=u.get("first_name", ""),
                        last_name=u.get("last_name", ""),
                        avatar_url=u.get("avatar_url"),
                        level=p.get("level", 1) if p else 1,
                        is_online=True,  # active in session
                        current_activity="Solving Python Quiz",
                        accuracy_percentage=p.get("average_score", 85.0) if p else 85.0
                    )
                )

        # Incoming requests
        incoming = await reqs_col.find({
            "receiver_id": user_id,
            "status": "pending"
        }).to_list(20)

        req_responses: List[FriendRequestResponse] = []
        for r in incoming:
            s_user = await users_col.find_one({"_id": r["sender_id"]})
            s_prof = await profiles_col.find_one({"user_id": r["sender_id"]})
            if s_user:
                sender_f = FriendUser(
                    user_id=str(s_user["_id"]),
                    username=s_user.get("username", ""),
                    first_name=s_user.get("first_name", ""),
                    last_name=s_user.get("last_name", ""),
                    avatar_url=s_user.get("avatar_url"),
                    level=s_prof.get("level", 1) if s_prof else 1,
                    is_online=False,
                    current_activity=None,
                    accuracy_percentage=s_prof.get("average_score", 0.0) if s_prof else 0.0
                )
                req_responses.append(
                    FriendRequestResponse(
                        id=str(r["_id"]),
                        sender=sender_f,
                        created_at=r.get("created_at", datetime.now(timezone.utc)),
                        status="pending"
                    )
                )

        online_count = sum(1 for f in friends_data if f.is_online)

        return FriendsListResponse(
            friends=friends_data,
            incoming_requests=req_responses,
            online_count=online_count
        )

    async def send_friend_request(self, sender_id: ObjectId, target_username: str) -> Dict[str, Any]:
        users_col = self._users_col()
        reqs_col = self._requests_col()
        friends_col = self._friends_col()

        target = await users_col.find_one({"username": target_username})
        if not target:
            raise HTTPException(status_code=404, detail="User not found.")

        target_id = target["_id"]
        if target_id == sender_id:
            raise HTTPException(status_code=400, detail="You cannot send a friend request to yourself.")

        # Check existing friendship
        existing_friend = await friends_col.find_one({
            "$or": [
                {"user_id_1": sender_id, "user_id_2": target_id},
                {"user_id_1": target_id, "user_id_2": sender_id}
            ]
        })
        if existing_friend:
            return {"status": "already_friends", "message": "You are already friends."}

        # Check existing request
        existing_req = await reqs_col.find_one({
            "sender_id": sender_id,
            "receiver_id": target_id,
            "status": "pending"
        })
        if existing_req:
            return {"status": "pending", "message": "Friend request already sent."}

        await reqs_col.insert_one({
            "sender_id": sender_id,
            "receiver_id": target_id,
            "status": "pending",
            "created_at": datetime.now(timezone.utc)
        })
        return {"status": "sent", "message": f"Friend request sent to @{target_username}."}

    async def respond_friend_request(self, user_id: ObjectId, request_id_str: str, accept: bool) -> Dict[str, Any]:
        reqs_col = self._requests_col()
        friends_col = self._friends_col()
        req_id = ObjectId(request_id_str) if ObjectId.is_valid(request_id_str) else request_id_str

        req = await reqs_col.find_one({"_id": req_id, "receiver_id": user_id})
        if not req:
            raise HTTPException(status_code=404, detail="Friend request not found.")

        now = datetime.now(timezone.utc)
        if accept:
            await reqs_col.update_one({"_id": req_id}, {"$set": {"status": "accepted"}})
            await friends_col.insert_one({
                "user_id_1": req["sender_id"],
                "user_id_2": user_id,
                "created_at": now
            })
            return {"status": "accepted", "message": "Friend request accepted!"}
        else:
            await reqs_col.update_one({"_id": req_id}, {"$set": {"status": "rejected"}})
            return {"status": "rejected", "message": "Friend request declined."}

    async def get_messages(self, user_id: ObjectId, other_user_id_str: str) -> List[MessageResponse]:
        other_id = ObjectId(other_user_id_str) if ObjectId.is_valid(other_user_id_str) else other_user_id_str
        msgs_col = self._messages_col()
        users_col = self._users_col()

        msgs = await msgs_col.find({
            "$or": [
                {"sender_id": user_id, "recipient_id": other_id},
                {"sender_id": other_id, "recipient_id": user_id}
            ]
        }).sort("created_at", 1).to_list(100)

        res: List[MessageResponse] = []
        user_cache = {}
        for m in msgs:
            s_id = m["sender_id"]
            if s_id not in user_cache:
                u = await users_col.find_one({"_id": s_id})
                user_cache[s_id] = u
            u = user_cache[s_id]
            res.append(
                MessageResponse(
                    id=str(m["_id"]),
                    conversation_id=str(m.get("conversation_id", f"{min(str(user_id), str(other_id))}_{max(str(user_id), str(other_id))}")),
                    sender_id=str(s_id),
                    sender_username=u.get("username", "user") if u else "user",
                    sender_avatar=u.get("avatar_url") if u else None,
                    recipient_id=str(m["recipient_id"]),
                    content=m.get("content", ""),
                    quiz_invitation_code=m.get("quiz_invitation_code"),
                    is_read=m.get("is_read", False),
                    created_at=m.get("created_at", datetime.now(timezone.utc))
                )
            )
        return res

    async def send_message(self, sender_id: ObjectId, req: SendMessageRequest) -> MessageResponse:
        recipient_id = ObjectId(req.recipient_id) if ObjectId.is_valid(req.recipient_id) else req.recipient_id
        users_col = self._users_col()
        msgs_col = self._messages_col()

        sender = await users_col.find_one({"_id": sender_id})
        now = datetime.now(timezone.utc)
        conv_id = f"{min(str(sender_id), str(recipient_id))}_{max(str(sender_id), str(recipient_id))}"

        doc = {
            "conversation_id": conv_id,
            "sender_id": sender_id,
            "recipient_id": recipient_id,
            "content": req.content,
            "quiz_invitation_code": req.quiz_invitation_code,
            "is_read": False,
            "created_at": now
        }
        res = await msgs_col.insert_one(doc)

        return MessageResponse(
            id=str(res.inserted_id),
            conversation_id=conv_id,
            sender_id=str(sender_id),
            sender_username=sender.get("username", "user") if sender else "user",
            sender_avatar=sender.get("avatar_url") if sender else None,
            recipient_id=str(recipient_id),
            content=req.content,
            quiz_invitation_code=req.quiz_invitation_code,
            is_read=False,
            created_at=now
        )

    # Multiplayer Room Engine
    async def create_room(self, host_id: ObjectId, req: CreateRoomRequest) -> RoomResponse:
        rooms_col = self._rooms_col()
        topics_col = self._topics_col()
        users_col = self._users_col()
        profiles_col = self._profiles_col()

        t_id = ObjectId(req.topic_id) if ObjectId.is_valid(req.topic_id) else req.topic_id
        topic = await topics_col.find_one({"_id": t_id})
        host = await users_col.find_one({"_id": host_id})
        host_prof = await profiles_col.find_one({"user_id": host_id})

        # Generate memorable room code: QZ-XXXX
        code_suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
        room_code = f"QZ-{code_suffix}"

        now = datetime.now(timezone.utc)
        host_participant = {
            "user_id": host_id,
            "username": host.get("username", "Host") if host else "Host",
            "avatar_url": host.get("avatar_url") if host else None,
            "level": host_prof.get("level", 1) if host_prof else 1,
            "is_ready": True,
            "score": 0,
            "correct_count": 0,
            "completed": False,
            "duration_seconds": 0
        }

        room_doc = {
            "room_code": room_code,
            "host_id": host_id,
            "topic_id": t_id,
            "topic_name": topic.get("name", "Topic") if topic else "Topic",
            "difficulty": req.difficulty,
            "question_count": req.question_count,
            "time_limit_minutes": req.time_limit_minutes,
            "status": "waiting",
            "participants": [host_participant],
            "created_at": now
        }
        res = await rooms_col.insert_one(room_doc)

        return RoomResponse(
            id=str(res.inserted_id),
            room_code=room_code,
            host_id=str(host_id),
            topic_name=room_doc["topic_name"],
            difficulty=req.difficulty,
            question_count=req.question_count,
            time_limit_minutes=req.time_limit_minutes,
            status="waiting",
            participants=[RoomParticipant(**host_participant, user_id=str(host_id))],
            created_at=now
        )

    async def join_room(self, user_id: ObjectId, room_code: str) -> RoomResponse:
        rooms_col = self._rooms_col()
        users_col = self._users_col()
        profiles_col = self._profiles_col()

        clean_code = room_code.strip().upper()
        room = await rooms_col.find_one({"room_code": clean_code})
        if not room:
            raise HTTPException(status_code=404, detail="Quiz Room not found. Check code and try again.")

        user = await users_col.find_one({"_id": user_id})
        prof = await profiles_col.find_one({"user_id": user_id})

        # Check if already joined
        existing = any(str(p["user_id"]) == str(user_id) for p in room.get("participants", []))
        if not existing:
            new_p = {
                "user_id": user_id,
                "username": user.get("username", "Player") if user else "Player",
                "avatar_url": user.get("avatar_url") if user else None,
                "level": prof.get("level", 1) if prof else 1,
                "is_ready": False,
                "score": 0,
                "correct_count": 0,
                "completed": False,
                "duration_seconds": 0
            }
            await rooms_col.update_one(
                {"_id": room["_id"]},
                {"$push": {"participants": new_p}}
            )
            room["participants"].append(new_p)

        participants = [
            RoomParticipant(
                user_id=str(p["user_id"]),
                username=p["username"],
                avatar_url=p.get("avatar_url"),
                level=p.get("level", 1),
                is_ready=p.get("is_ready", False),
                score=p.get("score", 0),
                correct_count=p.get("correct_count", 0),
                completed=p.get("completed", False),
                duration_seconds=p.get("duration_seconds", 0)
            ) for p in room["participants"]
        ]

        return RoomResponse(
            id=str(room["_id"]),
            room_code=room["room_code"],
            host_id=str(room["host_id"]),
            topic_name=room.get("topic_name", "Topic"),
            difficulty=room.get("difficulty", "medium"),
            question_count=room.get("question_count", 10),
            time_limit_minutes=room.get("time_limit_minutes", 15),
            status=room.get("status", "waiting"),
            participants=participants,
            created_at=room.get("created_at", datetime.now(timezone.utc))
        )


social_service = SocialService()

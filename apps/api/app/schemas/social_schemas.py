from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class FriendUser(BaseModel):
    user_id: str
    username: str
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None
    level: int = 1
    is_online: bool = False
    current_activity: Optional[str] = None
    accuracy_percentage: float = 0.0


class FriendRequestResponse(BaseModel):
    id: str
    sender: FriendUser
    created_at: datetime
    status: str  # pending, accepted, rejected


class FriendsListResponse(BaseModel):
    friends: List[FriendUser]
    incoming_requests: List[FriendRequestResponse]
    online_count: int


class SendMessageRequest(BaseModel):
    recipient_id: str
    content: str = Field(..., min_length=1, max_length=2000)
    quiz_invitation_code: Optional[str] = None


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_username: str
    sender_avatar: Optional[str] = None
    recipient_id: str
    content: str
    quiz_invitation_code: Optional[str] = None
    is_read: bool = False
    created_at: datetime


class ConversationResponse(BaseModel):
    id: str
    participant: FriendUser
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    updated_at: datetime


class CreateRoomRequest(BaseModel):
    topic_id: str
    difficulty: str = "medium"
    question_count: int = 10
    time_limit_minutes: int = 15


class RoomParticipant(BaseModel):
    user_id: str
    username: str
    avatar_url: Optional[str] = None
    level: int = 1
    is_ready: bool = False
    score: int = 0
    correct_count: int = 0
    completed: bool = False
    duration_seconds: int = 0


class RoomResponse(BaseModel):
    id: str
    room_code: str
    host_id: str
    topic_name: str
    difficulty: str
    question_count: int
    time_limit_minutes: int
    status: str  # waiting, ready, started, completed, cancelled
    participants: List[RoomParticipant]
    created_at: datetime

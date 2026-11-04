import json
import logging
from typing import Any, Dict, List, Optional
from fastapi import WebSocket

logger = logging.getLogger("quizora.ws")


class ConnectionManager:
    def __init__(self):
        # Maps user_id -> List[WebSocket] (supports multiple tabs)
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Maps room_code -> List[str] user_ids
        self.room_members: Dict[str, List[str]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"WebSocket connected for user {user_id}. Active users: {len(self.active_connections)}")
        # Broadcast presence
        await self.broadcast_presence(user_id, True)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected for user {user_id}. Active users: {len(self.active_connections)}")

    async def send_personal_message(self, user_id: str, message: Dict[str, Any]):
        if user_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    dead_connections.append(connection)
            for dead in dead_connections:
                self.disconnect(user_id, dead)

    async def broadcast_to_room(self, room_code: str, message: Dict[str, Any]):
        members = self.room_members.get(room_code, [])
        for uid in members:
            await self.send_personal_message(uid, message)

    def join_room(self, room_code: str, user_id: str):
        if room_code not in self.room_members:
            self.room_members[room_code] = []
        if user_id not in self.room_members[room_code]:
            self.room_members[room_code].append(user_id)

    def leave_room(self, room_code: str, user_id: str):
        if room_code in self.room_members:
            if user_id in self.room_members[room_code]:
                self.room_members[room_code].remove(user_id)

    async def broadcast_presence(self, user_id: str, is_online: bool):
        payload = {
            "type": "presence_update",
            "user_id": user_id,
            "is_online": is_online
        }
        for uid, conns in list(self.active_connections.items()):
            if uid != user_id:
                for c in conns:
                    try:
                        await c.send_text(json.dumps(payload))
                    except Exception:
                        pass

    def get_online_user_ids(self) -> List[str]:
        return list(self.active_connections.keys())


ws_manager = ConnectionManager()

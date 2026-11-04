from typing import Any, Dict, List, Optional
from bson import ObjectId
from app.core.database import db_manager
from app.services.gamification_service import gamification_service
from app.schemas.gamification_schemas import LeaderboardEntry, LeaderboardResponse


class LeaderboardService:
    def _profiles_col(self):
        return db_manager.get_collection("user_profiles")

    def _users_col(self):
        return db_manager.get_collection("users")

    def _friends_col(self):
        return db_manager.get_collection("friends")

    async def get_leaderboard(
        self,
        current_user_id: Optional[ObjectId] = None,
        period: str = "all_time",
        limit: int = 50,
        skip: int = 0
    ) -> LeaderboardResponse:
        profiles_col = self._profiles_col()
        users_col = self._users_col()

        query: Dict[str, Any] = {}
        if period == "friends" and current_user_id:
            friendships = await self._friends_col().find({
                "$or": [{"user_id_1": current_user_id}, {"user_id_2": current_user_id}]
            }).to_list(100)
            friend_ids = [current_user_id]
            for f in friendships:
                other = f["user_id_2"] if f["user_id_1"] == current_user_id else f["user_id_1"]
                friend_ids.append(other)
            query["user_id"] = {"$in": friend_ids}

        # Sort primarily by ranking coins, then total XP, then accuracy
        profiles = await profiles_col.find(query).sort([
            ("ranking_coins", -1),
            ("total_xp", -1),
            ("average_score", -1)
        ]).skip(skip).limit(limit).to_list(limit)

        total_participants = await profiles_col.count_documents(query)

        entries: List[LeaderboardEntry] = []
        current_user_entry: Optional[LeaderboardEntry] = None

        for idx, p in enumerate(profiles):
            u_id = p["user_id"]
            u = await users_col.find_one({"_id": u_id})
            if not u:
                continue

            lvl, lvl_title = gamification_service.calculate_level(p.get("total_xp", 0))
            is_cur = (str(u_id) == str(current_user_id)) if current_user_id else False

            entry = LeaderboardEntry(
                rank=skip + idx + 1,
                user_id=str(u_id),
                username=u.get("username", "learner"),
                first_name=u.get("first_name", ""),
                last_name=u.get("last_name", ""),
                avatar_url=u.get("avatar_url"),
                level=lvl,
                level_title=lvl_title,
                total_xp=p.get("total_xp", 0),
                ranking_coins=p.get("ranking_coins", 0),
                completed_quizzes=p.get("completed_quizzes_count", 0),
                accuracy_percentage=p.get("average_score", 0.0),
                streak=p.get("current_streak", 1),
                is_current_user=is_cur
            )
            entries.append(entry)

            if is_cur:
                current_user_entry = entry

        podium = entries[:3]

        return LeaderboardResponse(
            period=period,
            podium=podium,
            rankings=entries,
            current_user_entry=current_user_entry,
            total_participants=total_participants
        )


leaderboard_service = LeaderboardService()

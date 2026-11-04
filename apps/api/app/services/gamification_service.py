import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from bson import ObjectId
from app.core.database import db_manager


class GamificationService:
    def _users_col(self):
        return db_manager.get_collection("users")

    def _profiles_col(self):
        return db_manager.get_collection("user_profiles")

    def _transactions_col(self):
        return db_manager.get_collection("ranking_transactions")

    def _xp_transactions_col(self):
        return db_manager.get_collection("xp_transactions")

    def _achievements_col(self):
        return db_manager.get_collection("achievements")

    def _user_achievements_col(self):
        return db_manager.get_collection("user_achievements")

    def _monthly_rewards_col(self):
        return db_manager.get_collection("monthly_rewards")

    def calculate_level(self, total_xp: int) -> Tuple[int, str]:
        """
        Logarithmic progression level calculation.
        """
        if total_xp <= 0:
            return 1, "Beginner"
        level = math.floor(math.isqrt(total_xp // 100)) + 1
        level = max(1, level)

        if level == 1:
            title = "Beginner"
        elif level < 5:
            title = "Learner"
        elif level < 10:
            title = "Explorer"
        elif level < 15:
            title = "Advanced"
        elif level < 20:
            title = "Expert"
        elif level < 30:
            title = "Master"
        else:
            title = "Grand Master"
        return level, title

    async def award_quiz_rewards(
        self,
        user_id: ObjectId,
        attempt_id: ObjectId,
        score_percentage: float,
        correct_count: int,
        difficulty: str
    ) -> Tuple[int, int, bool]:
        """
        Strict server-side reward rules:
        - Exactly 10 ranking coins awarded if and only if score_percentage == 100.0.
        - Idempotent: checks ranking_transactions to prevent double-crediting.
        - XP awarded based on accuracy and question difficulty multiplier.
        """
        profiles = self._profiles_col()
        ranking_tx_col = self._transactions_col()
        xp_tx_col = self._xp_transactions_col()
        now = datetime.now(timezone.utc)

        # Base XP calculation
        diff_multiplier = {
            "very_easy": 1.0,
            "easy": 1.2,
            "medium": 1.5,
            "hard": 2.0,
            "very_hard": 2.5
        }.get(difficulty, 1.0)

        earned_xp = int(correct_count * 15 * diff_multiplier)
        if score_percentage == 100.0:
            earned_xp += 50  # Perfect quiz bonus XP

        earned_coins = 0
        coins_awarded = False

        if score_percentage == 100.0:
            # Check idempotency
            existing_tx = await ranking_tx_col.find_one({
                "attempt_id": attempt_id,
                "source": "perfect_quiz"
            })
            if not existing_tx:
                earned_coins = 10
                coins_awarded = True

                profile = await profiles.find_one({"user_id": user_id})
                current_coins = profile.get("ranking_coins", 0) if profile else 0
                new_balance = current_coins + earned_coins

                tx_doc = {
                    "user_id": user_id,
                    "attempt_id": attempt_id,
                    "amount": earned_coins,
                    "source": "perfect_quiz",
                    "description": "100% Perfect Quiz Completion",
                    "balance_after": new_balance,
                    "created_at": now
                }
                await ranking_tx_col.insert_one(tx_doc)

        # Record XP Transaction
        if earned_xp > 0:
            await xp_tx_col.insert_one({
                "user_id": user_id,
                "attempt_id": attempt_id,
                "amount": earned_xp,
                "source": "quiz_attempt",
                "description": f"Earned from quiz ({correct_count} correct)",
                "created_at": now
            })

        # Update user profile aggregates
        profile = await profiles.find_one({"user_id": user_id})
        if profile:
            new_xp = profile.get("total_xp", 0) + earned_xp
            new_coins = profile.get("ranking_coins", 0) + earned_coins
            new_level, _ = self.calculate_level(new_xp)

            await profiles.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "total_xp": new_xp,
                        "ranking_coins": new_coins,
                        "level": new_level,
                        "updated_at": now
                    }
                }
            )

            # Check and unlock achievements
            await self.check_achievements(user_id)

        return earned_xp, earned_coins, coins_awarded

    async def check_achievements(self, user_id: ObjectId):
        profiles = self._profiles_col()
        achievements_col = self._achievements_col()
        user_achievements_col = self._user_achievements_col()

        profile = await profiles.find_one({"user_id": user_id})
        if not profile:
            return

        quizzes_count = profile.get("completed_quizzes_count", 0)
        correct_count = profile.get("total_correct_answers", 0)
        streak = profile.get("current_streak", 0)
        coins = profile.get("ranking_coins", 0)

        # Achievement unlock checks
        checks = [
            ("first_quiz", quizzes_count >= 1),
            ("quiz_10", quizzes_count >= 10),
            ("correct_100", correct_count >= 100),
            ("streak_7", streak >= 7),
            ("coin_collector", coins >= 100),
            ("perfect_score", coins >= 10),  # at least one perfect quiz completed
        ]

        now = datetime.now(timezone.utc)
        for code, condition in checks:
            if condition:
                achievement = await achievements_col.find_one({"code": code})
                if achievement:
                    existing = await user_achievements_col.find_one({
                        "user_id": user_id,
                        "achievement_id": achievement["_id"]
                    })
                    if not existing:
                        await user_achievements_col.insert_one({
                            "user_id": user_id,
                            "achievement_id": achievement["_id"],
                            "code": code,
                            "unlocked_at": now
                        })
                        # Award achievement bonus XP
                        if achievement.get("xp_reward", 0) > 0:
                            await profiles.update_one(
                                {"user_id": user_id},
                                {"$inc": {"total_xp": achievement["xp_reward"]}}
                            )

    async def process_monthly_champions(self, month_year_str: str) -> Optional[Dict[str, Any]]:
        """
        End of month automated podium awarding:
        Identifies top 3, awards 1st place 'Clever' (5 stars) + 900 bonus coins.
        Idempotent: runs strictly once per month_year_str.
        """
        monthly_col = self._monthly_rewards_col()
        existing = await monthly_col.find_one({"month_year": month_year_str})
        if existing:
            return existing

        profiles_col = self._profiles_col()
        users_col = self._users_col()
        ranking_tx_col = self._transactions_col()

        # Aggregate top 3 by ranking coins and total XP
        top_profiles = await profiles_col.find({}).sort([
            ("ranking_coins", -1),
            ("total_xp", -1)
        ]).limit(3).to_list(3)

        if not top_profiles:
            return None

        first_user = await users_col.find_one({"_id": top_profiles[0]["user_id"]})
        second_user = await users_col.find_one({"_id": top_profiles[1]["user_id"]}) if len(top_profiles) > 1 else None
        third_user = await users_col.find_one({"_id": top_profiles[2]["user_id"]}) if len(top_profiles) > 2 else None

        now = datetime.now(timezone.utc)

        # Award 900 coins to 1st place
        if first_user:
            first_user_id = first_user["_id"]
            bonus_coins = 900
            current_coins = top_profiles[0].get("ranking_coins", 0)
            new_balance = current_coins + bonus_coins

            await profiles_col.update_one(
                {"user_id": first_user_id},
                {"$inc": {"ranking_coins": bonus_coins}}
            )

            await ranking_tx_col.insert_one({
                "user_id": first_user_id,
                "amount": bonus_coins,
                "source": "monthly_first_place",
                "description": f"Monthly Champion ({month_year_str}) — 'Clever' 5-Star Award",
                "balance_after": new_balance,
                "created_at": now
            })

        record = {
            "month_year": month_year_str,
            "first_place_user": first_user.get("username", "Champion") if first_user else "N/A",
            "first_place_avatar": first_user.get("avatar_url") if first_user else None,
            "first_place_bonus_coins": 900,
            "first_place_achievement": "Clever",
            "first_place_stars": 5,
            "second_place_user": second_user.get("username", "Runner-Up") if second_user else "N/A",
            "third_place_user": third_user.get("username", "3rd Place") if third_user else "N/A",
            "distributed_at": now
        }
        await monthly_col.insert_one(record)
        return record


gamification_service = GamificationService()

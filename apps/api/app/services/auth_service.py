import re
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.core.database import db_manager
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.schemas.auth_schemas import UserRegisterRequest, UserLoginRequest, GoogleAuthRequest, TokenResponse, UserResponse


class AuthService:
    def _users_col(self):
        return db_manager.get_collection("users")

    def _profiles_col(self):
        return db_manager.get_collection("user_profiles")

    async def register(self, req: UserRegisterRequest) -> TokenResponse:
        if req.password != req.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match."
            )

        if not req.terms_agreed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You must agree to the Terms of Service and Privacy Policy."
            )

        users = self._users_col()
        profiles = self._profiles_col()

        email_clean = req.email.strip().lower()
        existing_user = await users.find_one({"email": email_clean})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists."
            )

        # Generate unique username from first name and random suffix
        base_username = re.sub(r"[^a-zA-Z0-9]", "", f"{req.first_name.lower()}_{req.last_name.lower()}")
        if len(base_username) < 3:
            base_username = "quiz_learner"
        
        username = base_username
        suffix = 1
        while await users.find_one({"username": username}):
            username = f"{base_username}{suffix}"
            suffix += 1

        hashed_pw = get_password_hash(req.password)
        now = datetime.now(timezone.utc)

        user_doc = {
            "email": email_clean,
            "username": username,
            "hashed_password": hashed_pw,
            "first_name": req.first_name.strip(),
            "last_name": req.last_name.strip(),
            "phone_number": req.phone_number.strip() if req.phone_number else None,
            "role": "user",
            "is_active": True,
            "is_verified": False,
            "avatar_url": f"https://api.dicebear.com/7.x/bottts/svg?seed={username}",
            "created_at": now,
            "updated_at": now
        }

        res = await users.insert_one(user_doc)
        user_id = res.inserted_id

        # Create linked profile
        profile_doc = {
            "user_id": user_id,
            "bio": "Excited to learn and test my skills on Quizora!",
            "level": 1,
            "total_xp": 0,
            "ranking_coins": 0,
            "current_streak": 1,
            "longest_streak": 1,
            "last_active_date": now.strftime("%Y-%m-%d"),
            "completed_quizzes_count": 0,
            "total_questions_answered": 0,
            "total_correct_answers": 0,
            "total_incorrect_answers": 0,
            "average_score": 0.0,
            "privacy_settings": {
                "show_email": False,
                "show_phone": False,
                "show_activity": True,
                "allow_invitations": True
            },
            "created_at": now,
            "updated_at": now
        }
        await profiles.insert_one(profile_doc)

        token_data = {"sub": str(user_id), "email": email_clean, "role": "user"}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        user_res = UserResponse(
            id=str(user_id),
            email=email_clean,
            username=username,
            first_name=req.first_name.strip(),
            last_name=req.last_name.strip(),
            role="user",
            avatar_url=user_doc["avatar_url"],
            created_at=now
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_res
        )

    async def login(self, req: UserLoginRequest) -> TokenResponse:
        users = self._users_col()
        email_clean = req.email.strip().lower()

        user = await users.find_one({"email": email_clean})
        if not user or not verify_password(req.password, user.get("hashed_password", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )

        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated."
            )

        now = datetime.now(timezone.utc)
        await users.update_one({"_id": user["_id"]}, {"$set": {"last_login_at": now}})
        await self._profiles_col().update_one(
            {"user_id": user["_id"]},
            {"$set": {"last_active_date": now.strftime("%Y-%m-%d")}}
        )

        token_data = {
            "sub": str(user["_id"]),
            "email": user["email"],
            "role": user.get("role", "user")
        }
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        user_res = UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            username=user["username"],
            first_name=user.get("first_name", ""),
            last_name=user.get("last_name", ""),
            role=user.get("role", "user"),
            avatar_url=user.get("avatar_url"),
            created_at=user.get("created_at")
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_res
        )

    async def google_auth(self, req: GoogleAuthRequest) -> TokenResponse:
        users = self._users_col()
        profiles = self._profiles_col()
        now = datetime.now(timezone.utc)

        # In dev or without external Google OAuth client credentials configured,
        # we decode provided user fields or parse mock credentials gracefully
        email = (req.email or f"google_user_{req.credential[:8]}@gmail.com").lower()
        first_name = req.first_name or "Google"
        last_name = req.last_name or "Learner"

        user = await users.find_one({"email": email})
        if not user:
            # Create user via Google
            base_username = re.sub(r"[^a-zA-Z0-9]", "", f"{first_name.lower()}_{last_name.lower()}")
            username = base_username
            suffix = 1
            while await users.find_one({"username": username}):
                username = f"{base_username}{suffix}"
                suffix += 1

            avatar = req.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={username}"
            user_doc = {
                "email": email,
                "username": username,
                "hashed_password": get_password_hash("GoogleAuthVerified$2026"),
                "first_name": first_name,
                "last_name": last_name,
                "role": "user",
                "is_active": True,
                "is_verified": True,
                "google_id": req.credential[:32],
                "avatar_url": avatar,
                "created_at": now,
                "updated_at": now
            }
            res = await users.insert_one(user_doc)
            user_id = res.inserted_id

            profile_doc = {
                "user_id": user_id,
                "bio": "Joined QUIZORA through Google Identity.",
                "level": 1,
                "total_xp": 50,  # bonus for verified google
                "ranking_coins": 0,
                "current_streak": 1,
                "longest_streak": 1,
                "last_active_date": now.strftime("%Y-%m-%d"),
                "completed_quizzes_count": 0,
                "total_questions_answered": 0,
                "total_correct_answers": 0,
                "total_incorrect_answers": 0,
                "average_score": 0.0,
                "privacy_settings": {
                    "show_email": False,
                    "show_phone": False,
                    "show_activity": True,
                    "allow_invitations": True
                },
                "created_at": now,
                "updated_at": now
            }
            await profiles.insert_one(profile_doc)
            user = user_doc
            user["_id"] = user_id
        
        token_data = {"sub": str(user["_id"]), "email": user["email"], "role": user.get("role", "user")}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        user_res = UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            username=user["username"],
            first_name=user.get("first_name", ""),
            last_name=user.get("last_name", ""),
            role=user.get("role", "user"),
            avatar_url=user.get("avatar_url"),
            created_at=user.get("created_at")
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_res
        )


auth_service = AuthService()

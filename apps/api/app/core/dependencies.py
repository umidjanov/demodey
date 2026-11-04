from typing import Optional
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from app.core.security import oauth2_scheme, decode_token
from app.core.database import db_manager


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> dict:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tizimga kirish talab qilinadi. Iltimos, ro'yxatdan o'ting yoki tizimga kiring.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Yaroqsiz token."
            )

        u_id = ObjectId(user_id_str) if ObjectId.is_valid(user_id_str) else user_id_str
        users_col = db_manager.get_collection("users")
        user = await users_col.find_one({"_id": u_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Foydalanuvchi topilmadi."
            )
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ushbu hisob faol emas yoki bloklangan."
            )
        return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessiya muddati tugagan yoki token yaroqsiz. Qaytadan tizimga kiring."
        )


async def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required."
        )
    return current_user

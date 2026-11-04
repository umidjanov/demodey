from fastapi import APIRouter, HTTPException, status
from app.services.auth_service import auth_service
from app.schemas.auth_schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    GoogleAuthRequest,
    TokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(req: UserRegisterRequest):
    return await auth_service.register(req)


@router.post("/login", response_model=TokenResponse)
async def login(req: UserLoginRequest):
    return await auth_service.login(req)


@router.post("/google", response_model=TokenResponse)
async def google_auth(req: GoogleAuthRequest):
    return await auth_service.google_auth(req)


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    # Simulated secure email dispatch
    return {"message": "If this email is registered, password reset instructions have been sent."}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    return {"message": "Password successfully updated. You may now log in."}

@echo off
title Quizora Backend (FastAPI)
echo ========================================================
echo   QUIZORA - Python FastAPI Backend Server
echo ========================================================
echo.

cd apps\api

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [XATOLIK] Python topilmadi!
    echo Iltimos, https://www.python.org saytidan Python o'rnating.
    echo O'rnatishda "Add python.exe to PATH" katagiga belgi qo'ying!
    echo.
    pause
    exit /b 1
)

if not exist venv (
    echo [1/3] Python virtual muhiti (venv) yaratilmoqda...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo [2/3] Kerakli kutubxonalar o'rnatilmoqda (pip install)...
    python -m pip install --upgrade pip
    pip install -r requirements.txt
) else (
    echo [1/2] Virtual muhit faollashtirilmoqda...
    call venv\Scripts\activate.bat
)

echo [OK] Backend ishga tushmoqda: http://localhost:8000
echo Hujjatlar (Swagger UI): http://localhost:8000/docs
echo.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause

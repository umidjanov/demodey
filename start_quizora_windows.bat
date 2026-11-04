@echo off
title QUIZORA - Windows Launcher
color 0B
echo ===================================================================
echo     QUIZORA - AI-Powered Learning & Quiz SaaS (Windows Launcher)
echo ===================================================================
echo.
echo Loyiha Windows tizimida bir zumda ishga tushirilmoqda...
echo.

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [XATOLIK] Python topilmadi!
    echo Iltimos, https://www.python.org saytidan Python o'rnating.
    echo O'rnatishda "Add python.exe to PATH" katagiga belgi qo'ying!
    echo.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [XATOLIK] Node.js yoki npm topilmadi!
    echo Iltimos, https://nodejs.org saytidan Node.js (LTS) o'rnating.
    echo O'rnatgach, kompyuterni yoki ushbu oynani qayta oching.
    echo.
    pause
    exit /b 1
)

echo 1. Backend server ochilmoqda (Port 8000)...
start "Quizora Backend (FastAPI)" cmd /k "run_backend.bat"

timeout /t 3 /nobreak >nul

echo 2. Frontend web ilova ochilmoqda (Port 3000)...
start "Quizora Frontend (Next.js)" cmd /k "run_frontend.bat"

timeout /t 4 /nobreak >nul

echo.
echo ===================================================================
echo   BARCHA SERVERLAR MUVAFFAQIYATLI ISHGA TUSHDI!
echo.
echo   Frontend (Sayt):       http://localhost:3000
echo   Backend API (Swagger): http://localhost:8000/docs
echo.
echo   Admin Login:           admin@quizora.com
echo   Admin Parol:           Admin123!
echo ===================================================================
echo.
echo Brauzerda http://localhost:3000 sahifasini ochishingiz mumkin.
echo Ushbu oynani yopishingiz mumkin.
pause

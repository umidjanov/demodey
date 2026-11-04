@echo off
title Quizora Frontend (Next.js)
echo ========================================================
echo   QUIZORA - Next.js Web Frontend Server
echo ========================================================
echo.

cd apps\web

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [XATOLIK] Node.js yoki npm topilmadi!
    echo Iltimos, https://nodejs.org saytidan Node.js (LTS) o'rnating.
    echo O'rnatgach, terminalni qayta oching.
    echo.
    pause
    exit /b 1
)

if not exist node_modules (
    echo [1/2] Node kutubxonalari o'rnatilmoqda (npm install)...
    call npm install
)

echo [OK] Next.js dev server ishga tushmoqda: http://localhost:3000
echo.
call npm run dev

pause

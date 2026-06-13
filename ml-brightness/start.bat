@echo off
title BrightML Launcher
color 0A

echo.
echo  ██████╗ ██████╗ ██╗ ██████╗ ██╗  ██╗████████╗███╗   ███╗██╗
echo  ██╔══██╗██╔══██╗██║██╔════╝ ██║  ██║╚══██╔══╝████╗ ████║██║
echo  ██████╔╝██████╔╝██║██║  ███╗███████║   ██║   ██╔████╔██║██║
echo  ██╔══██╗██╔══██╗██║██║   ██║██╔══██║   ██║   ██║╚██╔╝██║██║
echo  ██████╔╝██║  ██║██║╚██████╔╝██║  ██║   ██║   ██║ ╚═╝ ██║███████╗
echo  ╚═════╝ ╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚═╝╚══════╝
echo.
echo  Intelligent Brightness Control System
echo  ----------------------------------------
echo.

:: ── Check .env exists ────────────────────────────────────────
if not exist "%~dp0ml\.env" (
    echo  [WARN] ml\.env not found — copying from .env.example
    copy "%~dp0ml\.env.example" "%~dp0ml\.env" >nul
    echo  [INFO] Edit ml-brightness\ml\.env and set your CITY, then re-run.
    pause
    exit /b
)

:: ── Check model exists ────────────────────────────────────────
if not exist "%~dp0ml\model\best_model.pkl" (
    echo  [INFO] No trained model found. Running preprocess + train...
    echo.
    cd /d "%~dp0ml"
    python preprocess.py
    if errorlevel 1 ( echo  [ERROR] preprocess.py failed. & pause & exit /b )
    python train.py
    if errorlevel 1 ( echo  [ERROR] train.py failed. & pause & exit /b )    
    echo.
    echo  [OK] Model trained successfully.
    echo.
)

:: ── Start FastAPI server ──────────────────────────────────────
echo  [1/3] Starting FastAPI inference server on port 8000...
start "BrightML - FastAPI" cmd /k "cd /d "%~dp0ml" && uvicorn inference:app --host 127.0.0.1 --port 8000"
timeout /t 2 /nobreak >nul

:: ── Start brightness worker ───────────────────────────────────
echo  [2/3] Starting brightness worker on port 7777...
start "BrightML - Brightness Worker" cmd /k "cd /d "%~dp0brightness-worker" && npm start"
timeout /t 2 /nobreak >nul

:: ── Start React dashboard ─────────────────────────────────────
echo  [3/3] Starting React dashboard on port 5174...
start "BrightML - Dashboard" cmd /k "cd /d "%~dp0client" && npm run dev"
timeout /t 3 /nobreak >nul

:: ── Open browser ─────────────────────────────────────────────
echo.
echo  [OK] All services started.
echo.
echo  Dashboard  →  http://localhost:5174
echo  FastAPI    →  http://127.0.0.1:8000
echo  Worker     →  http://127.0.0.1:7777
echo.
echo  Opening dashboard in browser...
start http://localhost:5174

echo.
echo  Press any key to close this launcher (services keep running).
pause >nul

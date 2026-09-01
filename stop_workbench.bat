@echo off
setlocal EnableDelayedExpansion
title Sovereign AI Workbench - Shutdown
color 0C

set "BACKEND_PORT=8000"
set "FRONTEND_PORT=3000"

echo.
echo ============================================================
echo   SOVEREIGN AI WORKBENCH — SAFE SHUTDOWN
echo ============================================================
echo.

:: 1. Stop Frontend on Port 3000
echo [1/3] Checking frontend on port %FRONTEND_PORT%...
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr /R /C:" 127.0.0.1:%FRONTEND_PORT% " /C:" 0.0.0.0:%FRONTEND_PORT% " 2^>nul') do (
    if not "%%a"=="" if not "%%a"=="0" (
        echo   [..] Stopping frontend process (PID: %%a)...
        taskkill /PID %%a /T /F >nul 2>&1
    )
)
echo   [OK] Frontend stopped.

:: 2. Stop Backend on Port 8000
echo [2/3] Checking backend on port %BACKEND_PORT%...
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr /R /C:" 127.0.0.1:%BACKEND_PORT% " /C:" 0.0.0.0:%BACKEND_PORT% " 2^>nul') do (
    if not "%%a"=="" if not "%%a"=="0" (
        echo   [..] Stopping backend process (PID: %%a)...
        taskkill /PID %%a /T /F >nul 2>&1
    )
)
echo   [OK] Backend stopped.

:: 3. Ollama Status
echo [3/3] Ollama server status...
python -c "import socket; s=socket.socket(); res=s.connect_ex(('127.0.0.1', 11434)); s.close(); exit(0 if res==0 else 1)" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo   [OK] Ollama is running in background (system service).
) else (
    echo   [--] Ollama is stopped.
)

echo.
echo ============================================================
echo   SHUTDOWN COMPLETE
echo   All Workbench processes on ports 3000 and 8000 are closed.
echo.
echo   To restart anytime: run start_workbench.bat
echo ============================================================
echo.
timeout /t 3 /nobreak >nul

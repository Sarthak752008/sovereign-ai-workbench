@echo off
setlocal EnableDelayedExpansion
title Sovereign AI Workbench - Startup
color 0B

set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"
set "BACKEND_PORT=8000"
set "FRONTEND_PORT=3000"
set "OLLAMA_PORT=11434"

echo.
echo ============================================================
echo   SOVEREIGN AI WORKBENCH - ONE-CLICK STARTUP
echo ============================================================
echo.

:: ---- 1. CHECK PREREQUISITES ----
echo [1/5] Checking prerequisites...

where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [FAIL] Python not found. Install Python 3.10+ from https://python.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version 2^>^&1') do echo   [OK] %%i

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [FAIL] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version 2^>^&1') do echo   [OK] Node.js %%i

where ollama >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [FAIL] Ollama not found. Install from https://ollama.ai
    pause
    exit /b 1
)
echo   [OK] Ollama installed
echo.

:: ---- 2. CHECK / START OLLAMA ----
echo [2/5] Checking Ollama service (port %OLLAMA_PORT%)...

python -c "import socket; s=socket.socket(); res=s.connect_ex(('127.0.0.1', %OLLAMA_PORT%)); s.close(); exit(0 if res==0 else 1)" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo   [OK] Ollama is already running on port %OLLAMA_PORT%
) else (
    echo   [INFO] Starting Ollama server...
    start "Ollama-Service" /MIN cmd /c "ollama serve"
    python -c "import time; time.sleep(3)"
    python -c "import socket; s=socket.socket(); res=s.connect_ex(('127.0.0.1', %OLLAMA_PORT%)); s.close(); exit(0 if res==0 else 1)" >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo   [OK] Ollama started successfully on port %OLLAMA_PORT%
    ) else (
        echo   [WARN] Ollama starting in background. Verify with: ollama list
    )
)

for /f "tokens=*" %%i in ('ollama list 2^>nul ^| findstr /V "NAME"') do (
    echo   [OK] Available model: %%i
)
echo.

:: ---- 3. CHECK / START BACKEND ----
echo [3/5] Checking backend server (port %BACKEND_PORT%)...

python -c "import socket; s=socket.socket(); res=s.connect_ex(('127.0.0.1', %BACKEND_PORT%)); s.close(); exit(0 if res==0 else 1)" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo   [OK] Backend is already running on http://localhost:%BACKEND_PORT%
) else (
    echo   [INFO] Starting backend server on http://localhost:%BACKEND_PORT%
    start "SovereignAI-Backend" cmd /k "cd /d "%BACKEND_DIR%" && title SovereignAI-Backend && python -m uvicorn app.main:app --host 0.0.0.0 --port %BACKEND_PORT% --reload"
    
    echo   [INFO] Waiting for backend to initialize...
    set "BACKEND_READY=0"
    for /L %%i in (1,1,20) do (
        if "!BACKEND_READY!"=="0" (
            python -c "import time; time.sleep(1)"
            python -c "import socket; s=socket.socket(); res=s.connect_ex(('127.0.0.1', %BACKEND_PORT%)); s.close(); exit(0 if res==0 else 1)" >nul 2>&1
            if !ERRORLEVEL% equ 0 (
                set "BACKEND_READY=1"
                echo   [OK] Backend is up and healthy on http://localhost:%BACKEND_PORT%
            )
        )
    )
    if "!BACKEND_READY!"=="0" (
        echo   [WARN] Backend is taking longer than usual. Check the SovereignAI-Backend terminal window.
    )
)
echo.

:: ---- 4. CHECK / START FRONTEND ----
echo [4/5] Checking frontend UI (port %FRONTEND_PORT%)...

python -c "import socket; s=socket.socket(); res=s.connect_ex(('127.0.0.1', %FRONTEND_PORT%)); s.close(); exit(0 if res==0 else 1)" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo   [OK] Frontend is already running on http://localhost:%FRONTEND_PORT%
) else (
    if not exist "%FRONTEND_DIR%\node_modules" (
        echo   [INFO] Installing npm packages...
        pushd "%FRONTEND_DIR%"
        call npm install
        popd
    )
    echo   [INFO] Starting frontend server on http://localhost:%FRONTEND_PORT%
    start "SovereignAI-Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && title SovereignAI-Frontend && npm run dev"
    
    echo   [INFO] Waiting for frontend to initialize...
    set "FRONTEND_READY=0"
    for /L %%i in (1,1,15) do (
        if "!FRONTEND_READY!"=="0" (
            python -c "import time; time.sleep(1)"
            python -c "import socket; s=socket.socket(); res=s.connect_ex(('127.0.0.1', %FRONTEND_PORT%)); s.close(); exit(0 if res==0 else 1)" >nul 2>&1
            if !ERRORLEVEL% equ 0 (
                set "FRONTEND_READY=1"
                echo   [OK] Frontend is up on http://localhost:%FRONTEND_PORT%
            )
        )
    )
)
echo.

:: ---- 5. FINAL STATUS & OPEN BROWSER ----
echo [5/5] Launching Sovereign AI Workbench...
echo.
echo ============================================================
echo   SOVEREIGN AI WORKBENCH - ALL SERVICES ACTIVE
echo ============================================================
echo.
echo   Frontend UI:   http://localhost:%FRONTEND_PORT%
echo   Backend API:   http://localhost:%BACKEND_PORT%
echo   API Docs:      http://localhost:%BACKEND_PORT%/docs
echo   Health Check:  http://localhost:%BACKEND_PORT%/api/v1/system/health
echo   Ollama Engine: http://127.0.0.1:%OLLAMA_PORT%
echo.
echo   To stop all services: run stop_workbench.bat
echo ============================================================
echo.

python -c "import time; time.sleep(2)"
start http://localhost:%FRONTEND_PORT%

echo Workbench opened in your browser.
echo You can minimize this window or close it when done.

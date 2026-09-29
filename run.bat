@echo off
echo ===================================================
echo Starting Koinexa Full-Stack Educational Platform
echo ===================================================

set PYTHON_EXE="d:\my projects\quzzify\.venv\Scripts\python.exe"
if not exist %PYTHON_EXE% (
    set PYTHON_EXE="python"
)

start "Koinexa Backend API [Port 5001]" cmd /k "cd backend && %PYTHON_EXE% app.py"
start "Koinexa Frontend Client [Port 5174]" cmd /k "cd frontend && npm run dev"

echo Both services launched!
echo Frontend: http://localhost:5174
echo Backend:  http://127.0.0.1:5001
echo ===================================================

@echo off
title YEN Homestay - CLIP Visual Search AI Service
cd /d "%~dp0"

chcp 65001 >nul
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1
set HF_HUB_DISABLE_SYMLINKS_WARNING=1

:: Tim duong dan Python chinh xac co chua thu vien
set "PYTHON_EXE=python"
if exist "%~dp0..\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0..\.venv\Scripts\python.exe"
) else if exist "C:\Users\admin\AppData\Local\Programs\Python\Python313\python.exe" (
    set "PYTHON_EXE=C:\Users\admin\AppData\Local\Programs\Python\Python313\python.exe"
)

echo ============================================================
echo   KHOI DONG AI MICROSERVICE TIM KIEM ANH (PORT 8000)
echo   Python: %PYTHON_EXE%
echo ============================================================

echo 1. Dang kiem tra va cai dat dependencies...
"%PYTHON_EXE%" -m pip install -r requirements.txt

echo.
echo 2. Dang khoi chay FastAPI Server tai http://localhost:8000...
"%PYTHON_EXE%" main.py
pause

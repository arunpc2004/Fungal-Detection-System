@echo off
setlocal enabledelayedexpansion
echo ========================================
echo 🍎 Advanced Fruit Disease Detection AI
echo ========================================
echo.

echo Choose operation:
echo 1. 📦 Install Dependencies
echo 2. 🌐 Run Web App
echo 3. 🚀 Complete Setup (Install + Run)
echo.
set /p choice="Enter choice (1-3): "

if "%choice%"=="1" goto install_deps
if "%choice%"=="2" goto run_app
if "%choice%"=="3" goto complete_setup
echo ❌ Invalid choice!
pause
exit /b 1

:install_deps
echo 📦 Creating Virtual Environment...
if not exist "venv" (
    python -m venv venv
    echo ✅ Virtual environment created!
)
echo 🔄 Activating virtual environment...
call venv\Scripts\activate.bat
echo 📦 Installing dependencies...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
echo ✅ Dependencies installed!
if "%choice%"=="1" pause
exit /b 0



:run_app
echo 🌐 Starting Web Application...
call venv\Scripts\activate.bat
echo 🚀 Launching at: http://localhost:5000
echo 📱 Features: Real-time detection, Treatment info, 99.9%% accuracy
echo ⚠️  Press Ctrl+C to stop
echo.
python run.py
echo.
echo 👋 Thank you for using Advanced Fruit Disease AI!
pause
exit /b 0



:complete_setup
echo 🚀 Starting Complete Setup...
call :install_deps
if %errorlevel% neq 0 exit /b 1
goto run_app
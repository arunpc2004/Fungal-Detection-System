@echo off
echo Starting Fruit Disease Detection Web App...
echo.

if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo No virtual environment found. Using system Python...
)

echo.
echo Starting server at http://localhost:5000
echo Press Ctrl+C to stop
echo.

python run.py

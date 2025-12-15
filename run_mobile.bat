@echo off
echo Starting Fruit Disease Detection Web App for Mobile Access...
echo.

if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo No virtual environment found. Using system Python...
)

echo.
echo Getting local IP address...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /R /C:"IPv4 Address"') do (
    set LOCAL_IP=%%i
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP:~1%

echo.
echo Server will be accessible at:
echo Local: http://localhost:5000
echo Mobile/Network: http://%LOCAL_IP%:5000
echo.
echo Make sure your mobile device is connected to the same Wi-Fi network.
echo Press Ctrl+C to stop the server.
echo.

python run.py

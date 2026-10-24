@echo off
echo ====================================================
echo  Setting up NSWS Sugar Mill ERP Platform
echo ====================================================
echo.

echo [1/2] Installing Backend Dependencies...
cd /d "%~dp0backend"
call npm install
if %ERRORLEVEL% neq 0 (
    echo Error installing backend dependencies!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Installing Frontend Dependencies...
cd /d "%~dp0frontend"
call npm install
if %ERRORLEVEL% neq 0 (
    echo Error installing frontend dependencies!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ====================================================
echo  Setup Completed Successfully!
echo  Run start-all.bat to start both servers.
echo ====================================================
pause

@echo off
title NSWS Platform Launcher
echo ====================================================
echo  Launching NSWS Sugar Mill ERP Platform
echo ====================================================
echo.
echo Launching Backend Server on port 5000...
start "NSWS Backend API" cmd /k "cd /d "%~dp0backend" && npm start"

timeout /t 3 /nobreak >nul

echo Launching Frontend Dev Server on port 3000...
start "NSWS Frontend App" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers have been launched in separate windows!
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:3000
echo.
timeout /t 5 >nul

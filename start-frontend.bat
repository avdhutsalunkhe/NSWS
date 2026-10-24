@echo off
title NSWS Frontend Dev Server
cd /d "%~dp0frontend"
echo Starting NSWS Frontend Dev Server on port 3000...
npm run dev
pause

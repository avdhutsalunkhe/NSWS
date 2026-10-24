@echo off
title NSWS Backend Server
cd /d "%~dp0backend"
echo Starting NSWS Backend API Server on port 5000...
npm start
pause

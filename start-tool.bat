@echo off
title Sunwin Tool
cd /d "%~dp0"

echo Starting tool...
start "Sunwin Tool" cmd /k "cd /d %~dp0 && node src/main.js"

timeout /t 5 /nobreak >nul

start http://localhost:3001

exit
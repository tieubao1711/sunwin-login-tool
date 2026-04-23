@echo off
title Sunwin Tool - Start All
cd /d "%~dp0"

echo Starting backend...
start "Sunwin Backend" cmd /k "cd /d %~dp0 && node src/main.js"

timeout /t 3 /nobreak >nul

if exist dashboard (
  echo Starting dashboard...
  start "Sunwin Dashboard" cmd /k "cd /d %~dp0dashboard && npm run dev"
)

timeout /t 5 /nobreak >nul

start http://localhost:5173

exit
@echo off
title Sunwin Tool - Start All
cd /d "%~dp0"

echo Starting backend...
start "Sunwin Backend" cmd /k "cd /d %~dp0 && node src/main.js"

timeout /t 2 /nobreak >nul

echo Starting Node Sunwin...
start "Node Sunwin" cmd /k "cd /d %~dp0nodesunwin && node server.js"

timeout /t 3 /nobreak >nul

if exist dashboard (
  echo Starting dashboard...
  start "Sunwin Dashboard" cmd /k "cd /d %~dp0dashboard && npm run dev"
)

exit
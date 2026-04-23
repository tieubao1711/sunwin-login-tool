@echo off
title Sunwin Tool - Install Dependencies
cd /d "%~dp0"

echo =============================
echo Installing backend dependencies...
echo =============================
call npm install
if errorlevel 1 (
  echo Backend npm install failed
  pause
  exit /b 1
)

if exist dashboard (
  echo =============================
  echo Installing dashboard dependencies...
  echo =============================
  cd dashboard
  call npm install
  if errorlevel 1 (
    echo Dashboard npm install failed
    pause
    exit /b 1
  )
  cd ..
)

echo =============================
echo Install completed successfully
echo =============================
pause
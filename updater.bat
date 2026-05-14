@echo off
setlocal enabledelayedexpansion
title Sunwin Tool - Updater
cd /d "%~dp0"

echo =============================
echo Sunwin Tool Updater
echo =============================
echo Folder: %CD%
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo Git is not installed or not available in PATH.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or not available in PATH.
  pause
  exit /b 1
)

call :update_git_repo "%CD%" "main tool"
if errorlevel 1 exit /b 1

if exist "nodesunwin\.git" (
  call :update_git_repo "%CD%\nodesunwin" "nodesunwin"
  if errorlevel 1 exit /b 1
) else (
  echo nodesunwin is not a git repo, skipping git update for nodesunwin.
)

echo.
echo =============================
echo Installing dependencies
echo =============================

call :npm_install "%CD%" "main tool"
if errorlevel 1 exit /b 1

if exist "nodesunwin\package.json" (
  call :npm_install "%CD%\nodesunwin" "nodesunwin"
  if errorlevel 1 exit /b 1
)

if exist "dashboard\package.json" (
  call :npm_install "%CD%\dashboard" "dashboard"
  if errorlevel 1 exit /b 1
)

echo.
echo =============================
echo Update completed successfully
echo =============================
echo You can now run start-all.bat
pause
exit /b 0

:update_git_repo
set "REPO_DIR=%~1"
set "REPO_NAME=%~2"

echo.
echo =============================
echo Updating %REPO_NAME%
echo =============================
cd /d "%REPO_DIR%"

git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 (
  echo %REPO_NAME% is not inside a git work tree.
  exit /b 1
)

for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD') do set "BRANCH=%%b"
if "%BRANCH%"=="HEAD" (
  echo %REPO_NAME% is on detached HEAD. Please checkout a branch first.
  exit /b 1
)

git remote get-url origin >nul 2>nul
if errorlevel 1 (
  echo %REPO_NAME% has no origin remote configured.
  exit /b 1
)

git fetch origin
if errorlevel 1 (
  echo Failed to fetch latest code for %REPO_NAME%.
  exit /b 1
)

git pull --ff-only origin "%BRANCH%"
if errorlevel 1 (
  echo Failed to update %REPO_NAME%.
  echo Make sure there are no local tracked changes, then run this updater again.
  exit /b 1
)

exit /b 0

:npm_install
set "APP_DIR=%~1"
set "APP_NAME=%~2"

echo.
echo Installing %APP_NAME% dependencies...
cd /d "%APP_DIR%"
call npm install
if errorlevel 1 (
  echo npm install failed for %APP_NAME%.
  exit /b 1
)

exit /b 0

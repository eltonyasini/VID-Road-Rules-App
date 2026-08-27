@echo off
title VID Road Rules Practice

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed.
  echo Install Node.js 22.13 or newer from https://nodejs.org/
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing the app packages. This can take a few minutes...
  call npm install
  if errorlevel 1 (
    echo Installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

echo Starting VID Road Rules Practice...
echo Open the local address shown below in your browser.
call npm run dev
pause


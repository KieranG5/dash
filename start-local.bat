@echo off
setlocal
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js and npm are required.
  echo Download Node.js from https://nodejs.org/
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing QuantDash dependencies...
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)

echo Starting QuantDash...
start "" http://localhost:3000
call npm run dev

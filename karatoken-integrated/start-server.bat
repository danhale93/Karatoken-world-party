@echo off
echo Starting Karatoken Server...
cd /d "%~dp0"
node "%~dp0simple-http-server.js"
pause

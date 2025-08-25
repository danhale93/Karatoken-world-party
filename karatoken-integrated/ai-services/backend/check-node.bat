@echo off
echo Checking Node.js installation...
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Node.js is installed and in PATH.
    node -v
) else (
    echo Node.js is not found in PATH.
    echo Checking common installation locations...
    if exist "C:\Program Files\nodejs\node.exe" (
        echo Node.js found at C:\Program Files\nodejs\node.exe
        "C:\Program Files\nodejs\node.exe" -v
    ) else if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
        echo Node.js found at %%LOCALAPPDATA%%\Programs\nodejs\node.exe
        "%LOCALAPPDATA%\Programs\nodejs\node.exe" -v
    ) else (
        echo Node.js not found in common locations.
    )
)
pause

@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

echo.
echo ====================================================
echo  🚀 Setting up Karatoken World Party development environment
echo ====================================================
echo.

:: Check for required tools
echo Checking for required tools...
echo.

:: Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ and try again.
    exit /b 1
) else (
    for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
    echo ✅ Found Node.js !NODE_VERSION!
)

:: Check for Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ and try again.
    exit /b 1
) else (
    for /f "tokens=*" %%v in ('python --version') do set PYTHON_VERSION=%%v
    echo ✅ Found !PYTHON_VERSION!
)

:: Check for pip
where pip >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ pip is not installed. Please install pip and try again.
    exit /b 1
) else (
    for /f "tokens=*" %%v in ('pip --version ^| findstr /i "python"') do set PIP_VERSION=%%v
    echo ✅ Found pip: !PIP_VERSION!
)

:: Check for Git
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git is not installed. Please install Git and try again.
    exit /b 1
) else (
    for /f "tokens=*" %%v in ('git --version') do set GIT_VERSION=%%v
    echo ✅ Found !GIT_VERSION!
)

echo.
echo ====================================================
echo 🤖 Setting up AI Service...
echo ====================================================
echo.

cd ai-services\scoring-service
if not exist "venv\" (
    echo Creating Python virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    echo ✅ AI Service dependencies installed
) else (
    echo ✅ AI Service already set up
)
cd ..\..

echo.
echo ====================================================
echo ⛓️  Setting up Blockchain...
echo ====================================================
echo.

cd blockchain
if not exist "node_modules\" (
    echo Installing Node.js dependencies...
    call npm install
    echo ✅ Blockchain dependencies installed
) else (
    echo ✅ Blockchain dependencies already installed
)

if not exist "artifacts\" (
    echo Compiling smart contracts...
    call npx hardhat compile
    echo ✅ Smart contracts compiled
)
cd ..

echo.
echo ====================================================
echo 📱 Setting up Mobile App...
echo ====================================================
echo.

cd mobile
if not exist "node_modules\" (
    echo Installing Node.js dependencies...
    call npm install
    echo ✅ Mobile app dependencies installed
) else (
    echo ✅ Mobile app dependencies already installed
)
cd ..

echo.
echo ====================================================
echo ✨ Setup complete! You can now start developing Karatoken World Party.
echo ====================================================
echo.
echo To get started, run these commands in separate terminals:
echo 1. AI Service: ^> cd ai-services^\scoring-service ^&^& call venv^\Scripts^\activate.bat ^&^& uvicorn main:app --reload
echo 2. Blockchain: ^> cd blockchain ^&^& npx hardhat node
echo 3. Mobile App: ^> cd mobile ^&^& npm start
echo.

pause

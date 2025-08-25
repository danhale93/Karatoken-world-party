#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Setting up Karatoken World Party development environment...${NC}"

# Check for required tools
echo -e "\n${YELLOW}🔍 Checking for required tools...${NC}"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
else
    echo -e "✅ Found Node.js $(node -v)"
fi

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo -e "❌ Python 3 is not installed. Please install Python 3.8+ and try again."
    exit 1
else
    echo -e "✅ Found Python $(python3 --version)"
fi

# Check for pip
if ! command -v pip3 &> /dev/null; then
    echo -e "❌ pip3 is not installed. Please install pip and try again."
    exit 1
else
    echo -e "✅ Found pip $(pip3 --version | awk '{print $2}')"
fi

# Check for Git
if ! command -v git &> /dev/null; then
    echo -e "❌ Git is not installed. Please install Git and try again."
    exit 1
else
    echo -e "✅ Found Git $(git --version | awk '{print $3}')"
fi

# Setup AI Service
echo -e "\n${YELLOW}🤖 Setting up AI Service...${NC}"
cd ai-services/scoring-service
if [ ! -d "venv" ]; then
    echo -e "Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    echo -e "✅ AI Service dependencies installed"
else
    echo -e "✅ AI Service already set up"
fi
cd ../..

# Setup Blockchain
echo -e "\n${YELLOW}⛓️  Setting up Blockchain...${NC}"
cd blockchain
if [ ! -d "node_modules" ]; then
    echo -e "Installing Node.js dependencies..."
    npm install
    echo -e "✅ Blockchain dependencies installed"
else
    echo -e "✅ Blockchain dependencies already installed"
fi

# Compile contracts
if [ ! -d "artifacts" ]; then
    echo -e "Compiling smart contracts..."
    npx hardhat compile
    echo -e "✅ Smart contracts compiled"
fi
cd ..

# Setup Mobile App
echo -e "\n${YELLOW}📱 Setting up Mobile App...${NC}"
cd mobile
if [ ! -d "node_modules" ]; then
    echo -e "Installing Node.js dependencies..."
    npm install
    echo -e "✅ Mobile app dependencies installed"
else
    echo -e "✅ Mobile app dependencies already installed"
fi
cd ..

echo -e "\n${GREEN}✨ Setup complete! You can now start developing Karatoken World Party.${NC}"
echo -e "\nTo get started, run these commands in separate terminals:"
echo -e "1. ${YELLOW}cd ai-services/scoring-service && source venv/bin/activate && uvicorn main:app --reload${NC}"
echo -e "2. ${YELLOW}cd blockchain && npx hardhat node${NC}"
echo -e "3. ${YELLOW}cd mobile && npm start${NC}"

# Make the script executable
chmod +x setup.sh

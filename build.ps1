# Karatoken Integrated Build Script
# This script helps build the integrated Karatoken project

param(
    [string]$Platform = "all",
    [switch]$Clean,
    [switch]$Test,
    [switch]$Deploy
)

Write-Host "🎤 Karatoken Integrated Build Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to build desktop application
function Invoke-DesktopBuild {
    Write-Host "Building Desktop Application..." -ForegroundColor Yellow
    
    if (Test-Command "lazarus-ide") {
        Write-Host "Using Lazarus IDE for compilation..." -ForegroundColor Cyan
        Set-Location "desktop\src"
        # Note: This would need to be run from Lazarus IDE
        Write-Host "Please open Karatoken.dpr in Lazarus IDE and compile manually" -ForegroundColor Yellow
    } elseif (Test-Command "delphi") {
        Write-Host "Using Delphi for compilation..." -ForegroundColor Cyan
        Set-Location "desktop\src"
        # Note: This would need to be run from Delphi IDE
        Write-Host "Please open Karatoken.dpr in Delphi IDE and compile manually" -ForegroundColor Yellow
    } else {
        Write-Host "Delphi/Lazarus not found. Please install Delphi or Lazarus IDE" -ForegroundColor Red
        return $false
    }
    
    Set-Location "..\.."
    return $true
}

# Function to build mobile application
function Invoke-MobileBuild {
    Write-Host "Building Mobile Application..." -ForegroundColor Yellow
    
    if (-not (Test-Command "npm")) {
        Write-Host "npm not found. Please install Node.js" -ForegroundColor Red
        return $false
    }
    
    Set-Location "mobile"
    
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
    
    if ($Test) {
        Write-Host "Running tests..." -ForegroundColor Cyan
        npm test
    }
    
    if ($Deploy) {
        Write-Host "Building for deployment..." -ForegroundColor Cyan
        Write-Host "For Android: expo build:android" -ForegroundColor Yellow
        Write-Host "For iOS: expo build:ios" -ForegroundColor Yellow
    } else {
        Write-Host "Starting development server..." -ForegroundColor Cyan
        Write-Host "Run 'npm start' to start the development server" -ForegroundColor Yellow
    }
    
    Set-Location ".."
    return $true
}

# Function to build AI services
function Invoke-AIServicesBuild {
    Write-Host "Building AI Services..." -ForegroundColor Yellow
    
    if (-not (Test-Command "npm")) {
        Write-Host "npm not found. Please install Node.js" -ForegroundColor Red
        return $false
    }
    
    Set-Location "ai-services\backend"
    
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
    
    if ($Test) {
        Write-Host "Running tests..." -ForegroundColor Cyan
        npm test
    }
    
    if ($Deploy) {
        Write-Host "Building for deployment..." -ForegroundColor Cyan
        Write-Host "Run 'npm run deploy' to deploy AI services" -ForegroundColor Yellow
    }
    
    Set-Location "..\.."
    return $true
}

# Function to build blockchain contracts
function Invoke-BlockchainBuild {
    Write-Host "Building Blockchain Contracts..." -ForegroundColor Yellow
    
    if (-not (Test-Command "npm")) {
        Write-Host "npm not found. Please install Node.js" -ForegroundColor Red
        return $false
    }
    
    Set-Location "blockchain"
    
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
    
    Write-Host "Compiling smart contracts..." -ForegroundColor Cyan
    if (Test-Command "npx") {
        npx hardhat compile
    } else {
        Write-Host "Hardhat not found. Please install Hardhat" -ForegroundColor Red
        return $false
    }
    
    if ($Test) {
        Write-Host "Running tests..." -ForegroundColor Cyan
        npx hardhat test
    }
    
    if ($Deploy) {
        Write-Host "Deploying contracts..." -ForegroundColor Cyan
        Write-Host "Run 'npx hardhat deploy --network mainnet' to deploy" -ForegroundColor Yellow
    }
    
    Set-Location ".."
    return $true
}

# Function to clean build artifacts
function Invoke-CleanBuild {
    Write-Host "Cleaning build artifacts..." -ForegroundColor Yellow
    
    # Clean mobile
    if (Test-Path "mobile\node_modules") {
        Remove-Item "mobile\node_modules" -Recurse -Force
    }
    
    # Clean AI services
    if (Test-Path "ai-services\backend\node_modules") {
        Remove-Item "ai-services\backend\node_modules" -Recurse -Force
    }
    
    # Clean blockchain
    if (Test-Path "blockchain\node_modules") {
        Remove-Item "blockchain\node_modules" -Recurse -Force
    }
    if (Test-Path "blockchain\cache") {
        Remove-Item "blockchain\cache" -Recurse -Force
    }
    if (Test-Path "blockchain\artifacts") {
        Remove-Item "blockchain\artifacts" -Recurse -Force
    }
    
    Write-Host "Clean completed!" -ForegroundColor Green
}

# Main execution
try {
    if ($Clean) {
        Invoke-CleanBuild
        exit 0
    }
    
    $success = $true
    
    switch ($Platform.ToLower()) {
        "desktop" {
            $success = Invoke-DesktopBuild
        }
        "mobile" {
            $success = Invoke-MobileBuild
        }
        "ai" {
            $success = Invoke-AIServicesBuild
        }
        "blockchain" {
            $success = Invoke-BlockchainBuild
        }
        "all" {
            Write-Host "Building all components..." -ForegroundColor Cyan
            
            $success = $success -and (Invoke-DesktopBuild)
            $success = $success -and (Invoke-MobileBuild)
            $success = $success -and (Invoke-AIServicesBuild)
            $success = $success -and (Invoke-BlockchainBuild)
        }
        default {
            Write-Host "Unknown platform: $Platform" -ForegroundColor Red
            Write-Host "Valid platforms: desktop, mobile, ai, blockchain, all" -ForegroundColor Yellow
            exit 1
        }
    }
    
    if ($success) {
        Write-Host "`n🎉 Build completed successfully!" -ForegroundColor Green
        Write-Host "`nNext steps:" -ForegroundColor Cyan
        Write-Host "1. Desktop: Open Karatoken.dpr in Delphi/Lazarus IDE" -ForegroundColor White
        Write-Host "2. Mobile: Run 'cd mobile && npm start'" -ForegroundColor White
        Write-Host "3. AI Services: Run 'cd ai-services/backend && npm start'" -ForegroundColor White
        Write-Host "4. Blockchain: Deploy contracts with 'cd blockchain && npx hardhat deploy'" -ForegroundColor White
    } else {
        Write-Host "`n❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "`n❌ Error during build: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} 
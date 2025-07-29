# Karatoken Quick Start Guide

## 🚀 Get Started in 5 Minutes

Welcome to Karatoken - the integrated karaoke platform that combines the best of Ultrastar WorldParty with modern blockchain and AI features!

## Prerequisites

- **Node.js** (v16 or higher)
- **Delphi** or **Lazarus IDE** (for desktop development)
- **Git**

## Quick Setup

### 1. Clone and Navigate
```bash
git clone <your-repo-url>
cd karatoken-integrated
```

### 2. Install Dependencies
```bash
# Install mobile dependencies
cd mobile
npm install

# Install AI services dependencies
cd ../ai-services/backend
npm install

# Install blockchain dependencies
cd ../../blockchain
npm install
```

### 3. Start Development

#### Mobile App (Recommended to start here)
```bash
cd mobile
npm start
```
This will start the Expo development server. You can:
- Press `a` for Android
- Press `i` for iOS
- Press `w` for web

#### AI Services
```bash
cd ai-services/backend
npm start
```

#### Desktop App
1. Open `desktop/src/Karatoken.dpr` in Delphi or Lazarus IDE
2. Configure your build settings
3. Compile and run

#### Blockchain (Optional for development)
```bash
cd blockchain
npx hardhat compile
npx hardhat test
```

## 🎯 What You Can Do Now

### Mobile Features
- ✅ Record karaoke performances
- ✅ AI-powered scoring and feedback
- ✅ Earn KRT tokens for performances
- ✅ Social features and leaderboards
- ✅ Real-time duets and battles

### Desktop Features
- ✅ Multi-player karaoke (up to 6 players)
- ✅ Advanced pitch detection
- ✅ Custom themes and avatars
- ✅ Extensive song library
- ✅ Professional karaoke experience

### AI Features
- ✅ AI Genre Swapping
- ✅ AI Scoring Coach
- ✅ Vocal Isolation
- ✅ Performance Analytics

### Blockchain Features
- ✅ KRT token rewards
- ✅ NFT collectibles
- ✅ Royalty system
- ✅ Decentralized governance

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```bash
# Blockchain
ETHEREUM_NETWORK=testnet
CONTRACT_ADDRESS=0x...

# AI Services
OPENAI_API_KEY=your_openai_key
AZURE_SPEECH_KEY=your_azure_key

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Real-time
ZEGO_APP_ID=your_zego_app_id
ZEGO_SERVER_SECRET=your_zego_secret
```

### Mobile Configuration
Update `mobile/app.json`:
```json
{
  "expo": {
    "name": "Karatoken",
    "slug": "karatoken-mobile",
    "version": "1.0.0"
  }
}
```

## 🧪 Testing

### Run All Tests
```bash
# Mobile tests
cd mobile
npm test

# AI services tests
cd ../ai-services/backend
npm test

# Blockchain tests
cd ../../blockchain
npx hardhat test
```

### Integration Tests
```bash
# Cross-platform tests
npm run test:integration
```

## 📱 Building for Production

### Mobile
```bash
cd mobile
expo build:android  # For Android
expo build:ios      # For iOS
```

### Desktop
1. Open `Karatoken.dpr` in Delphi/Lazarus
2. Set build configuration to Release
3. Compile for target platform (Windows/Linux/macOS)

### Blockchain
```bash
cd blockchain
npx hardhat deploy --network mainnet
```

## 🆘 Troubleshooting

### Common Issues

**Mobile app won't start:**
```bash
cd mobile
npm install
npx expo install --fix
```

**AI services connection error:**
- Check your API keys in `.env`
- Ensure the backend is running

**Desktop compilation errors:**
- Verify FFmpeg and SDL2 are properly installed
- Check Delphi/Lazarus configuration

**Blockchain compilation fails:**
```bash
cd blockchain
npm install
npx hardhat clean
npx hardhat compile
```

## 📚 Next Steps

1. **Read the Documentation**: Check out `docs/INTEGRATION_GUIDE.md`
2. **Join the Community**: Visit our GitHub Discussions
3. **Contribute**: Fork the repo and submit a pull request
4. **Report Issues**: Use GitHub Issues for bug reports

## 🎉 You're Ready!

You now have a fully integrated karaoke platform with:
- 🎤 Professional karaoke engine
- 🤖 AI-powered features
- ⛓️ Blockchain integration
- 📱 Cross-platform support
- 🌐 Social features

Start singing and earning KRT tokens! 🎵

## Support

- **Documentation**: [Integration Guide](docs/INTEGRATION_GUIDE.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/karatoken-integrated/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/karatoken-integrated/discussions) 
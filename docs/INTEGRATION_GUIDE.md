# Karatoken Integration Guide

## Overview

Karatoken is an integrated karaoke platform that combines the best features of Ultrastar WorldParty (desktop karaoke game) with modern blockchain technology and AI-powered features from the original Karatoken project.

## Architecture

### Desktop Application (Delphi/Pascal)
- **Base**: Ultrastar WorldParty engine
- **Enhancements**: 
  - Blockchain integration for KRT token rewards
  - AI-powered scoring and feedback
  - Enhanced social features
  - Cross-platform compatibility improvements

### Mobile Application (React Native/Expo)
- **Base**: Original Karatoken mobile app
- **Enhancements**:
  - Integration with desktop karaoke engine
  - Shared song library and scoring system
  - Cross-platform synchronization

### Shared Components
- **Blockchain**: Smart contracts for token rewards and royalties
- **AI Services**: Backend services for AI-powered features
- **Database**: Shared user profiles and performance data

## Key Features

### From Ultrastar WorldParty
1. **Multi-player Support**: Up to 6 players simultaneously
2. **Pitch Detection**: Real-time voice pitch analysis
3. **Rhythm Recognition**: Beat synchronization and scoring
4. **Song Library**: Extensive collection of karaoke songs
5. **Custom Themes**: Multiple visual themes and skins
6. **Avatar System**: Personalized player avatars
7. **Multi-language Support**: Internationalization

### From Karatoken
1. **Blockchain Integration**: KRT token rewards and NFT collectibles
2. **AI-Powered Features**:
   - AI Genre Swapping
   - AI Scoring Coach
   - Vocal Isolation
3. **Social Features**: Performance sharing and competitions
4. **Real-time Collaboration**: Multi-user karaoke sessions

## Development Setup

### Desktop Development
```bash
cd desktop
# Install Delphi/Lazarus IDE
# Open Karatoken.dpr project
# Configure FFmpeg and SDL2 libraries
```

### Mobile Development
```bash
cd mobile
npm install
npm start
```

### AI Services
```bash
cd ai-services/backend
npm install
npm start
```

### Blockchain Development
```bash
cd blockchain
# Install Hardhat/Truffle
npm install
npx hardhat compile
```

## Integration Points

### 1. Song Library Synchronization
- Desktop and mobile apps share the same song database
- Performance scores are synced across platforms
- User preferences and playlists are unified

### 2. Blockchain Integration
- KRT tokens earned on desktop can be used on mobile
- NFT collectibles are accessible across platforms
- Royalty system works seamlessly

### 3. AI Services
- AI scoring coach provides feedback on both platforms
- Genre swapping works with desktop song library
- Vocal isolation enhances recording quality

### 4. Social Features
- Leaderboards show performances from all platforms
- Social feed includes desktop and mobile performances
- Battle system works across platforms

## File Structure

```
karatoken-integrated/
├── desktop/                 # Native desktop application
│   ├── src/                # Delphi/Pascal source code
│   ├── game/               # Game assets and resources
│   └── Karatoken.dpr       # Main application file
├── mobile/                  # React Native mobile app
│   ├── app/                # React Native screens
│   ├── components/         # Reusable components
│   └── package.json        # Dependencies
├── blockchain/              # Smart contracts
│   └── contracts/          # Solidity contracts
├── ai-services/             # AI-powered features
│   └── backend/            # Node.js backend services
├── shared/                  # Shared utilities
├── docs/                    # Documentation
└── assets/                  # Shared assets
```

## Configuration

### Environment Variables
```bash
# Blockchain
ETHEREUM_NETWORK=mainnet
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=...

# AI Services
OPENAI_API_KEY=...
AZURE_SPEECH_KEY=...

# Database
SUPABASE_URL=...
SUPABASE_KEY=...

# Real-time
ZEGO_APP_ID=...
ZEGO_SERVER_SECRET=...
```

### Desktop Configuration
- Update `desktop/src/config.inc` for platform-specific settings
- Configure FFmpeg paths in `desktop/src/switches.inc`
- Set up SDL2 and OpenGL libraries

### Mobile Configuration
- Update `mobile/app.json` for Expo configuration
- Configure deep linking and navigation
- Set up push notifications

## Deployment

### Desktop Build
```bash
cd desktop
# Use Delphi/Lazarus IDE to compile
# Generate Windows/Linux/macOS executables
```

### Mobile Build
```bash
cd mobile
expo build:android
expo build:ios
```

### Blockchain Deployment
```bash
cd blockchain
npx hardhat deploy --network mainnet
```

### AI Services Deployment
```bash
cd ai-services/backend
npm run deploy
```

## Testing

### Unit Tests
```bash
# Desktop
cd desktop
# Use Delphi unit testing framework

# Mobile
cd mobile
npm test

# AI Services
cd ai-services/backend
npm test
```

### Integration Tests
```bash
# Cross-platform synchronization
npm run test:integration

# Blockchain integration
npm run test:blockchain

# AI services
npm run test:ai
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the GNU General Public License v3.0.

## Support

- **Documentation**: [Wiki](https://github.com/your-org/karatoken-integrated/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/karatoken-integrated/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/karatoken-integrated/discussions) 
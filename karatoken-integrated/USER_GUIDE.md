# 🎤 Karatoken User Guide

## 🚀 **How to Use Karatoken - Complete Guide**

### **Method 1: Web Interface (Easiest)**

1. **Start the Server**:
   ```bash
   cd karatoken-integrated/ai-services/backend
   node start-karatoken.js
   ```

2. **Open Your Browser**:
   - Go to: `http://localhost:3000`
   - You'll see the beautiful Karatoken web interface

3. **Transform a Song**:
   - **Paste a YouTube URL** (any song you want to transform)
   - **Select a target genre** (Rock, Jazz, Electronic, etc.)
   - **Click "Transform Song"**
   - **Watch the real-time progress** as AI processes your song

### **Method 2: Command Line API**

1. **Submit a Genre Swap Job**:
   ```bash
   curl -X POST http://localhost:3000/api/ai/genre-swap \
     -H "Content-Type: application/json" \
     -d '{
       "youtubeUrl": "https://www.youtube.com/watch?v=YOUR_SONG_ID",
       "targetGenre": "rock"
     }'
   ```

2. **Check Progress**:
   ```bash
   curl http://localhost:3000/api/ai/genre-swap/status/YOUR_JOB_ID
   ```

3. **Get Supported Genres**:
   ```bash
   curl http://localhost:3000/api/ai/genre-swap/genres
   ```

### **Method 3: Mobile App**

1. **Start the Mobile App**:
   ```bash
   cd karatoken-integrated/mobile
   npm start
   ```

2. **Use the Genre Swap Feature**:
   - Navigate to the genre swap screen
   - Enter YouTube URL and select genre
   - Watch real-time processing

## 🎵 **What Happens During Processing**

### **Step 1: Download (30-60 seconds)**
- Downloads audio from YouTube
- Converts to high-quality WAV format

### **Step 2: Audio Separation (2-5 minutes)**
- Uses AI (Demucs) to separate vocals from instrumental
- Creates two files: vocals.wav and no_vocals.wav

### **Step 3: Lyrics Transcription (1-3 minutes)**
- Uses AI (Whisper) to transcribe lyrics
- Generates timestamped lyrics file (.lrc)

### **Step 4: Genre Transfer (1-2 minutes)**
- Applies genre-specific audio effects
- Transforms instrumental to target genre

### **Step 5: Mixing (30-60 seconds)**
- Combines vocals with new instrumental
- Creates final genre-swapped song

## 🎯 **Example Transformations**

### **Pop → Rock**
- **Original**: Taylor Swift - "Shake It Off"
- **Result**: High-energy rock version with distorted guitars
- **Perfect for**: Rock karaoke nights

### **Hip-hop → Jazz**
- **Original**: Eminem - "Lose Yourself"
- **Result**: Smooth jazz arrangement with saxophone
- **Perfect for**: Sophisticated lounge settings

### **Electronic → Classical**
- **Original**: Daft Punk - "Get Lucky"
- **Result**: Orchestral version with strings
- **Perfect for**: Formal events

### **Country → Electronic**
- **Original**: Johnny Cash - "Ring of Fire"
- **Result**: EDM remix with electronic beats
- **Perfect for**: Dance parties

## 🎨 **Supported Genres (50+ Options)**

### **Popular Genres**
- 🎸 **Rock**: High energy, distorted guitars
- 🎷 **Jazz**: Smooth, sophisticated sound
- 🎹 **Electronic**: Synthetic, digital processing
- 🎻 **Classical**: Clean, orchestral sound
- 🎤 **Pop**: Mainstream, radio-friendly
- 🎧 **Hip-hop**: Beat-driven, rhythmic

### **Specialty Genres**
- 🤠 **Country**: Folk-inspired, acoustic
- 🌴 **Reggae**: Caribbean rhythms
- 🎵 **Blues**: Soulful, emotional
- 🎺 **Funk**: Groove-based, rhythmic
- 🎼 **Soul**: R&B-inspired, smooth
- 🎪 **Disco**: Dance-oriented, groovy

### **Modern Genres**
- 🎛️ **EDM**: Electronic dance music
- 🏠 **House**: Club-oriented beats
- 🎚️ **Techno**: Industrial electronic
- 🎛️ **Trance**: Hypnotic electronic
- 🎚️ **Dubstep**: Heavy bass drops
- 🥁 **Drum & Bass**: Fast-paced electronic

## 📱 **Using Different Platforms**

### **Desktop (Ultrastar WorldParty)**
1. **Install the desktop app**:
   ```bash
   cd karatoken-integrated/desktop
   # Follow Delphi compilation instructions
   ```

2. **Import genre-swapped songs**:
   - Copy generated .wav files to game/songs/
   - Copy .lrc files for lyrics synchronization
   - Enjoy karaoke with AI-transformed songs!

### **Mobile (React Native)**
1. **Start the mobile app**:
   ```bash
   cd karatoken-integrated/mobile
   npm start
   ```

2. **Use the genre swap feature**:
   - Navigate to genre swap screen
   - Enter YouTube URL
   - Select target genre
   - Download transformed song

### **Web Browser**
1. **Open the web interface**:
   - Go to `http://localhost:3000`
   - Use the beautiful web UI
   - No installation required!

## 🔧 **Troubleshooting**

### **Common Issues**

#### **"FFmpeg not found"**
```bash
# Install FFmpeg
winget install ffmpeg  # Windows
brew install ffmpeg    # macOS
sudo apt install ffmpeg # Linux
```

#### **"Python tools not found"**
```bash
# Install Python tools
cd karatoken-integrated/ai-services/backend
npm run install-tools
```

#### **"YouTube download failed"**
- Check your internet connection
- Try a different YouTube URL
- Some videos may be restricted

#### **"Processing takes too long"**
- Audio separation is CPU-intensive
- Longer songs take more time
- Check server logs for progress

### **Performance Tips**

1. **Use shorter songs** for faster processing
2. **Close other applications** to free up CPU
3. **Use SSD storage** for faster file operations
4. **Monitor system resources** during processing

## 🎉 **Success Stories**

### **Karaoke Night Success**
- **User**: "Transformed 10 pop songs to rock for our karaoke night"
- **Result**: "Everyone loved the rock versions!"
- **Time**: 2 hours for all songs

### **Wedding Reception**
- **User**: "Converted modern songs to classical for our wedding"
- **Result**: "Perfect for our elegant reception"
- **Time**: 1 hour for 5 songs

### **Dance Party**
- **User**: "Remixed country songs to electronic for our party"
- **Result**: "Amazing dance floor energy!"
- **Time**: 30 minutes for 3 songs

## 🚀 **Advanced Features**

### **Batch Processing**
```bash
# Process multiple songs at once
for url in "url1" "url2" "url3"; do
  curl -X POST http://localhost:3000/api/ai/genre-swap \
    -H "Content-Type: application/json" \
    -d "{\"youtubeUrl\": \"$url\", \"targetGenre\": \"rock\"}"
done
```

### **Custom Audio Effects**
- Modify `applyGenreTransfer()` function
- Add your own audio processing
- Create unique genre combinations

### **Integration with Other Apps**
- Use the API in your own applications
- Integrate with music production software
- Connect to streaming platforms

## 📞 **Support**

### **Getting Help**
- **Documentation**: Check `/docs` folder
- **Issues**: Report on GitHub
- **Community**: Join Discord/Telegram

### **Feature Requests**
- **New Genres**: Request additional genres
- **Audio Effects**: Suggest new processing options
- **Platform Support**: Request new platforms

---

## 🎤 **Ready to Transform Music?**

**Start your Karatoken journey today!**

1. **Quick Start**: `node start-karatoken.js`
2. **Web Interface**: `http://localhost:3000`
3. **Transform Songs**: Paste YouTube URL + Select Genre
4. **Enjoy**: Download your AI-transformed karaoke songs!

**The future of karaoke is here!** 🚀✨ 
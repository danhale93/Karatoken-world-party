# AI Scoring Service

This service provides audio analysis and scoring for Karatoken World Party. It handles vocal transcription, pitch analysis, and emotion detection.

## Features

- 🎤 Audio transcription using OpenAI's Whisper
- 🎵 Pitch and timing analysis using Librosa
- 😊 Basic emotion detection
- 🚀 FastAPI-based REST API
- 🔄 Real-time WebSocket support (coming soon)

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the service:
   ```bash
   uvicorn main:app --reload
   ```

## API Endpoints

### POST /analyze
Analyze an audio file and return scoring results.

**Request:**
- `file`: Audio file (WAV/MP3)

**Response:**
```json
{
  "score": 85.5,
  "lyrics": "Hello world, this is a test",
  "timing": [
    {
      "word": "Hello",
      "start": 0.5,
      "end": 0.8,
      "confidence": 0.95
    }
  ],
  "emotion": "energetic"
}
```

## Development

### Environment Variables
Create a `.env` file:
```
# API Configuration
PORT=8000
DEBUG=true

# Model Configuration
WHISPER_MODEL=base  # base, small, medium, large
```

### Running Tests
```bash
pytest tests/
```

## Integration

### Unity (C#)
```csharp
using UnityEngine;
using System.Collections;
using UnityEngine.Networking;

public class AudioAnalyzer : MonoBehaviour
{
    public string apiUrl = "http://localhost:8000/analyze";
    
    public IEnumerator AnalyzeAudio(string filePath)
    {
        byte[] audioData = System.IO.File.ReadAllBytes(filePath);
        
        WWWForm form = new WWWForm();
        form.AddBinaryData("file", audioData, "recording.wav");
        
        using (UnityWebRequest www = UnityWebRequest.Post(apiUrl, form))
        {
            yield return www.SendWebRequest();
            
            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError(www.error);
            }
            else
            {
                Debug.Log("Analysis complete: " + www.downloadHandler.text);
                // Parse JSON response and update game state
            }
        }
    }
}
```

### React Native
```javascript
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

const analyzeAudio = async (uri) => {
  const formData = new FormData();
  formData.append('file', {
    uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
    type: 'audio/wav',
    name: 'recording.wav',
  });

  try {
    const response = await fetch('http://YOUR_SERVER_IP:8000/analyze', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
};
```

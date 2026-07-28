from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import whisper
import librosa
import numpy as np
import io
import soundfile as sf
import os
from datetime import datetime

app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper model (medium is a good balance between speed and accuracy)
model = whisper.load_model("base")

class ScoringResult(BaseModel):
    score: float
    lyrics: str
    timing: List[dict]
    emotion: str

def analyze_pitch(audio_data: np.ndarray, sr: int) -> dict:
    """Analyze pitch and timing of the audio"""
    # Convert to mono if stereo
    if len(audio_data.shape) > 1:
        audio_data = librosa.to_mono(audio_data)
    
    # Get pitch using librosa's piptrack
    pitches, magnitudes = librosa.piptrack(y=audio_data, sr=sr)
    
    # ⚡ Bolt Optimization: Vectorized frame-by-frame pitch extraction using argmax along axis 0 and advanced indexing.
    # This avoids expensive interpreted Python loops and works entirely in fast C memory.
    indices = np.argmax(magnitudes, axis=0)
    pitch_values_all = pitches[indices, np.arange(pitches.shape[1])]
    pitch_values = pitch_values_all[pitch_values_all > 0]

    # Pre-calculate the pitches filter once to avoid redundant computations.
    valid_pitches = pitches[pitches > 0]
    has_valid = len(valid_pitches) > 0
    
    return {
        'average_pitch': float(np.mean(valid_pitches)) if has_valid else 0.0,
        'pitch_variance': float(np.var(valid_pitches)) if has_valid else 0.0,
        'total_notes': len(pitch_values)
    }

@app.post("/analyze", response_model=ScoringResult)
async def analyze_audio(file: UploadFile):
    try:
        # Read and process audio file
        audio_bytes = await file.read()
        audio_file = io.BytesIO(audio_bytes)
        
        # Convert to WAV if needed (using pydub if necessary)
        audio, sr = librosa.load(audio_file, sr=None)
        
        # Transcribe audio using Whisper
        result = model.transcribe(audio_file)
        
        # Analyze pitch and timing
        pitch_analysis = analyze_pitch(audio, sr)
        
        # Simple emotion detection based on pitch variance and energy
        emotion = "neutral"
        if pitch_analysis['pitch_variance'] > 1000:
            emotion = "energetic"
        elif pitch_analysis['pitch_variance'] < 300:
            emotion = "calm"
            
        # Calculate a simple score (this would be more sophisticated in production)
        score = min(100, 60 + (pitch_analysis['total_notes'] * 0.5) + (pitch_analysis['pitch_variance'] / 50))
        
        # Prepare timing data
        timing_data = [
            {
                'word': segment['text'].strip(),
                'start': segment['start'],
                'end': segment['end'],
                'confidence': segment.get('confidence', 0.9)
            }
            for segment in result.get('segments', [])
        ]
        
        return {
            'score': round(score, 2),
            'lyrics': result['text'],
            'timing': timing_data,
            'emotion': emotion
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

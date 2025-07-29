import sys
import requests
import os

# Usage: python whisper_transcribe.py audio_path
if len(sys.argv) != 2:
    print("Usage: python whisper_transcribe.py audio_path")
    sys.exit(1)

audio_path = sys.argv[1]
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # Set this in your environment

if not OPENAI_API_KEY:
    print("Please set the OPENAI_API_KEY environment variable.")
    sys.exit(1)

headers = {
    "Authorization": f"Bearer {OPENAI_API_KEY}"
}
files = {
    'file': open(audio_path, 'rb'),
    'model': (None, 'whisper-1'),
    'response_format': (None, 'verbose_json'),
    'timestamp_granularities[]': (None, 'word')
}

response = requests.post(
    'https://api.openai.com/v1/audio/transcriptions',
    headers=headers,
    files=files
)

result = response.json()
print(result)

import sys
import yt_dlp
import subprocess
import os

if len(sys.argv) != 3:
    print('Usage: python youtube_download.py <youtube_url> <output_path>')
    sys.exit(1)

youtube_url = sys.argv[1]
output_path = sys.argv[2]

# Ensure output_path ends with .wav
if not output_path.lower().endswith('.wav'):
    output_path = output_path.rsplit('.', 1)[0] + '.wav'

# Download to a temp file with a generic extension
base = output_path.rsplit('.', 1)[0]
temp_path = base + '.webm'

ydl_opts = {
    'format': 'bestaudio/best',
    'outtmpl': temp_path,
    'quiet': True,
}

with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    ydl.download([youtube_url])

# Convert to standard PCM 16-bit 44.1kHz wav using ffmpeg
subprocess.run([
    'ffmpeg', '-y', '-i', temp_path,
    '-acodec', 'pcm_s16le', '-ar', '44100', output_path
], check=True)

# Remove temp file
os.remove(temp_path) 
import sys
import json

# Usage: python transcription_to_lrc.py transcription.json output.lrc
if len(sys.argv) != 3:
    print("Usage: python transcription_to_lrc.py transcription.json output.lrc")
    sys.exit(1)

with open(sys.argv[1], 'r', encoding='utf-8') as f:
    data = json.load(f)

segments = data.get('segments', [])

with open(sys.argv[2], 'w', encoding='utf-8') as out:
    for seg in segments:
        start = seg['start']
        text = seg['text']
        # LRC timestamp format: [mm:ss.xx]
        mins = int(start // 60)
        secs = start % 60
        timestamp = f"[{mins:02d}:{secs:05.2f}]"
        out.write(f"{timestamp}{text}\n")

print(f"LRC file written to {sys.argv[2]}")

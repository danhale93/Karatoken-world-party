import sys
import os
import torchaudio
from demucs.pretrained import get_model
from demucs.apply import apply_model

# Usage: python demucs_infer.py <input_path> <output_dir>
if len(sys.argv) != 3:
    print("Usage: python demucs_infer.py <input_path> <output_dir>")
    sys.exit(1)

input_path = sys.argv[1]
output_dir = sys.argv[2]

os.makedirs(output_dir, exist_ok=True)

# Set backend to soundfile for better wav compatibility
try:
    torchaudio.set_audio_backend('soundfile')
except Exception as e:
    print('Warning: Could not set torchaudio backend to soundfile:', e)

model = get_model('htdemucs')
wav, sr = torchaudio.load(input_path)
if wav.dim() == 2:
    wav = wav.unsqueeze(0)  # Add batch dimension

sources = apply_model(model, wav)

# Save vocals and accompaniment
for name, source in sources.items():
    out_path = os.path.join(output_dir, f"{name}.wav")
    torchaudio.save(out_path, source, sr)
print("done")

import sys
import shutil
import os

# Usage: python genre_transfer.py input_path output_path target_genre
if len(sys.argv) != 4:
    print("Usage: python genre_transfer.py input_path output_path target_genre")
    sys.exit(1)

input_path = sys.argv[1]
output_path = sys.argv[2]
target_genre = sys.argv[3]

# --- GENRE TRANSFER PIPELINE: INSTRUMENTAL ONLY ---
# This version generates a new instrumental in the target genre and removes the original vocals.
# --- MusicGen Integration ---
def generate_instrumental(target_genre, out_path):
    """
    Generate a 30s instrumental using MusicGen based on the target genre.
    Requires audiocraft: pip install git+https://github.com/facebookresearch/audiocraft.git
    """
    try:
        from audiocraft.models import musicgen
        from audiocraft.data.audio import audio_write
        import torch
    except ImportError:
        print("audiocraft is not installed. Please run: pip install git+https://github.com/facebookresearch/audiocraft.git")
        sys.exit(1)

    print(f"Loading MusicGen model...")
    model = musicgen.MusicGen.get_pretrained('facebook/musicgen-melody')
    model.set_generation_params(duration=30, top_k=250, top_p=0.0, temperature=1.0, cfg_coef=3.0)

    prompt = f"instrumental {target_genre} music, no vocals, high quality, studio recording"
    print(f"Generating instrumental for prompt: '{prompt}'")
    wav = model.generate([prompt], progress=True)

    # Save the generated audio
    print(f"Saving instrumental to {out_path}")
    audio_write(out_path.replace('.wav',''), wav[0].cpu(), model.sample_rate, strategy="loudness", format="wav")
    print(f"Generated {target_genre} instrumental at {out_path}")

# Generate the new instrumental only (no vocals)
generate_instrumental(target_genre, output_path)

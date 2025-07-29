# Karatoken Backend AI Pipeline Scripts

## demucs_infer.py
- Usage: `python demucs_infer.py input_path output_dir`
- Runs Demucs vocal separation on the input audio file.
- Requires: `pip install demucs`
- Output: vocals.wav and accompaniment.wav in the output directory.

## genre_transfer.py
- Usage: `python genre_transfer.py input_path output_path target_genre`
- (Stub) Copies input file to output. Replace with your real genre transfer logic.
- Requires: `pip install pydub torch` (and your model dependencies)

## Notes
- Make sure ffmpeg is installed and on your PATH for audio processing.
- These scripts are called by the Node.js backend for the /api/ai/genre-swap endpoint.

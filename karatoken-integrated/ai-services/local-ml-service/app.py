import os
import io
import math
import time
import uuid
import shutil
import requests
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Create output directory to host generated files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(BASE_DIR, "outputs")
os.makedirs(OUT_DIR, exist_ok=True)

app = FastAPI(title="Local ML Service", version="0.1.0")
app.mount("/files", StaticFiles(directory=OUT_DIR), name="files")


class SeparateRequest(BaseModel):
    audio_url: str


class MusicGenRequest(BaseModel):
    prompt: str
    duration_sec: Optional[int] = 8
    sample_rate: Optional[int] = 44100


class TranscribeRequest(BaseModel):
    audio_url: str
    format: Optional[str] = "lrc"


@app.get("/health")
async def health():
    return {"ok": True, "service": "local-ml-service"}


def _download(url: str, dest_path: str):
    try:
        with requests.get(url, stream=True, timeout=30) as r:
            r.raise_for_status()
            with open(dest_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"download failed: {e}")


def _new_name(prefix: str, ext: str) -> str:
    ts = int(time.time() * 1000)
    uid = uuid.uuid4().hex[:8]
    return f"{prefix}_{ts}_{uid}{ext}"


def _wav_sine(out_path: str, seconds: int = 8, sr: int = 44100, freq: float = 440.0):
    import wave
    import struct

    n_samples = seconds * sr
    amplitude = 16000  # 16-bit PCM
    with wave.open(out_path, 'w') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(sr)
        for i in range(n_samples):
            t = i / sr
            val = int(amplitude * math.sin(2 * math.pi * freq * t))
            data = struct.pack('<hh', val, val)
            wf.writeframesraw(data)


@app.post("/separate")
async def separate(req: SeparateRequest, request: Request):
    # Download source
    src_name = _new_name("source", ".bin")
    src_path = os.path.join(OUT_DIR, src_name)
    _download(req.audio_url, src_path)

    # Attempt real separation if demucs is available (optional)
    vocals_path = None
    inst_path = None
    try:
        import subprocess
        # Demucs CLI writes outputs to a directory; we keep it optional
        # Example command (requires demucs installed):
        # subprocess.run(["demucs", src_path, "-o", OUT_DIR, "-n", "htdemucs"], check=True)
        # For scaffold, we just copy the source as instrumental
        inst_name = _new_name("instrumental_sep", ".wav")
        inst_path = os.path.join(OUT_DIR, inst_name)
        shutil.copyfile(src_path, inst_path)
    except Exception:
        # Fallback copy
        inst_name = _new_name("instrumental_sep", ".wav")
        inst_path = os.path.join(OUT_DIR, inst_name)
        shutil.copyfile(src_path, inst_path)

    base_url = str(request.base_url).rstrip('/')
    resp = {"ok": True}
    if vocals_path and os.path.exists(vocals_path):
        resp["vocals_url"] = f"{base_url}/files/{os.path.basename(vocals_path)}"
    if inst_path and os.path.exists(inst_path):
        resp["instrumental_url"] = f"{base_url}/files/{os.path.basename(inst_path)}"
    if "instrumental_url" not in resp and "vocals_url" not in resp:
        raise HTTPException(status_code=500, detail="separation failed")
    return JSONResponse(resp)


@app.post("/musicgen")
async def musicgen(req: MusicGenRequest, request: Request):
    # Try to use audiocraft/musicgen if available, otherwise synth a tone
    out_name = _new_name("instrumental_processed", ".wav")
    out_path = os.path.join(OUT_DIR, out_name)

    used_real = False
    try:
        # Placeholder for real MusicGen integration. Keeping scaffold minimal.
        # If you install audiocraft and models, integrate generation here.
        raise RuntimeError("musicgen not installed")
    except Exception:
        _wav_sine(out_path, seconds=int(req.duration_sec or 8), sr=int(req.sample_rate or 44100), freq=440.0)

    base_url = str(request.base_url).rstrip('/')
    return {"ok": True, "audio_url": f"{base_url}/files/{os.path.basename(out_path)}"}


@app.post("/transcribe")
async def transcribe(req: TranscribeRequest, request: Request):
    # Download source
    src_name = _new_name("transcribe_src", ".bin")
    src_path = os.path.join(OUT_DIR, src_name)
    _download(req.audio_url, src_path)

    # Try faster-whisper if available, else return simple placeholder
    lrc_text = None
    try:
        # from faster_whisper import WhisperModel
        # model = WhisperModel("small", device="cpu", compute_type="int8")
        # segments, info = model.transcribe(src_path, vad_filter=True)
        # Convert to LRC if requested; for scaffold we skip heavy inference
        raise RuntimeError("whisper not installed")
    except Exception:
        # Simple placeholder LRC
        lrc_text = """[ar:Unknown]\n[ti:Generated]\n[00:00.00] This is a placeholder transcription\n[00:05.00] Replace with Faster-Whisper output when available\n"""

    if (req.format or "lrc").lower() != "lrc":
        # If other formats requested, still return text
        return {"ok": True, "text": lrc_text.replace("\n", " ")}

    return {"ok": True, "lrc": lrc_text}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "5001"))
    uvicorn.run(app, host="127.0.0.1", port=port)

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const replicate = require("./replicateClient");

function downloadUrlToFile(url, dest, timeoutMs = 60000) {
  const proto = url.startsWith("https") ? https : http;
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(dest);
    const req = proto.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.on("error", (err) => {
        try { out.close(() => fs.unlink(dest, () => {})); } catch {}
        reject(err);
      });
      res.pipe(out);
      out.on("finish", () => out.close(() => resolve(dest)));
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error("Request timeout")));
    req.on("error", (err) => {
      try { out.close(() => fs.unlink(dest, () => {})); } catch {}
      reject(err);
    });
  });
}

function toLrcTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  // mm:ss.xx
  return `${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`;
}

function srtToLrc(srtText) {
  const lines = srtText.split(/\r?\n/);
  const lrc = [];
  let i = 0;
  while (i < lines.length) {
    // skip index line
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i >= lines.length) break;
    i++;
    if (i >= lines.length) break;
    const ts = lines[i++];
    const match = ts.match(/(\d+):(\d+):(\d+),(\d+)/);
    if (!match) { while (i < lines.length && lines[i].trim() !== "") i++; continue; }
    const h = parseInt(match[1],10), m = parseInt(match[2],10), s = parseInt(match[3],10), ms = parseInt(match[4],10);
    const start = h*3600 + m*60 + s + ms/1000;
    let text = "";
    while (i < lines.length && lines[i].trim() !== "") {
      text += (text?" ":"") + lines[i].trim();
      i++;
    }
    lrc.push(`[${toLrcTimestamp(start)}] ${text}`);
    i++;
  }
  return lrc.join("\n");
}

function segmentsToLrc(segments) {
  const lines = segments.map(seg => {
    const t = typeof seg.start === "number" ? seg.start : (seg.start?.seconds ?? 0);
    const text = (seg.text || "").trim();
    return `[${toLrcTimestamp(t)}] ${text}`;
  });
  return lines.join("\n");
}

async function transcribeToLrc({ sourcePath, outDir }) {
  const model = process.env.REPLICATE_WHISPER_MODEL;
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token || !model) {
    throw new Error("Replicate not configured (REPLICATE_API_TOKEN or REPLICATE_WHISPER_MODEL missing)");
  }
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    throw new Error("Source audio not found for transcription");
  }
  const audioStream = fs.createReadStream(sourcePath);
  const input = { audio: audioStream };

  const output = await replicate.run(model, { input });
  let lrcContent = null;

  if (typeof output === "string") {
    if (output.startsWith("http")) {
      const tmp = path.join(outDir, "whisper_output.txt");
      await downloadUrlToFile(output, tmp);
      const text = fs.readFileSync(tmp, "utf8");
      lrcContent = srtToLrc(text); // try SRT parse; if fails it will return maybe empty
      if (!lrcContent || !lrcContent.trim()) {
        // fallback: naive single block
        lrcContent = `[00:00.00] ${text.split(/\r?\n/).filter(Boolean).join(" ")}`;
      }
    } else {
      // Plain text
      lrcContent = `[00:00.00] ${output.replace(/\r?\n/g, " ").trim()}`;
    }
  } else if (Array.isArray(output)) {
    const first = output.find(v => typeof v === "string");
    if (first) {
      if (first.startsWith("http")) {
        const tmp = path.join(outDir, "whisper_output.txt");
        await downloadUrlToFile(first, tmp);
        const text = fs.readFileSync(tmp, "utf8");
        lrcContent = srtToLrc(text) || `[00:00.00] ${text.split(/\r?\n/).filter(Boolean).join(" ")}`;
      } else {
        lrcContent = `[00:00.00] ${first.replace(/\r?\n/g, " ").trim()}`;
      }
    }
  } else if (output && typeof output === "object") {
    // Heuristic for { segments: [{start, text}...] }
    if (Array.isArray(output.segments)) {
      lrcContent = segmentsToLrc(output.segments);
    } else if (typeof output.text === "string") {
      lrcContent = `[00:00.00] ${output.text.replace(/\r?\n/g, " ").trim()}`;
    }
  }

  if (!lrcContent) {
    // ultimate fallback
    lrcContent = `[00:00.00] (No transcription available)`;
  }

  const lrcPath = path.join(outDir, "lyrics.lrc");
  fs.writeFileSync(lrcPath, lrcContent);
  return lrcPath;
}

module.exports = { transcribeToLrc, srtToLrc, segmentsToLrc };

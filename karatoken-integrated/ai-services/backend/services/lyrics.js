const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const replicate = require('./replicateClient');

function downloadUrlToFile(url, dest, timeoutMs = 60000) {
  const proto = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(dest);
    const req = proto.get(url, res => {
      if (res.statusCode && res.statusCode >= 400) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.on('error', err => {
        try {
          out.close(() => fs.unlink(dest, () => {}));
        } catch {}
        reject(err);
      });
      res.pipe(out);
      out.on('finish', () => out.close(() => resolve(dest)));
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error('Request timeout')));
    req.on('error', err => {
      try {
        out.close(() => fs.unlink(dest, () => {}));
      } catch {}
      reject(err);
    });
  });
}

function toLrcTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  // ⚡ Bolt Optimization: Replacing generic padStart calls with conditional checks and fast native string slicing
  // to avoid garbage collection and string allocation overhead in hot loops.
  return `${m < 10 ? '0' + m : m}:${('0' + s.toFixed(2)).slice(-5)}`;
}

function srtToLrc(srtText) {
  // ⚡ Bolt Optimization: Robust, state-machine based parsing that avoids RegExp,
  // map, and heavy string padding inside the loop, while correctly handling CRLF.
  const lines = srtText.split(/\r?\n/);
  const lrcLines = [];
  const len = lines.length;
  let i = 0;

  while (i < len) {
    // 1. Skip leading empty lines or whitespace-only lines
    while (i < len && lines[i].trim() === '') {
      i++;
    }
    if (i >= len) break;

    // 2. Skip the subtitle index line
    i++;
    if (i >= len) break;

    // 3. Process the timestamp line (e.g. "00:00:01,050 --> 00:00:04,200")
    const tsLine = lines[i++];
    const arrowIndex = tsLine.indexOf(' --> ');
    if (arrowIndex === -1) {
      // Not a valid timestamp line, skip text lines until we hit an empty line
      while (i < len && lines[i].trim() !== '') {
        i++;
      }
      continue;
    }

    // Extract start timestamp
    const startTs = tsLine.substring(0, arrowIndex).trim();

    // 4. Gather text lines (could be one or more lines)
    let text = '';
    while (i < len) {
      const line = lines[i].trim();
      if (line === '') {
        break; // Empty line terminates this block
      }
      if (text) {
        text += ' ' + line;
      } else {
        text = line;
      }
      i++;
    }

    // 5. Parse timestamp robustly and efficiently without RegExp/map/pad allocations
    // Use ultra-fast character code offsets if standard format to avoid any string allocation
    if (startTs.length >= 12 && startTs.charCodeAt(2) === 58 && startTs.charCodeAt(5) === 58) {
      const h = (startTs.charCodeAt(0) - 48) * 10 + (startTs.charCodeAt(1) - 48);
      const m = (startTs.charCodeAt(3) - 48) * 10 + (startTs.charCodeAt(4) - 48);
      const s = (startTs.charCodeAt(6) - 48) * 10 + (startTs.charCodeAt(7) - 48);

      const char8 = startTs.charCodeAt(8);
      let ms = 0;
      if (char8 === 44 || char8 === 46) { // comma or dot
        ms = (startTs.charCodeAt(9) - 48) * 100 + (startTs.charCodeAt(10) - 48) * 10 + (startTs.charCodeAt(11) - 48);
      }

      if (h >= 0 && h < 100 && m >= 0 && m < 60 && s >= 0 && s < 60 && ms >= 0 && ms < 1000) {
        const totalSeconds = h * 3600 + m * 60 + s + ms / 1000;
        lrcLines.push(`[${toLrcTimestamp(totalSeconds)}] ${text}`);
      }
    } else {
      // Fallback for non-standard SRT files
      const colon1 = startTs.indexOf(':');
      const colon2 = startTs.indexOf(':', colon1 + 1);

      if (colon1 !== -1 && colon2 !== -1) {
        const h = parseInt(startTs.substring(0, colon1), 10);
        const m = parseInt(startTs.substring(colon1 + 1, colon2), 10);
        const rest = startTs.substring(colon2 + 1);
        const s = parseFloat(rest.replace(',', '.'));

        if (!isNaN(h) && !isNaN(m) && !isNaN(s)) {
          const totalSeconds = h * 3600 + m * 60 + s;
          lrcLines.push(`[${toLrcTimestamp(totalSeconds)}] ${text}`);
        }
      }
    }

    i++;
  }

  return lrcLines.join('\n');
}

function segmentsToLrc(segments) {
  const lines = segments.map(seg => {
    const t = typeof seg.start === 'number' ? seg.start : (seg.start?.seconds ?? 0);
    const text = (seg.text || '').trim();
    return `[${toLrcTimestamp(t)}] ${text}`;
  });
  return lines.join('\n');
}

async function transcribeToLrc({ sourcePath, outDir }) {
  const model = process.env.REPLICATE_WHISPER_MODEL;
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token || !model) {
    throw new Error(
      'Replicate not configured (REPLICATE_API_TOKEN or REPLICATE_WHISPER_MODEL missing)'
    );
  }
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    throw new Error('Source audio not found for transcription');
  }
  const audioStream = fs.createReadStream(sourcePath);
  const input = { audio: audioStream };

  const output = await replicate.run(model, { input });
  let lrcContent = null;

  if (typeof output === 'string') {
    if (output.startsWith('http')) {
      const tmp = path.join(outDir, 'whisper_output.txt');
      await downloadUrlToFile(output, tmp);
      const text = fs.readFileSync(tmp, 'utf8');
      lrcContent = srtToLrc(text); // try SRT parse; if fails it will return maybe empty
      if (!lrcContent || !lrcContent.trim()) {
        // fallback: naive single block
        lrcContent = `[00:00.00] ${text.split(/\r?\n/).filter(Boolean).join(' ')}`;
      }
    } else {
      // Plain text
      lrcContent = `[00:00.00] ${output.replace(/\r?\n/g, ' ').trim()}`;
    }
  } else if (Array.isArray(output)) {
    const first = output.find(v => typeof v === 'string');
    if (first) {
      if (first.startsWith('http')) {
        const tmp = path.join(outDir, 'whisper_output.txt');
        await downloadUrlToFile(first, tmp);
        const text = fs.readFileSync(tmp, 'utf8');
        lrcContent =
          srtToLrc(text) || `[00:00.00] ${text.split(/\r?\n/).filter(Boolean).join(' ')}`;
      } else {
        lrcContent = `[00:00.00] ${first.replace(/\r?\n/g, ' ').trim()}`;
      }
    }
  } else if (output && typeof output === 'object') {
    // Heuristic for { segments: [{start, text}...] }
    if (Array.isArray(output.segments)) {
      lrcContent = segmentsToLrc(output.segments);
    } else if (typeof output.text === 'string') {
      lrcContent = `[00:00.00] ${output.text.replace(/\r?\n/g, ' ').trim()}`;
    }
  }

  if (!lrcContent) {
    // ultimate fallback
    lrcContent = `[00:00.00] (No transcription available)`;
  }

  const lrcPath = path.join(outDir, 'lyrics.lrc');
  fs.writeFileSync(lrcPath, lrcContent);
  return lrcPath;
}

module.exports = { transcribeToLrc, srtToLrc, segmentsToLrc, toLrcTimestamp };

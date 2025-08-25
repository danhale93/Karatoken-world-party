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

/**
 * Attempts to separate audio into stems using Demucs on Replicate.
 * Returns any discovered vocals/instrumental file paths saved under outDir.
 */
async function separateAudio({ sourcePath, outDir }) {
  const model = process.env.REPLICATE_DEMUCS_MODEL;
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token || !model) {
    throw new Error("Replicate not configured (REPLICATE_API_TOKEN or REPLICATE_DEMUCS_MODEL missing)");
  }
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    throw new Error("Source audio not found for separation");
  }
  const audioStream = fs.createReadStream(sourcePath);
  const input = { audio: audioStream };

  const output = await replicate.run(model, { input });
  // Output might be a single URL, an array of URLs, or an object.
  const urls = Array.isArray(output) ? output : [output];
  let vocalsPath = null;
  let instrumentalPath = null;

  for (const u of urls) {
    if (typeof u !== "string") continue;
    const filename = path.basename(new URL(u).pathname);
    const lower = filename.toLowerCase();
    if (!vocalsPath && (lower.includes("vocals") || lower.endsWith("vocals.wav"))) {
      const p = path.join(outDir, "vocals.wav");
      await downloadUrlToFile(u, p);
      vocalsPath = p;
    } else if (!instrumentalPath && (lower.includes("instrumental") || lower.includes("no_vocals") || lower.includes("accompaniment"))) {
      const p = path.join(outDir, "instrumental_sep.wav");
      await downloadUrlToFile(u, p);
      instrumentalPath = p;
    }
  }

  // If we didn't match labels, but got at least one URL, save the first as generic stem
  if (!vocalsPath && !instrumentalPath) {
    const firstUrl = urls.find((v) => typeof v === "string");
    if (firstUrl) {
      const p = path.join(outDir, "stem_0.wav");
      await downloadUrlToFile(firstUrl, p);
      instrumentalPath = p;
    }
  }

  return { vocalsPath, instrumentalPath };
}

module.exports = { separateAudio };

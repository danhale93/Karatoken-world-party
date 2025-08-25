const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
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

async function generateBacking({ prompt, outPath }) {
  const model = process.env.REPLICATE_MUSICGEN_MODEL;
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token || !model) {
    throw new Error("Replicate not configured (REPLICATE_API_TOKEN or REPLICATE_MUSICGEN_MODEL missing)");
  }
  // Minimal input: prompt only (let model defaults handle duration etc.)
  const output = await replicate.run(model, { input: { prompt } });
  // Some models return a single URL string; others return arrays. Normalize.
  const url = Array.isArray(output) ? output[0] : output;
  if (typeof url !== "string") {
    throw new Error("Unexpected MusicGen output shape");
  }
  const finalOut = outPath || path.join(process.cwd(), "tmp", `musicgen_${Date.now()}.wav`);
  await downloadUrlToFile(url, finalOut);
  return finalOut;
}

module.exports = { generateBacking };

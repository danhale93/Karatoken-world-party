const fs = require("fs");
const path = require("path");
const ffmpegInstaller = (() => {
  try { return require("@ffmpeg-installer/ffmpeg"); } catch { return null; }
})();
let ffmpeg;
try {
  ffmpeg = require("fluent-ffmpeg");
  if (ffmpegInstaller && ffmpegInstaller.path) {
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
  }
} catch {
  // Module not installed yet; caller should handle fallback
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Mix vocals over backing using ffmpeg's amix and simple volume controls.
 * Returns the outPath if successful.
 */
async function remixTracks({ vocalsPath, backingPath, outPath, vocalsGainDb = -2, backingGainDb = 0 }) {
  if (!ffmpeg) throw new Error("ffmpeg not available (install fluent-ffmpeg and @ffmpeg-installer/ffmpeg)");
  if (!backingPath || !fs.existsSync(backingPath)) throw new Error("backingPath missing");
  const hasVocals = vocalsPath && fs.existsSync(vocalsPath);
  const finalOut = outPath || path.join(path.dirname(backingPath), "genre_mix.wav");
  ensureDir(path.dirname(finalOut));

  if (!hasVocals) {
    // No vocals: just copy backing to finalOut
    fs.copyFileSync(backingPath, finalOut);
    return finalOut;
  }

  await new Promise((resolve, reject) => {
    const cmd = ffmpeg()
      .input(vocalsPath)
      .input(backingPath)
      .audioFilters([
        { filter: "volume", options: `${Math.pow(10, vocalsGainDb / 20)}` },
        { filter: "adelay", options: "0|0" }, // no delay by default, extend later for alignment
      ])
      .complexFilter([
        // Stream 0 is vocals, 1 is backing; apply per-stream volumes via asplit not trivial here
        // Simpler approach: use amix and set dropouts/normalize off
        {
          filter: "amix",
          options: {
            inputs: 2,
            normalize: 0,
          },
        },
        { filter: "volume", options: `${Math.pow(10, backingGainDb / 20)}` },
      ])
      .outputOptions(["-ac", "2", "-ar", "44100"])
      .on("end", resolve)
      .on("error", reject)
      .save(finalOut);
  });

  return finalOut;
}

module.exports = { remixTracks };

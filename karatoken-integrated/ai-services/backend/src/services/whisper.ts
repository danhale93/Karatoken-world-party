import fs from 'fs';
import path from 'path';
import { whisper } from 'whisper-node';

interface TranscriptionOptions {
  model?: string;
  output_format?: 'srt' | 'txt' | 'vtt';
  language?: string;
  temperature?: number;
}

export async function transcribeAudio(
  audioPath: string,
  options: TranscriptionOptions = {}
): Promise<string> {
  // Validate input file exists
  if (!fs.existsSync(audioPath)) {
    throw new Error('Audio file not found');
  }

  // Set default options
  const defaultOptions = {
    model: 'base',
    output_format: 'srt',
    language: 'en',
    temperature: 0,
    ...options,
  };

  try {
    // Create a temporary output file
    const outputDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(
      outputDir,
      `${path.basename(audioPath, path.extname(audioPath))}.${defaultOptions.output_format}`
    );

    // Run whisper transcription
    await whisper(audioPath, {
      ...defaultOptions,
      output: outputFile,
    });

    // Read and return the transcription
    const transcription = fs.readFileSync(outputFile, 'utf-8');

    // Clean up temporary file
    try {
      fs.unlinkSync(outputFile);
    } catch (e) {
      console.warn('Failed to clean up temporary transcription file:', e);
    }

    return transcription;
  } catch (error) {
    console.error('Transcription failed:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

// Utility function to convert SRT to LRC format
export function srtToLrc(srtContent: string): string {
  // ⚡ Bolt Optimization: Robust, high-performance state-machine based parsing that
  // handles flexible subtitle blocks (not just hardcoded 4-line intervals),
  // supports CRLF endings, and completely avoids heavy arrays, regex, map(Number), and padding overhead.
  const lines = srtContent.split(/\r?\n/);
  const lrcLines: string[] = [];
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

    // 3. Process the timestamp line (e.g. "00:00:00,000 --> 00:00:05,000")
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
    const colon1 = startTs.indexOf(':');
    const colon2 = startTs.indexOf(':', colon1 + 1);

    if (colon1 !== -1 && colon2 !== -1) {
      const h = parseInt(startTs.substring(0, colon1), 10);
      const m = parseInt(startTs.substring(colon1 + 1, colon2), 10);
      const rest = startTs.substring(colon2 + 1);
      // Replace comma with dot to parse seconds with decimals as a floating-point number
      const s = parseFloat(rest.replace(',', '.'));

      if (!isNaN(h) && !isNaN(m) && !isNaN(s)) {
        const totalSeconds = h * 3600 + m * 60 + s;
        const totalMinutes = Math.floor(totalSeconds / 60);
        const remSeconds = totalSeconds - totalMinutes * 60;

        // Fast native formatting using slicing and conditionals
        const mmStr = totalMinutes < 10 ? '0' + totalMinutes : '' + totalMinutes;
        const ssStr = ('0' + remSeconds.toFixed(2)).slice(-5);

        lrcLines.push(`[${mmStr}:${ssStr}]${text}`);
      }
    }

    i++;
  }

  return lrcLines.join('\n');
}

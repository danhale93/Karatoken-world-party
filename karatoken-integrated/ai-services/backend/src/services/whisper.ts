import { whisper } from 'whisper-node';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);

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
    
    const outputFile = path.join(outputDir, `${path.basename(audioPath, path.extname(audioPath))}.${defaultOptions.output_format}`);
    
    // Run whisper transcription
    await whisper(
      audioPath,
      {
        ...defaultOptions,
        output: outputFile,
      }
    );

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
  const lines = srtContent.split('\n');
  const lrcLines: string[] = [];
  
  for (let i = 0; i < lines.length; i += 4) {
    if (!lines[i + 1]) continue;
    
    // Extract timestamp and text
    const timestamp = lines[i + 1].split(' --> ')[0];
    const text = lines[i + 2] || '';
    
    // Convert SRT timestamp to LRC format [mm:ss.xx]
    const [timePart] = timestamp.split(',');
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const lrcTime = `[${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(Math.floor(totalSeconds % 60)).padStart(2, '0')}.${String(Math.round((totalSeconds % 1) * 100)).padStart(2, '0')}]`;
    
    lrcLines.push(`${lrcTime}${text}`);
  }
  
  return lrcLines.join('\n');
}

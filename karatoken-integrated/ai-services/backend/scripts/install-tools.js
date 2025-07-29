#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

console.log('🎤 Installing Karatoken Genre Swap Tools...\n');

const tools = [
  {
    name: 'yt-dlp',
    command: 'pip',
    args: ['install', 'yt-dlp'],
    description: 'YouTube video downloader'
  },
  {
    name: 'demucs',
    command: 'pip',
    args: ['install', 'demucs'],
    description: 'Audio source separation'
  },
  {
    name: 'whisper',
    command: 'pip',
    args: ['install', 'openai-whisper'],
    description: 'Speech recognition and transcription'
  },
  {
    name: 'ffmpeg',
    command: 'ffmpeg',
    args: ['-version'],
    description: 'Audio/video processing (check if installed)',
    checkOnly: true
  }
];

async function installTool(tool) {
  return new Promise((resolve, reject) => {
    console.log(`📦 Installing ${tool.name}...`);
    
    if (tool.checkOnly) {
      // Just check if tool is available
      const checkProcess = spawn(tool.command, tool.args, { stdio: 'pipe' });
      
      checkProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${tool.name} is already installed`);
          resolve();
        } else {
          console.log(`❌ ${tool.name} is not installed. Please install it manually:`);
          console.log(`   Visit: https://ffmpeg.org/download.html`);
          reject(new Error(`${tool.name} not found`));
        }
      });
      
      checkProcess.on('error', () => {
        console.log(`❌ ${tool.name} is not installed. Please install it manually:`);
        console.log(`   Visit: https://ffmpeg.org/download.html`);
        reject(new Error(`${tool.name} not found`));
      });
    } else {
      // Install the tool
      const installProcess = spawn(tool.command, tool.args, { 
        stdio: 'inherit',
        shell: true 
      });
      
      installProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${tool.name} installed successfully`);
          resolve();
        } else {
          console.log(`❌ Failed to install ${tool.name}`);
          reject(new Error(`Installation failed with code ${code}`));
        }
      });
      
      installProcess.on('error', (error) => {
        console.log(`❌ Error installing ${tool.name}: ${error.message}`);
        reject(error);
      });
    }
  });
}

async function createConfigFile() {
  const configPath = path.join(process.cwd(), 'config', 'tools.json');
  await fs.ensureDir(path.dirname(configPath));
  
  const config = {
    tools: {
      ytdlp: {
        enabled: true,
        path: 'yt-dlp',
        version: 'latest'
      },
      demucs: {
        enabled: true,
        path: 'demucs',
        model: 'htdemucs',
        version: 'latest'
      },
      whisper: {
        enabled: true,
        path: 'whisper',
        model: 'base',
        version: 'latest'
      },
      ffmpeg: {
        enabled: true,
        path: 'ffmpeg',
        version: 'latest'
      }
    },
    processing: {
      maxConcurrentJobs: 3,
      tempDir: './temp',
      outputDir: './public/genre-swaps',
      maxFileSize: '100MB',
      supportedFormats: ['wav', 'mp3', 'flac']
    },
    genres: {
      rock: {
        effects: ['highpass=f=200', 'lowpass=f=8000', 'volume=1.2'],
        description: 'High energy, distorted guitars'
      },
      jazz: {
        effects: ['highpass=f=100', 'lowpass=f=6000', 'volume=0.9'],
        description: 'Smooth, sophisticated sound'
      },
      electronic: {
        effects: ['highpass=f=50', 'lowpass=f=10000', 'volume=1.1'],
        description: 'Synthetic, digital processing'
      },
      classical: {
        effects: ['highpass=f=80', 'lowpass=f=5000', 'volume=0.8'],
        description: 'Clean, orchestral sound'
      }
    }
  };
  
  await fs.writeJson(configPath, config, { spaces: 2 });
  console.log('📝 Created tools configuration file');
}

async function main() {
  try {
    console.log('🚀 Starting tool installation...\n');
    
    for (const tool of tools) {
      try {
        await installTool(tool);
      } catch (error) {
        console.log(`⚠️  Warning: ${error.message}`);
        if (!tool.checkOnly) {
          console.log(`   You may need to install ${tool.name} manually`);
        }
      }
    }
    
    await createConfigFile();
    
    console.log('\n🎉 Tool installation completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Make sure FFmpeg is installed on your system');
    console.log('2. Run: npm install (to install Node.js dependencies)');
    console.log('3. Start the server: npm start');
    console.log('\n🎤 Ready for genre swapping!');
    
  } catch (error) {
    console.error('\n❌ Installation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { installTool, createConfigFile }; 
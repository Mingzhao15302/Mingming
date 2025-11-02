import { spawn } from 'node:child_process';
import path from 'node:path';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';

export function extractPoster(videoPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['-y', '-i', videoPath, '-ss', '00:00:01.000', '-vframes', '1', outputPath];
    const ffmpeg = spawn(ffmpegPath, args);

    ffmpeg.on('error', reject);
    ffmpeg.stderr.on('data', () => {
      // ignore verbose output
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });
}

export function buildPosterUrl(filename: string) {
  const base = path.parse(filename).name;
  return `/static/posters/${base}.jpg`;
}

export function buildVideoUrl(filename: string) {
  return `/static/videos/${filename}`;
}

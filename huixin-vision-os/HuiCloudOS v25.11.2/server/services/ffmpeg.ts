import { spawn } from 'node:child_process';
import ffmpeg from '@ffmpeg-installer/ffmpeg';

export function extractPoster(videoPath: string, posterPath: string) {
  return new Promise<void>((resolve, reject) => {
    const process = spawn(ffmpeg.path, [
      '-y',
      '-i',
      videoPath,
      '-ss',
      '00:00:01.000',
      '-vframes',
      '1',
      posterPath,
    ]);

    process.on('error', reject);
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });
}

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const UPLOAD_ROOT = path.resolve(process.cwd(), '..', 'web', 'public');
const VIDEO_DIR = path.join(UPLOAD_ROOT, 'videos');
const POSTER_DIR = path.join(UPLOAD_ROOT, 'posters');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function prepareStorage() {
  ensureDir(VIDEO_DIR);
  ensureDir(POSTER_DIR);
}

export function createVideoFilename(originalName: string) {
  const base = path.parse(originalName).name.replace(/\s+/g, '-');
  const unique = `${base}-${randomUUID()}`;
  return `${unique}.mp4`;
}

export function getVideoPath(filename: string) {
  return path.join(VIDEO_DIR, filename);
}

export function getPosterPath(filename: string) {
  const base = path.parse(filename).name;
  return path.join(POSTER_DIR, `${base}.jpg`);
}

export function removeFile(filePath: string) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

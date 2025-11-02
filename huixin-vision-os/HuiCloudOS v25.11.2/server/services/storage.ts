import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const webPublicDir = path.resolve(projectRoot, 'web', 'public');
const videoDir = path.resolve(webPublicDir, 'videos');
const posterDir = path.resolve(webPublicDir, 'posters');
const exportDir = path.resolve(projectRoot, 'exports');

export function ensureStorageStructure() {
  [videoDir, posterDir, path.resolve(exportDir, 'quotes'), path.resolve(exportDir, 'contracts'), path.resolve(exportDir, 'csv')].forEach(
    (dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  );
}

export function buildVideoFilename(originalName: string) {
  const safeName = originalName.replace(/[^a-zA-Z0-9-_\.]/g, '_');
  const stamp = Date.now().toString(36);
  const hash = crypto.createHash('md5').update(originalName + Date.now()).digest('hex').slice(0, 8);
  const ext = path.extname(safeName) || '.mp4';
  return `${stamp}-${hash}${ext}`;
}

export function getVideoStoragePath(filename: string) {
  return path.resolve(videoDir, filename);
}

export function getPosterStoragePath(filename: string) {
  const nameWithoutExt = path.parse(filename).name;
  return path.resolve(posterDir, `${nameWithoutExt}.jpg`);
}

export function getExportPath(kind: 'quotes' | 'contracts' | 'csv', filename: string) {
  return path.resolve(exportDir, kind, filename);
}

export function getPublicUrlPath(kind: 'videos' | 'posters', filename: string) {
  return `/public/${kind}/${filename}`;
}

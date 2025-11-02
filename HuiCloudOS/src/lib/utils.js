import fs from 'fs';
import os from 'os';
import path from 'path';

export const ROOT_DIR = path.resolve(process.cwd(), 'HuiCloudOS');
export const DATA_DIR = path.resolve(ROOT_DIR, 'data');
export const VIDEO_DIR = path.join(DATA_DIR, 'videos');
export const POSTER_DIR = path.join(DATA_DIR, 'posters');
export const CSV_DIR = path.join(DATA_DIR, 'csv');
export const LOG_DIR = path.join(DATA_DIR, 'logs');

export function ensureDirectories() {
  [DATA_DIR, VIDEO_DIR, POSTER_DIR, CSV_DIR, LOG_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

export function resolveDataPath(...segments) {
  return path.join(DATA_DIR, ...segments);
}

export function sanitizeFilename(name) {
  return name.replace(/[^\w\u4e00-\u9fa5.-]+/g, '_');
}

export function getLocalAddresses(port) {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push(`http://${net.address}:${port}`);
      }
    }
  }
  return results;
}

export function printServerBanner(port) {
  const local = `http://localhost:${port}`;
  const network = getLocalAddresses(port);
  const lines = ['HuiCloud OS 服务已启动', `Local:   ${local}`];
  if (network.length) {
    network.forEach((address) => lines.push(`Network: ${address}`));
  }
  // eslint-disable-next-line no-console
  console.log(lines.join('\n'));
}

export function toCategorySummary(meta = {}) {
  const entries = Object.entries(meta)
    .filter(([, value]) => value && value.length)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${value.join('/')}`;
      }
      return `${key}: ${value}`;
    });
  return entries.join(' | ');
}

export function timestamp() {
  return new Date().toISOString();
}

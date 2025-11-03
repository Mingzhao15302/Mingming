import os from 'os';
import path from 'path';
import fs from 'fs';

export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function resolveDataPath(...segments) {
  return path.join(process.cwd(), 'src', 'data', ...segments);
}

export function resolvePublicPath(...segments) {
  return path.join(process.cwd(), 'public', ...segments);
}

export function printServerAddresses(port) {
  const nets = os.networkInterfaces();
  const results = new Set(['http://localhost:' + port]);
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal) {
        results.add(`http://${net.address}:${port}`);
      }
    }
  }
  console.log('\nHuiCloud OS 服务地址:');
  for (const address of results) {
    console.log('  •', address);
  }
  console.log();
}

export function sanitizeFilename(filename = '') {
  return filename.replace(/[^a-zA-Z0-9-_\.]/g, '_');
}

export function isVideoFile(filename) {
  return /(\.mp4|\.webm|\.ogg|\.mov)$/i.test(filename);
}

export function fileSizeWithinLimit(bytes, limitMb = 100) {
  const max = limitMb * 1024 * 1024;
  return bytes <= max;
}

export function paginate(array, page = 1, pageSize = 30) {
  const total = array.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * pageSize;
  const end = start + pageSize;
  return {
    items: array.slice(start, end),
    page: current,
    pageSize,
    total,
    pages,
  };
}

export function uniqueId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
}

export function parseJsonSafe(content, fallback) {
  try {
    return JSON.parse(content);
  } catch (error) {
    return fallback;
  }
}

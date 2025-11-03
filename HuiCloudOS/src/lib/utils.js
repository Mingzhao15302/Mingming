import fs from 'fs';
import path from 'path';
import os from 'os';
import mime from 'mime-types';

export const ROOT_DIR = path.resolve(process.cwd(), 'src');
export const DATA_DIR = path.join(ROOT_DIR, 'data');
export const VIDEO_DIR = path.join(DATA_DIR, 'videos');
export const POSTER_DIR = path.join(DATA_DIR, 'posters');
export const CSV_DIR = path.join(DATA_DIR, 'csv');
export const TEMP_DIR = path.join(DATA_DIR, 'chunks');
export const EXPORT_DIR = path.resolve(process.cwd(), 'exports');

export const ensureDir = async (dir) => {
  await fs.promises.mkdir(dir, { recursive: true });
};

export const resolveSafePath = (...segments) => {
  const target = path.resolve(...segments);
  if (!target.startsWith(DATA_DIR) && !target.startsWith(EXPORT_DIR)) {
    throw new Error('非法路径访问');
  }
  return target;
};

export const printNetworkAddresses = (port, label = 'Server') => {
  const nets = os.networkInterfaces();
  const addresses = new Set(['127.0.0.1']);
  for (const interfaceName of Object.keys(nets)) {
    for (const net of nets[interfaceName] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.add(net.address);
      }
    }
  }
  const local = `http://localhost:${port}`;
  console.log(`\n${label} ready`);
  console.log(`  Local:   ${local}`);
  for (const addr of addresses) {
    if (addr === '127.0.0.1') continue;
    console.log(`  Network: http://${addr}:${port}`);
  }
};

export const sanitizeFilename = (name) =>
  name
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-');

export const detectMimeFromFilename = (filename) => mime.lookup(filename) || 'application/octet-stream';

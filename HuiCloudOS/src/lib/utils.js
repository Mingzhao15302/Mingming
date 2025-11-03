import fs from 'fs';
import path from 'path';
import os from 'os';

export const ROOT_DIR = path.resolve(process.cwd(), 'src');
export const DATA_DIR = path.join(ROOT_DIR, 'data');
export const VIDEO_DIR = path.join(DATA_DIR, 'videos');
export const POSTER_DIR = path.join(DATA_DIR, 'posters');
export const CSV_DIR = path.join(DATA_DIR, 'csv');
export const DB_FILE = path.join(DATA_DIR, 'db.json');

export function ensureDirectories() {
  [DATA_DIR, VIDEO_DIR, POSTER_DIR, CSV_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

export function getNetworkAddresses(port) {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const key of Object.keys(interfaces)) {
    for (const detail of interfaces[key] || []) {
      if (detail.family === 'IPv4' && !detail.internal) {
        addresses.push(`http://${detail.address}:${port}`);
      }
    }
  }
  return addresses;
}

export function printServerAddresses(port) {
  const local = `http://localhost:${port}`;
  const network = getNetworkAddresses(port);
  console.log(`HuiCloud OS 服务已启动:\n  Local:   ${local}`);
  if (network.length > 0) {
    network.forEach((addr) => console.log(`  Network: ${addr}`));
  } else {
    console.log('  Network: 未检测到外网 IPv4 地址');
  }
}

export function sanitizeFileName(name) {
  return name.replace(/[^\w\d\-_.]+/g, '_');
}

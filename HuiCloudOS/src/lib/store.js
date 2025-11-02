import fs from 'fs';
import path from 'path';
import { DATA_DIR, ensureDirectories, resolveDataPath, timestamp } from './utils.js';

const DB_PATH = path.join(DATA_DIR, 'db.json');
let writeQueue = Promise.resolve();

function init() {
  ensureDirectories();
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ videos: [], products: [], orders: [], quotes: [], contracts: [], settings: { company: {}, logo: '', sales: [] }, maintenance: { logs: [] } }, null, 2));
  }
}

export function readDb() {
  init();
  const text = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(text);
}

export function writeDb(updater) {
  init();
  writeQueue = writeQueue.then(async () => {
    const current = readDb();
    const updated = updater(current) || current;
    fs.writeFileSync(DB_PATH, JSON.stringify(updated, null, 2));
    return updated;
  });
  return writeQueue;
}

export function appendLog(message) {
  return writeDb((db) => {
    const log = `${timestamp()} ${message}`;
    db.maintenance = db.maintenance || { logs: [] };
    db.maintenance.logs.unshift(log);
    return db;
  });
}

export function ensureFile(name) {
  ensureDirectories();
  const filePath = resolveDataPath(name);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return filePath;
}

export { DB_PATH };

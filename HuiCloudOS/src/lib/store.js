import fs from 'fs/promises';
import { DB_FILE, ensureDirectories } from './utils.js';

const DEFAULT_STATE = {
  videos: [],
  products: [],
  orders: [],
  logs: [],
  settings: {
    company: '辉云易达科技有限公司',
    logoUrl: '',
    sales: '张三, 李四, 王五'
  }
};

let writeQueue = Promise.resolve();

async function ensureDB() {
  ensureDirectories();
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify(DEFAULT_STATE, null, 2), 'utf8');
  }
}

export async function readState() {
  await ensureDB();
  const content = await fs.readFile(DB_FILE, 'utf8');
  try {
    const state = JSON.parse(content);
    return { ...DEFAULT_STATE, ...state };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function writeState(updateFn) {
  writeQueue = writeQueue.then(async () => {
    const state = await readState();
    const next = updateFn(state) || state;
    await fs.writeFile(DB_FILE, JSON.stringify(next, null, 2), 'utf8');
    return next;
  });
  return writeQueue;
}

export async function appendLog(entry) {
  const enriched = { id: Date.now().toString(36), timestamp: new Date().toISOString(), ...entry };
  await writeState((state) => ({ ...state, logs: [enriched, ...state.logs].slice(0, 2000) }));
}

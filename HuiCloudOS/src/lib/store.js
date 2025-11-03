import fs from 'fs';
import { resolveDataPath, ensureDir, parseJsonSafe } from './utils.js';

const DB_PATH = resolveDataPath('db.json');
const queue = [];
let writing = false;

function flushQueue() {
  if (writing) return;
  const next = queue.shift();
  if (!next) return;
  writing = true;
  next(() => {
    writing = false;
    flushQueue();
  });
}

function enqueue(task) {
  queue.push(task);
  flushQueue();
}

export function initStore() {
  ensureDir(resolveDataPath());
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(createInitialState(), null, 2));
  }
}

export function createInitialState() {
  return {
    videos: [],
    videoCategories: {},
    products: [],
    cart: [],
    orders: [],
    quotes: [],
    settings: {
      company: {
        name: '辉云智能装备有限公司',
        logo: '',
        contact: '400-800-9000',
        address: '江苏省苏州市工业园区',
      },
      agents: [],
      currency: 'CNY',
      discountRules: [],
    },
    audit: {
      logs: [],
      backups: [],
    },
  };
}

export function readStore() {
  ensureDir(resolveDataPath());
  if (!fs.existsSync(DB_PATH)) {
    initStore();
  }
  const content = fs.readFileSync(DB_PATH, 'utf8');
  return parseJsonSafe(content, createInitialState());
}

export function writeStore(mutator) {
  return new Promise((resolve, reject) => {
    enqueue((done) => {
      try {
        const state = readStore();
        const result = mutator(state);
        fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
        done();
        resolve(result ?? state);
      } catch (error) {
        done();
        reject(error);
      }
    });
  });
}

export function appendLog(entry) {
  return writeStore((state) => {
    const log = {
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    state.audit.logs.unshift(log);
    state.audit.logs = state.audit.logs.slice(0, 5000);
    return log;
  });
}

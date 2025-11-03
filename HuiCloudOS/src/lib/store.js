import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { DATA_DIR } from './utils.js';

const DB_PATH = path.join(DATA_DIR, 'db.json');
let queue = Promise.resolve();

const defaultData = () => ({
  videos: [],
  products: [],
  quotes: [],
  orders: [],
  settings: { company: '辉云易达科技', logo: '', sales: '' },
  logs: []
});

const readRaw = async () => {
  try {
    const content = await fs.promises.readFile(DB_PATH, 'utf8');
    return JSON.parse(content || '{}');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return defaultData();
    }
    throw error;
  }
};

const writeRaw = async (data) => {
  const temp = `${DB_PATH}.tmp`;
  await fs.promises.writeFile(temp, JSON.stringify(data, null, 2), 'utf8');
  await fs.promises.rename(temp, DB_PATH);
};

export const withStore = async (updater) => {
  queue = queue
    .then(async () => {
      const data = await readRaw();
      const result = await updater(data);
      await writeRaw(data);
      return result;
    })
    .catch((error) => {
      queue = Promise.resolve();
      throw error;
    });
  return queue;
};

export const readStore = async () => {
  await queue.catch(() => {});
  return readRaw();
};

export const seedIfEmpty = async () => {
  await withStore((data) => {
    if (!Array.isArray(data.videos)) data.videos = [];
    if (!Array.isArray(data.products) || data.products.length === 0) {
      data.products = Array.from({ length: 16 }).map((_, index) => ({
        id: `P${index + 1}`,
        name: `智能灌装解决方案 ${index + 1}`,
        model: `HX-${100 + index}`,
        price: 58000 + index * 3200,
        stock: 20 + index,
        description: '面向化工/润滑油行业的模块化灌装生产线，支持定制配置。',
        specs: {
          产能: `${60 + index * 5} 桶/小时`,
          适配桶型: index % 2 === 0 ? '方桶' : '圆桶',
          防爆等级: index % 3 === 0 ? 'Ex d IIB T4' : 'Ex d IIC T4'
        },
        tags: ['灌装', '自动线', index % 2 === 0 ? '防爆' : '常规'],
        updatedAt: new Date().toISOString()
      }));
    }
    if (!Array.isArray(data.quotes)) data.quotes = [];
    if (!Array.isArray(data.orders)) data.orders = [];
    if (!data.settings) {
      data.settings = { company: '辉云易达科技', logo: '', sales: '' };
    }
    if (!Array.isArray(data.logs)) data.logs = [];
  });
};

export const appendLog = async (message) => {
  await withStore((data) => {
    data.logs.unshift({ id: crypto.randomUUID(), message, createdAt: new Date().toISOString() });
    data.logs = data.logs.slice(0, 200);
  });
};

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDir, createId } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'db.json');

let cache = null;
let writing = false;
const queue = [];

const productTypes = {
  类型: ['灌装机', '自动线', '码垛机'],
  灌装机型号: ['30A', '30B/BG', '30G/GY', 'ZSQ', 'HX200', '2T'],
  灌装自动线: [
    '1~5L方桶灌装自动线',
    '1~5L圆桶灌装自动线',
    '15~25L铁桶灌装自动线',
    '15~25L塑料桶灌装自动线',
    '15~25L偏心口桶灌装自动线',
    '50~200L桶灌装自动线',
    'IBC桶灌装自动线',
    '袋式灌装线'
  ],
  桶盖: ['塑料盖', '花篮盖', '小口桶盖', '圆形铁盖', '内外盖', '偏心口桶盖'],
  容量: ['0.5~5L', '15~25L', '50L', '200L', '1000L'],
  来料方式: ['直接供料', '泵送', '过滤', '螺杆增压', '压料机', '拉缸', '角座阀', '手阀控制'],
  防爆要求: ['防爆', '不防爆'],
  灌装方式: ['单头', '双头', '三头', '四头', '五头', '六头', '八头'],
  理盖方式: ['自动补盖', '转盘式理盖', '振动盘理盖'],
  放盖方式: ['单吸盘', '双吸盘', '小口桶自动落盖', '自动追踪放盖', '人工放盖'],
  压盖方式: ['5L平板压', '20L平板压', '花篮压盖', '自动辊压', '自动拧盖', '助力拧盖', '自动封盖', '自动捶盖', '自动封袋', '人工压盖'],
  输送方式: ['滚筒', '板链', '步进'],
  缓存方式: ['不锈钢面板', '无动力滚筒', '无动力滚筒延长架', '重托盘缓存输送'],
  VOC要求: ['一体式集气', '灌装阀集气'],
  分桶方式: ['卧式分桶', '立式分桶', '抽底式分桶', '理桶平台', '自动卸桶', '人工上空桶'],
  码垛方式: ['机器人码垛', '悬臂式码垛', '龙门式码垛', '双工位机器人码垛', '双工位悬臂式码垛', '双工位龙门码垛'],
  检重方式: ['动态检重', '静态检重', '检重剔除'],
  贴标方式: ['空桶贴标', '重桶贴标', '顶部贴标', '在线打印贴标'],
  托盘方式: ['托盘库', '托盘分离', '空托盘换线输送', '重托盘换线输送'],
  装箱方式: ['自动开箱', '自动装箱', '自动封箱', '自动码箱'],
  其他功能: ['自动充氮', '自动套内袋', '皮带输盖', '自动喷码', '自动缠绕', '自动捆扎', '180°翻桶']
};

function sampleProduct(id) {
  return {
    id,
    name: `HX 智能灌装系统 ${id.split('-').pop()}`,
    model: `HX-${Math.floor(Math.random() * 900 + 100)}`,
    price: 88000 + Math.floor(Math.random() * 120000),
    type: productTypes.类型[Math.floor(Math.random() * productTypes.类型.length)],
    cover: `/products/${id}/card.jpg`,
    gallery: Array.from({ length: 4 }).map((_, idx) => `/products/${id}/gallery/${idx + 1}.jpg`),
    specs: {
      capacity: productTypes.容量[Math.floor(Math.random() * productTypes.容量.length)],
      throughput: `${10 + Math.floor(Math.random() * 30)} 桶/分钟`,
      automation: ['PLC 控制', '全自动检重', '视觉检测'][Math.floor(Math.random() * 3)]
    },
    highlights: ['模块化设计', '快速换线', '智能诊断']
  };
}

async function readFileSafe() {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

function randomPick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function buildVideoEntry(index) {
  const type = randomPick(productTypes.类型);
  const base = {
    id: createId('vid_'),
    title: `智能生产演示 ${index + 1}`,
    description: '全自动化液体包装示范流程，覆盖灌装、理盖、码垛等环节。',
    fileName: 'sample.mp4',
    posterName: 'sample.jpg',
    fileSize: 10 * 1024 * 1024,
    duration: 120 + Math.floor(Math.random() * 120),
    uploadedAt: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
    tags: ['演示', '自动化', '远程运维'].slice(0, Math.floor(Math.random() * 3) + 1),
    category: {
      产品类型: type,
      灌装机型号: randomPick(productTypes.灌装机型号),
      灌装自动线: randomPick(productTypes.灌装自动线),
      桶盖: randomPick(productTypes.桶盖),
      容量: randomPick(productTypes.容量),
      来料方式: randomPick(productTypes.来料方式),
      防爆要求: randomPick(productTypes.防爆要求),
      灌装方式: randomPick(productTypes.灌装方式),
      理盖方式: randomPick(productTypes.理盖方式),
      放盖方式: randomPick(productTypes.放盖方式),
      压盖方式: randomPick(productTypes.压盖方式),
      输送方式: randomPick(productTypes.输送方式),
      缓存方式: randomPick(productTypes.缓存方式),
      VOC要求: randomPick(productTypes.VOC要求),
      分桶方式: randomPick(productTypes.分桶方式),
      码垛方式: randomPick(productTypes.码垛方式)
    },
    multiSelect: {
      检重方式: productTypes.检重方式.filter(() => Math.random() > 0.5),
      贴标方式: productTypes.贴标方式.filter(() => Math.random() > 0.5),
      托盘方式: productTypes.托盘方式.filter(() => Math.random() > 0.5),
      装箱方式: productTypes.装箱方式.filter(() => Math.random() > 0.5),
      其他功能: productTypes.其他功能.filter(() => Math.random() > 0.6)
    }
  };

  if (type === '灌装机') {
    delete base.category.灌装自动线;
    delete base.category.理盖方式;
    delete base.category.分桶方式;
    delete base.category.码垛方式;
  }
  if (type === '码垛机') {
    delete base.category.灌装机型号;
    delete base.category.灌装自动线;
    delete base.category.来料方式;
    delete base.category.灌装方式;
    delete base.category.理盖方式;
    delete base.category.放盖方式;
    delete base.category.压盖方式;
    delete base.category.输送方式;
    delete base.category.缓存方式;
    delete base.category.VOC要求;
    delete base.category.分桶方式;
  }
  return base;
}

async function writeQueue(data) {
  return new Promise((resolve, reject) => {
    queue.push({ data, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (writing) return;
  const task = queue.shift();
  if (!task) return;
  writing = true;
  try {
    await fs.writeFile(dbPath, JSON.stringify(task.data, null, 2), 'utf-8');
    cache = task.data;
    task.resolve();
  } catch (err) {
    task.reject(err);
  } finally {
    writing = false;
    setImmediate(processQueue);
  }
}

async function ensureInitialData() {
  await ensureDir(dataDir);
  const existing = await readFileSafe();
  if (existing && existing.videos && existing.videos.length >= 2000) {
    cache = existing;
    return;
  }

  const videos = Array.from({ length: 2000 }).map((_, index) => buildVideoEntry(index));
  const products = Array.from({ length: 12 }).map((_, index) => sampleProduct(`prod-${index + 1}`));

  const baseData = {
    videos,
    products,
    orders: [],
    quotes: [],
    logs: [],
    settings: {
      companyName: '辉云智能科技有限公司',
      logo: '/assets/logos/huixin-logo.png',
      sales: ['张业务', '李商务', '王客户成功'],
      currency: 'CNY'
    }
  };

  await fs.writeFile(dbPath, JSON.stringify(baseData, null, 2), 'utf-8');
  cache = baseData;
}

export async function getStore() {
  if (!cache) {
    await ensureInitialData();
  }
  if (!cache) {
    cache = await readFileSafe();
  }
  return cache;
}

export async function saveStore(newData) {
  await ensureDir(dataDir);
  await writeQueue(newData);
  return cache;
}

export async function updateStore(mutator) {
  const store = await getStore();
  const clone = JSON.parse(JSON.stringify(store));
  const result = await mutator(clone);
  await saveStore(clone);
  return result !== undefined ? result : clone;
}

export function getProductTypes() {
  return productTypes;
}

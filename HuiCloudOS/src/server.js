import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import cookie from 'cookie';
import { VIDEO_DIR, POSTER_DIR, CSV_DIR, ensureDirectories, printServerAddresses } from './lib/utils.js';
import { readState, writeState, appendLog } from './lib/store.js';
import { uploadMiddleware } from './lib/upload.js';
import { parseCSV, writeCSV } from './lib/csv.js';

const app = express();
const PORT = process.env.PORT || 5173;
const DIST_DIR = path.join(process.cwd(), 'dist');

ensureDirectories();

app.use(express.json({ limit: '5mb' }));
app.use((req, _res, next) => {
  req.session = getSession(req.headers.cookie);
  next();
});

const sessions = new Map();

function getSession(rawCookie) {
  if (!rawCookie) return null;
  const parsed = cookie.parse(rawCookie);
  const sessionId = parsed['hx_session'];
  if (sessionId && sessions.has(sessionId)) {
    return { id: sessionId, user: sessions.get(sessionId) };
  }
  return null;
}

function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).send('未登录');
  }
  return next();
}

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (username === 'hxadmin' && password === 'hx84556793') {
    const sessionId = crypto.randomUUID();
    const user = { name: '管理员', role: 'admin' };
    sessions.set(sessionId, user);
    res.setHeader('Set-Cookie', cookie.serialize('hx_session', sessionId, { path: '/', httpOnly: false, maxAge: 60 * 60 * 4 }));
    await appendLog({ level: 'INFO', message: `${username} 登录成功` });
    return res.json({ user });
  }
  await appendLog({ level: 'WARN', message: `登录失败：${username}` });
  return res.status(401).send('账号或密码错误');
});

app.post('/api/logout', (req, res) => {
  if (req.session?.id) {
    sessions.delete(req.session.id);
  }
  res.setHeader('Set-Cookie', cookie.serialize('hx_session', '', { path: '/', maxAge: 0 }));
  res.status(204).end();
});

app.get('/api/session', (req, res) => {
  if (req.session?.user) {
    return res.json({ user: req.session.user });
  }
  return res.json({ user: null });
});

app.get('/api/videos', async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 30;
  const filters = { ...req.query };
  delete filters.page;
  delete filters.pageSize;
  const state = await readState();
  const filtered = state.videos.filter((video) => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      if (Array.isArray(value)) {
        return value.every((v) => video.meta?.[key]?.includes?.(v) || video[key] === v);
      }
      return video.meta?.[key] === value || video[key] === value;
    });
  });
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize).map((video) => ({
    ...video,
    streamUrl: `/api/videos/${video.id}/stream`,
    posterUrl: video.poster ? `/api/videos/${video.id}/poster` : ''
  }));
  res.json({ items, total: filtered.length, page, pageSize });
});

app.post('/api/videos/upload', requireAuth, uploadMiddleware.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('未接收到文件');
  }
  if (file.size > 100 * 1024 * 1024) {
    await fs.unlink(file.path).catch(() => {});
    return res.status(400).send('文件超过 100MB 限制');
  }
  await writeState((state) => ({
    ...state,
    videos: [
      {
        id: crypto.randomUUID(),
        title: file.originalname,
        filename: path.basename(file.path),
        size: file.size,
        category: '',
        meta: {},
        createdAt: Date.now()
      },
      ...state.videos
    ]
  }));
  res.json({ success: true });
});

app.put('/api/videos/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const payload = req.body || {};
  await writeState((state) => ({
    ...state,
    videos: state.videos.map((video) => (video.id === id ? { ...video, ...payload } : video))
  }));
  res.json({ success: true });
});

app.get('/api/videos/:id/stream', async (req, res) => {
  const { id } = req.params;
  const state = await readState();
  const video = state.videos.find((item) => item.id === id);
  if (!video) return res.status(404).send('未找到视频');
  res.sendFile(path.join(VIDEO_DIR, video.filename));
});

app.get('/api/videos/:id/download', async (req, res) => {
  const { id } = req.params;
  const state = await readState();
  const video = state.videos.find((item) => item.id === id);
  if (!video) return res.status(404).send('未找到视频');
  res.download(path.join(VIDEO_DIR, video.filename), video.title);
});

app.get('/api/videos/:id/poster', async (req, res) => {
  const { id } = req.params;
  const filePath = path.join(POSTER_DIR, `${id}.png`);
  try {
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch {
    res.status(404).send('未找到海报');
  }
});

app.post('/api/videos/:id/poster', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { data } = req.body || {};
  if (!data?.startsWith('data:image/png;base64,')) {
    return res.status(400).send('无效的图像数据');
  }
  const buffer = Buffer.from(data.replace('data:image/png;base64,', ''), 'base64');
  await fs.writeFile(path.join(POSTER_DIR, `${id}.png`), buffer);
  await writeState((state) => ({
    ...state,
    videos: state.videos.map((video) => (video.id === id ? { ...video, poster: true } : video))
  }));
  res.json({ success: true });
});

app.post('/api/videos/import', requireAuth, uploadMiddleware.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).send('未提供文件');
  const rows = await parseCSV(req.file.path);
  await fs.unlink(req.file.path).catch(() => {});
  await writeState((state) => ({
    ...state,
    videos: state.videos.map((video) => {
      const matched = rows.find((row) => row.filename === video.title || row.filename === video.filename);
      if (matched) {
        return { ...video, meta: { ...video.meta, ...matched } };
      }
      return video;
    })
  }));
  res.json({ success: true });
});

app.get('/api/videos/export', requireAuth, async (_req, res) => {
  const state = await readState();
  const rows = state.videos.map((video) => ({ filename: video.title, category: video.category, ...video.meta }));
  const filePath = path.join(CSV_DIR, `videos-${Date.now()}.csv`);
  await writeCSV(filePath, rows);
  res.download(filePath, `videos-${Date.now()}.csv`);
});

app.get('/api/products', async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = 12;
  const state = await ensureProducts();
  const start = (page - 1) * pageSize;
  const items = state.products.slice(start, start + pageSize);
  res.json({ items, total: state.products.length, page, pageSize });
});

app.get('/api/products/:id', async (req, res) => {
  const state = await ensureProducts();
  const product = state.products.find((item) => item.id === req.params.id);
  if (!product) return res.status(404).send('未找到产品');
  res.json(product);
});

app.get('/api/orders', requireAuth, async (_req, res) => {
  const state = await readState();
  res.json(state.orders);
});

app.post('/api/orders', async (req, res) => {
  const order = { id: crypto.randomUUID(), createdAt: Date.now(), ...req.body };
  await writeState((state) => ({ ...state, orders: [order, ...state.orders] }));
  await appendLog({ level: 'INFO', message: `新订单 ${order.id}` });
  res.json(order);
});

app.get('/api/export/orders', requireAuth, async (_req, res) => {
  const state = await readState();
  const rows = state.orders.map((order) => ({ id: order.id, total: order.total, customer: order.form?.company, createdAt: new Date(order.createdAt).toISOString() }));
  const filePath = path.join(CSV_DIR, `orders-${Date.now()}.csv`);
  await writeCSV(filePath, rows);
  res.download(filePath, path.basename(filePath));
});

app.get('/api/export/products', requireAuth, async (_req, res) => {
  const state = await ensureProducts();
  const rows = state.products.map((product) => ({ id: product.id, name: product.name, model: product.model, price: product.price }));
  const filePath = path.join(CSV_DIR, `products-${Date.now()}.csv`);
  await writeCSV(filePath, rows);
  res.download(filePath, path.basename(filePath));
});

app.get('/api/settings', requireAuth, async (_req, res) => {
  const state = await readState();
  res.json(state.settings);
});

app.get('/api/logs', requireAuth, async (_req, res) => {
  const state = await readState();
  res.json(state.logs.slice(0, 50));
});

app.use('/api/videos/files', express.static(VIDEO_DIR));
app.use('/api/posters', express.static(POSTER_DIR));

if (process.env.NODE_ENV !== 'development') {
  app.use(express.static(DIST_DIR));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  printServerAddresses(PORT);
});

async function ensureProducts() {
  return writeState((state) => {
    if (state.products.length >= 24) return state;
    const defaults = new Array(30).fill(null).map((_, index) => ({
      id: `prod-${index + 1}`,
      name: `智能灌装设备 ${index + 1}`,
      model: `HX-${1000 + index}`,
      price: 50000 + index * 1500,
      specs: ['高精度称重', '自动补盖', '支持防爆配置'],
      images: [`/products/${index + 1}/cover.png`]
    }));
    return { ...state, products: defaults };
  });
}

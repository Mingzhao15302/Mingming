import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { uploadMiddleware } from './lib/upload.js';
import { appendLog, readDb, writeDb } from './lib/store.js';
import { ensureDirectories, POSTER_DIR, VIDEO_DIR, DATA_DIR, printServerBanner, sanitizeFilename, toCategorySummary } from './lib/utils.js';
import { stringifyCsv } from './lib/csv.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 5173;
const isProduction = process.env.NODE_ENV === 'production';

ensureDirectories();

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/media/videos', express.static(VIDEO_DIR));
app.use('/media/posters', express.static(POSTER_DIR));

function paginate(items, page = 1, pageSize = 30) {
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return { items: paged, page, pageSize, total: items.length };
}

function normalizeVideo(video) {
  return {
    ...video,
    streamUrl: `/media/videos/${video.storageName}`,
    downloadUrl: `/media/videos/${video.storageName}`,
    posterUrl: video.poster ? `/media/posters/${video.poster}` : '',
    categorySummary: toCategorySummary(video.meta)
  };
}

app.post('/api/login', (req, res) => {
  const { account, password } = req.body;
  if (account === 'hxadmin' && password === 'hx84556793') {
    res.json({ user: { account, role: 'admin' } });
  } else {
    res.status(401).send('账号或密码错误');
  }
});

app.get('/api/videos', (req, res) => {
  const { page = '1', pageSize = '30', search = '', filters = '{}' } = req.query;
  const pageNumber = Number(page);
  const pageSizeNumber = Number(pageSize);
  const db = readDb();
  const filterObj = JSON.parse(filters || '{}');
  const items = db.videos
    .filter((video) => {
      if (search && !video.filename.toLowerCase().includes(String(search).toLowerCase())) {
        return false;
      }
      return Object.entries(filterObj).every(([key, value]) => {
        if (value === undefined || value === null || value === '') return true;
        const metaValue = video.meta?.[key];
        if (Array.isArray(value)) {
          if (!Array.isArray(metaValue)) return false;
          return value.every((entry) => metaValue.includes(entry));
        }
        return metaValue === value;
      });
    })
    .map(normalizeVideo);
  res.json(paginate(items, pageNumber, pageSizeNumber));
});

app.post('/api/videos/upload', uploadMiddleware.array('files'), async (req, res) => {
  const files = req.files || [];
  if (!files.length) {
    res.status(400).send('缺少文件');
    return;
  }
  await writeDb((db) => {
    files.forEach((file) => {
      const record = {
        id: file.filename,
        storageName: file.filename,
        filename: file.originalname,
        size: file.size,
        createdAt: new Date().toISOString(),
        meta: {}
      };
      db.videos.unshift(record);
    });
    return db;
  });
  appendLog(`上传 ${files.length} 个视频`);
  res.json({ uploaded: files.map((file) => file.filename) });
});

app.put('/api/videos/:id', async (req, res) => {
  const { id } = req.params;
  const { meta = {}, title } = req.body || {};
  const updated = await writeDb((db) => {
    db.videos = db.videos.map((video) => (video.id === id ? { ...video, meta, title } : video));
    return db;
  });
  const video = updated.videos.find((item) => item.id === id);
  if (!video) {
    res.status(404).send('视频不存在');
    return;
  }
  res.json(normalizeVideo(video));
});

app.delete('/api/videos/:id', async (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const target = db.videos.find((item) => item.id === id);
  if (!target) {
    res.status(404).send('未找到视频');
    return;
  }
  try {
    fs.unlinkSync(path.join(VIDEO_DIR, target.storageName));
  } catch (error) {
    // ignore if file missing
  }
  await writeDb((state) => {
    state.videos = state.videos.filter((video) => video.id !== id);
    return state;
  });
  res.json({ success: true });
});

app.post('/api/videos/:id/poster', async (req, res) => {
  const { id } = req.params;
  const { dataUrl } = req.body;
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    res.status(400).send('无效的首帧图数据');
    return;
  }
  const base64 = dataUrl.split(',')[1];
  const buffer = Buffer.from(base64, 'base64');
  const filename = `${sanitizeFilename(id)}.jpg`;
  fs.writeFileSync(path.join(POSTER_DIR, filename), buffer);
  await writeDb((db) => {
    db.videos = db.videos.map((video) => (video.id === id ? { ...video, poster: filename } : video));
    return db;
  });
  res.json({ poster: filename });
});

app.post('/api/videos/csv/import', async (req, res) => {
  const { rows = [] } = req.body;
  await writeDb((db) => {
    rows.forEach((row) => {
      const filename = row.filename || row.文件名;
      if (!filename) return;
      db.videos = db.videos.map((video) =>
        video.filename === filename || video.storageName === filename
          ? { ...video, meta: { ...video.meta, ...row } }
          : video
      );
    });
    return db;
  });
  res.json({ updated: rows.length });
});

app.get('/api/videos/csv/export', (req, res) => {
  const db = readDb();
  const headers = ['filename', 'title', 'size'];
  const rows = db.videos.map((video) => ({
    filename: video.filename,
    title: video.title || '',
    size: video.size,
    ...video.meta
  }));
  const csv = stringifyCsv(headers, rows);
  res.header('Content-Type', 'text/csv;charset=utf-8');
  res.send(csv);
});

app.get('/api/products', (req, res) => {
  const { page = '1', pageSize = '12' } = req.query;
  const db = readDb();
  res.json(paginate(db.products || [], Number(page), Number(pageSize)));
});

app.get('/api/products/:id', (req, res) => {
  const db = readDb();
  const item = (db.products || []).find((product) => String(product.id) === req.params.id);
  if (!item) {
    res.status(404).send('商品不存在');
    return;
  }
  res.json({ item });
});

app.post('/api/products', async (req, res) => {
  const { name, price, description } = req.body;
  if (!name) {
    res.status(400).send('名称必填');
    return;
  }
  const record = {
    id: Date.now().toString(36),
    name,
    price: Number(price || 0),
    description: description || '',
    gallery: [],
    specs: ''
  };
  await writeDb((db) => {
    db.products = db.products || [];
    db.products.unshift(record);
    return db;
  });
  res.json(record);
});

app.delete('/api/products/:id', async (req, res) => {
  await writeDb((db) => {
    db.products = (db.products || []).filter((item) => String(item.id) !== req.params.id);
    return db;
  });
  res.json({ success: true });
});

app.get('/api/orders', (req, res) => {
  const db = readDb();
  res.json({ items: db.orders || [] });
});

app.post('/api/orders', async (req, res) => {
  const order = { ...req.body, id: Date.now().toString(36), createdAt: new Date().toISOString(), status: '已提交' };
  await writeDb((db) => {
    db.orders = db.orders || [];
    db.orders.unshift(order);
    return db;
  });
  appendLog(`创建订单 ${order.id}`);
  res.json(order);
});

app.get('/api/quotes', (req, res) => {
  const db = readDb();
  res.json({ items: db.quotes || [] });
});

app.post('/api/quotes', async (req, res) => {
  const { customer, contact, discount = 0, items = '' } = req.body;
  const record = {
    id: Date.now().toString(36),
    customer,
    contact,
    discount: Number(discount),
    items: typeof items === 'string' ? items.split(',').map((item) => item.trim()).filter(Boolean) : items
  };
  await writeDb((db) => {
    db.quotes = db.quotes || [];
    db.quotes.unshift(record);
    return db;
  });
  res.json(record);
});

app.get('/api/contracts', (req, res) => {
  const db = readDb();
  res.json({ items: db.contracts || [] });
});

app.post('/api/contracts', async (req, res) => {
  const { name, content } = req.body;
  const record = { id: Date.now().toString(36), name, content };
  await writeDb((db) => {
    db.contracts = db.contracts || [];
    db.contracts.unshift(record);
    return db;
  });
  res.json(record);
});

app.post('/api/exports', (req, res) => {
  const { type } = req.body;
  const result = { type, createdAt: new Date().toISOString() };
  appendLog(`生成导出 ${type}`);
  res.json(result);
});

app.get('/api/settings', (req, res) => {
  const db = readDb();
  res.json(db.settings || { company: {}, logo: '', sales: [] });
});

app.post('/api/settings', async (req, res) => {
  const payload = req.body;
  await writeDb((db) => {
    db.settings = { ...db.settings, ...payload };
    return db;
  });
  res.json({ success: true });
});

app.get('/api/maintenance', (req, res) => {
  const db = readDb();
  res.json(db.maintenance || { logs: [] });
});

app.post('/api/maintenance/backup', async (req, res) => {
  const backupName = `backup-${Date.now()}.json`;
  const backupPath = path.join(VIDEO_DIR, '..', backupName);
  fs.copyFileSync(path.join(DATA_DIR, 'db.json'), backupPath);
  appendLog(`创建备份 ${backupName}`);
  res.json({ backup: backupName });
});

app.post('/api/maintenance/purge', async (req, res) => {
  await writeDb((db) => {
    db.maintenance = { logs: [] };
    return db;
  });
  res.json({ success: true });
});

async function createServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, '../vite.config.js'),
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, '../dist');
    app.use(express.static(distPath));
    app.use('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    printServerBanner(port);
  });
}

createServer();

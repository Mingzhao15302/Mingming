import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import {
  ensureDir,
  DATA_DIR,
  VIDEO_DIR,
  POSTER_DIR,
  CSV_DIR,
  TEMP_DIR,
  EXPORT_DIR,
  detectMimeFromFilename,
  printNetworkAddresses,
  sanitizeFilename
} from './lib/utils.js';
import { withStore, seedIfEmpty, appendLog, readStore } from './lib/store.js';
import { parseCsv, stringifyCsv } from './lib/csv.js';
import { saveChunk, mergeChunks } from './lib/upload.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const app = express();
const PORT = process.env.PORT || 8080;
const AUTH_ACCOUNT = 'hxadmin';
const AUTH_PASSWORD = 'hx84556793';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
app.post('/api/auth/login', authLimiter, (req, res) => {
  const { account, password } = req.body;
  if (account === AUTH_ACCOUNT && password === AUTH_PASSWORD) {
    const token = crypto.randomUUID();
    res.json({ token, profile: { account } });
  } else {
    res.status(401).json({ message: '账号或密码错误' });
  }
});

const mapVideoResponse = (video) => {
  const posterUrl = video.poster ? `/media/posters/${video.poster}` : null;
  return {
    ...video,
    streamUrl: `/api/videos/${video.id}/stream`,
    downloadUrl: `/api/videos/${video.id}/download`,
    posterUrl
  };
};

app.get('/api/videos', async (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 30);
  const keyword = (req.query.keyword || '').toLowerCase();
  const filters = { ...req.query };
  delete filters.page;
  delete filters.pageSize;
  delete filters.keyword;
  const store = await readStore();
  let items = store.videos || [];
  if (keyword) {
    items = items.filter((video) =>
      [video.title, video.originalName, video.category?.productType, ...(video.tags || [])]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }
  Object.entries(filters).forEach(([key, value]) => {
    if (!value) return;
    const values = String(value).split(',');
    items = items.filter((video) => {
      const categoryValue = video.category?.[key];
      if (Array.isArray(categoryValue)) {
        return categoryValue.some((entry) => values.includes(entry));
      }
      return values.includes(categoryValue);
    });
  });
  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize).map(mapVideoResponse);
  res.json({ items: paged, total, hasMore: start + pageSize < total });
});

app.post('/api/videos/upload-chunk', upload.single('file'), async (req, res) => {
  try {
    const { filename, index, total, size } = req.body;
    if (!req.file) {
      return res.status(400).send('缺少文件分片');
    }
    const totalChunks = Number(total);
    const chunkIndex = Number(index);
    if (Number(size) > 100 * 1024 * 1024) {
      return res.status(400).send('文件超过 100MB 限制');
    }
    await saveChunk({ filename, index: chunkIndex, buffer: req.file.buffer });
    res.json({ success: true, total: totalChunks });
  } catch (error) {
    console.error('上传分片失败', error);
    res.status(500).send(error.message || '上传失败');
  }
});

app.post('/api/videos/complete', async (req, res) => {
  try {
    const { filename, size, total } = req.body;
    const mime = detectMimeFromFilename(filename);
    const safeName = sanitizeFilename(filename);
    let expected = Number(total);
    if (!Number.isFinite(expected) || expected <= 0) {
      try {
        const files = await fs.promises.readdir(path.join(TEMP_DIR, safeName));
        expected = files.filter((name) => name.endsWith('.part')).length;
      } catch (error) {
        expected = 0;
      }
    }
    if (!expected) {
      throw new Error('缺少分片信息');
    }
    const video = await mergeChunks({ filename, originalName: filename, total: expected, size: Number(size), mime });
    await withStore((data) => {
      data.videos.unshift({
        id: video.id,
        filename: video.filename,
        originalName: video.originalName,
        title: path.parse(video.originalName).name,
        size: video.size,
        mime: video.mime,
        createdAt: new Date().toISOString(),
        category: { productType: '' },
        tags: []
      });
    });
    await appendLog(`上传视频 ${filename}`);
    res.json(mapVideoResponse({ ...video, createdAt: new Date().toISOString(), category: { productType: '' }, tags: [] }));
  } catch (error) {
    console.error('合并失败', error);
    res.status(500).send(error.message || '合并失败');
  }
});

app.post('/api/videos/:id/poster', async (req, res) => {
  const { id } = req.params;
  const { dataUrl } = req.body;
  if (!dataUrl) return res.status(400).send('缺少数据');
  const [meta, base64] = dataUrl.split(',');
  if (!base64) return res.status(400).send('数据格式错误');
  const match = meta.match(/data:(.*);base64/);
  const ext = match ? match[1].split('/')[1] : 'jpg';
  const buffer = Buffer.from(base64, 'base64');
  const posterName = `${id}.${ext}`;
  await ensureDir(POSTER_DIR);
  await fs.promises.writeFile(path.join(POSTER_DIR, posterName), buffer);
  await withStore((data) => {
    const video = data.videos.find((item) => item.id === id);
    if (video) {
      video.poster = posterName;
    }
  });
  res.json({ success: true, poster: posterName });
});

app.patch('/api/videos/:id', async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  await withStore((data) => {
    const video = data.videos.find((item) => item.id === id);
    if (!video) throw new Error('未找到视频');
    if (payload.title !== undefined) video.title = payload.title;
    if (payload.category !== undefined) {
      video.category = { ...video.category, ...payload.category };
    }
  });
  res.json({ success: true });
});

app.delete('/api/videos/:id', async (req, res) => {
  const { id } = req.params;
  await withStore((data) => {
    const index = data.videos.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error('未找到视频');
    }
    const [video] = data.videos.splice(index, 1);
    const filePath = path.join(VIDEO_DIR, video.filename);
    fs.promises.unlink(filePath).catch(() => {});
    if (video.poster) {
      fs.promises.unlink(path.join(POSTER_DIR, video.poster)).catch(() => {});
    }
  });
  await appendLog(`删除视频 ${id}`);
  res.json({ success: true });
});

app.post('/api/videos/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).send('缺少文件');
  const text = req.file.buffer.toString('utf8');
  await ensureDir(CSV_DIR);
  const savePath = path.join(CSV_DIR, `${Date.now()}-${sanitizeFilename(req.file.originalname)}`);
  await fs.promises.writeFile(savePath, text, 'utf8');
  const { headers, records } = parseCsv(text);
  await withStore((data) => {
    records.forEach((record) => {
      const matchKey = record.filename || record.file || record.文件名;
      if (!matchKey) return;
      const video = data.videos.find((item) => item.originalName === matchKey || item.filename === matchKey);
      if (!video) return;
      const category = { ...(video.category || {}) };
      headers.forEach((header) => {
        if (!record[header]) return;
        category[header] = record[header].includes('|') ? record[header].split('|') : record[header];
      });
      video.category = category;
    });
  });
  await appendLog('导入 CSV 更新视频分类');
  res.json({ success: true, headers, preview: records.slice(0, 5) });
});

app.get('/api/videos/export', async (req, res) => {
  const store = await readStore();
  const headers = ['filename', 'title', 'productType'];
  const records = store.videos.map((video) => ({
    filename: video.originalName,
    title: video.title,
    productType: video.category?.productType || ''
  }));
  const csv = stringifyCsv(records, headers);
  res.setHeader('Content-Type', 'text/csv;charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=videos-${Date.now()}.csv`);
  res.send(csv);
});

const streamVideo = async (video, req, res) => {
  const filePath = path.join(VIDEO_DIR, video.filename);
  const stat = await fs.promises.stat(filePath);
  const range = req.headers.range;
  if (!range) {
    res.setHeader('Content-Type', video.mime);
    res.setHeader('Content-Length', stat.size);
    fs.createReadStream(filePath).pipe(res);
    return;
  }
  const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
  const start = Number(startStr);
  const end = endStr ? Number(endStr) : stat.size - 1;
  const chunkSize = end - start + 1;
  res.status(206);
  res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Length', chunkSize);
  res.setHeader('Content-Type', video.mime);
  fs.createReadStream(filePath, { start, end }).pipe(res);
};

app.get('/api/videos/:id/stream', async (req, res) => {
  const store = await readStore();
  const video = store.videos.find((item) => item.id === req.params.id);
  if (!video) return res.status(404).send('Not Found');
  await streamVideo(video, req, res);
});

app.get('/api/videos/:id/download', async (req, res) => {
  const store = await readStore();
  const video = store.videos.find((item) => item.id === req.params.id);
  if (!video) return res.status(404).send('Not Found');
  const filePath = path.join(VIDEO_DIR, video.filename);
  res.download(filePath, video.originalName);
});

app.get('/api/products', async (req, res) => {
  const store = await readStore();
  res.json({ items: store.products });
});

app.get('/api/quotes', async (req, res) => {
  const store = await readStore();
  res.json({ items: store.quotes });
});

app.post('/api/quotes', async (req, res) => {
  const payload = req.body;
  const quote = {
    id: crypto.randomUUID(),
    name: payload.name,
    discount: payload.discount,
    terms: payload.terms,
    createdAt: new Date().toISOString()
  };
  await withStore((data) => {
    data.quotes.unshift(quote);
  });
  await appendLog(`新增报价模板 ${quote.name || quote.id}`);
  res.json(quote);
});

app.get('/api/orders', async (req, res) => {
  const store = await readStore();
  res.json({ items: store.orders });
});

app.post('/api/orders', async (req, res) => {
  const payload = req.body;
  const order = {
    id: `ORD-${Date.now()}`,
    customer: payload.customer,
    items: payload.items || [],
    total: payload.total,
    discount: payload.discount,
    final: payload.final,
    createdAt: new Date().toISOString()
  };
  await withStore((data) => {
    data.orders.unshift(order);
  });
  await appendLog(`创建订单 ${order.id}`);
  res.json(order);
});

app.get('/api/settings', async (req, res) => {
  const store = await readStore();
  res.json(store.settings || {});
});

app.put('/api/settings', async (req, res) => {
  const payload = req.body;
  await withStore((data) => {
    data.settings = { ...data.settings, ...payload, updatedAt: new Date().toISOString() };
  });
  await appendLog('更新系统设置');
  const store = await readStore();
  res.json(store.settings);
});

app.get('/api/maintenance', async (req, res) => {
  const store = await readStore();
  res.json({ logs: store.logs });
});

app.post('/api/maintenance/backup', async (req, res) => {
  await ensureDir(EXPORT_DIR);
  const store = await readStore();
  const backupPath = path.join(EXPORT_DIR, `backup-${Date.now()}.json`);
  await fs.promises.writeFile(backupPath, JSON.stringify(store, null, 2), 'utf8');
  await appendLog('执行系统备份');
  res.json({ success: true, path: backupPath });
});

app.use('/media/posters', express.static(POSTER_DIR));

const distDir = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const bootstrap = async () => {
  await Promise.all([
    ensureDir(DATA_DIR),
    ensureDir(VIDEO_DIR),
    ensureDir(POSTER_DIR),
    ensureDir(CSV_DIR),
    ensureDir(TEMP_DIR),
    ensureDir(EXPORT_DIR)
  ]);
  await seedIfEmpty();
  app.listen(PORT, () => {
    printNetworkAddresses(PORT, 'HuiCloud OS');
  });
};

bootstrap();

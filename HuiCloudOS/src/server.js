import express from 'express';
import fs from 'fs';
import path from 'path';
import { initStore, readStore, writeStore, appendLog } from './lib/store.js';
import {
  ensureDir,
  resolveDataPath,
  resolvePublicPath,
  printServerAddresses,
  sanitizeFilename,
  isVideoFile,
  paginate,
  uniqueId,
} from './lib/utils.js';
import { uploadMiddleware, moveUploadedFile, validateFileSize } from './lib/upload.js';
import { stringifyCsv, parseCsv } from './lib/csv.js';

const app = express();
const PORT = process.env.PORT || 8080;

initStore();
ensureDir(resolveDataPath('videos'));
ensureDir(resolveDataPath('posters'));
ensureDir(resolveDataPath('csv'));

app.use(express.json({ limit: '10mb' }));
app.use('/assets', express.static(resolvePublicPath('assets'), { maxAge: '1d' }));
app.use('/api/static/videos', express.static(resolveDataPath('videos')));
app.use('/api/static/posters', express.static(resolveDataPath('posters')));

function parseMulti(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
}

function filterVideos(videos, query) {
  const { search = '' } = query;
  const generalFilters = Object.entries(query).filter(
    ([key]) => !['search', 'page', 'pageSize'].includes(key)
  );

  return videos.filter((video) => {
    const matchSearch = search
      ? [video.title, video.filename, video.description]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(String(search).toLowerCase()))
      : true;

    const matchFilters = generalFilters.every(([key, rawValue]) => {
      const values = parseMulti(rawValue);
      if (!values.length) return true;
      if (key === 'category' || key === 'categories') {
        const list = video.categories ?? [];
        return values.every((val) => list.includes(val));
      }
      if (key === 'productType' || key === 'type') {
        return values.includes(video.productType ?? '');
      }
      const metaValue = video.meta?.[key];
      if (Array.isArray(metaValue)) {
        return values.every((val) => metaValue.includes(val));
      }
      if (typeof metaValue === 'string') {
        return values.includes(metaValue);
      }
      return true;
    });

    return matchSearch && matchFilters;
  });
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body ?? {};
  if (username === 'hxadmin' && password === 'hx84556793') {
    res.json({ success: true, token: 'mock-token', user: { name: '辉云管理员' } });
  } else {
    res.status(401).json({ success: false, message: '账号或密码错误' });
  }
});

app.get('/api/dashboard', (_req, res) => {
  const state = readStore();
  res.json({
    totals: {
      videos: state.videos.length,
      orders: state.orders.length,
      products: state.products.length,
      quotes: state.quotes.length,
    },
    audit: state.audit.logs.slice(0, 20),
  });
});

app.get('/api/videos', (req, res) => {
  const state = readStore();
  const page = Number(req.query.page ?? '1') || 1;
  const pageSize = Number(req.query.pageSize ?? '30') || 30;
  const filtered = filterVideos(state.videos, req.query);
  const result = paginate(filtered, page, pageSize);
  res.json({
    ...result,
  });
});

app.post('/api/videos/upload', uploadMiddleware.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '缺少文件' });
  }
  try {
    validateFileSize(req.file.size);
  } catch (error) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: error.message });
  }
  const safeName = sanitizeFilename(req.file.originalname);
  if (!isVideoFile(safeName)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: '仅支持视频文件' });
  }
  const id = uniqueId('video');
  const finalPath = moveUploadedFile(
    req.file.path,
    resolveDataPath('videos'),
    `${id}-${safeName}`
  );
  const sizeMb = (req.file.size / (1024 * 1024)).toFixed(2);
  writeStore((state) => {
    const record = {
      id,
      title: safeName,
      filename: path.basename(finalPath),
      originalName: safeName,
      sizeMb: Number(sizeMb),
      uploadedAt: new Date().toISOString(),
      categories: [],
      meta: {},
    };
    state.videos.unshift(record);
    appendLog({
      type: 'upload',
      message: `上传视频 ${safeName}`,
    });
    return record;
  })
    .then((record) => {
      res.json({ success: true, video: record });
    })
    .catch((error) => {
      res.status(500).json({ success: false, message: error.message });
    });
});

app.post('/api/videos/:id/poster', (req, res) => {
  const { id } = req.params;
  const { dataUrl } = req.body ?? {};
  if (!dataUrl || typeof dataUrl !== 'string') {
    return res.status(400).json({ message: '缺少数据' });
  }
  const match = dataUrl.match(/^data:(image\/(png|jpeg));base64,(.+)$/);
  if (!match) {
    return res.status(400).json({ message: '无效的图片数据' });
  }
  const [, mime, , base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  const ext = mime === 'image/png' ? 'png' : 'jpg';
  const fileName = `${id}.${ext}`;
  const filePath = path.join(resolveDataPath('posters'), fileName);
  fs.writeFileSync(filePath, buffer);
  writeStore((state) => {
    const item = state.videos.find((v) => v.id === id);
    if (item) {
      item.poster = fileName;
    }
  })
    .then(() => {
      res.json({ success: true, poster: fileName });
    })
    .catch((error) => {
      res.status(500).json({ success: false, message: error.message });
    });
});

app.put('/api/videos/:id', (req, res) => {
  const { id } = req.params;
  writeStore((state) => {
    const target = state.videos.find((video) => video.id === id);
    if (!target) {
      throw new Error('视频不存在');
    }
    Object.assign(target, req.body ?? {});
    return target;
  })
    .then((record) => res.json({ success: true, video: record }))
    .catch((error) => res.status(404).json({ success: false, message: error.message }));
});

app.delete('/api/videos/:id', (req, res) => {
  const { id } = req.params;
  writeStore((state) => {
    const index = state.videos.findIndex((video) => video.id === id);
    if (index === -1) {
      throw new Error('视频不存在');
    }
    const [removed] = state.videos.splice(index, 1);
    if (removed?.filename) {
      const filePath = path.join(resolveDataPath('videos'), removed.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    if (removed?.poster) {
      const posterPath = path.join(resolveDataPath('posters'), removed.poster);
      if (fs.existsSync(posterPath)) {
        fs.unlinkSync(posterPath);
      }
    }
    return removed;
  })
    .then((removed) => res.json({ success: true, removed }))
    .catch((error) => res.status(404).json({ success: false, message: error.message }));
});

app.post('/api/videos/import', uploadMiddleware.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '缺少文件' });
  }
  const text = fs.readFileSync(req.file.path, 'utf8').replace(/^\uFEFF/, '');
  fs.unlinkSync(req.file.path);
  const rows = parseCsv(text);
  writeStore((state) => {
    for (const row of rows) {
      const target = state.videos.find((video) => video.originalName === row.filename);
      if (target) {
        target.categories = row.categories ? row.categories.split('|') : [];
        target.meta = row.meta ? JSON.parse(row.meta) : {};
      }
    }
  })
    .then(() => res.json({ success: true, count: rows.length }))
    .catch((error) => res.status(500).json({ success: false, message: error.message }));
});

app.get('/api/videos/export', (_req, res) => {
  const state = readStore();
  const rows = state.videos.map((video) => ({
    id: video.id,
    filename: video.originalName,
    storedFilename: video.filename,
    categories: (video.categories ?? []).join('|'),
    productType: video.productType ?? '',
    meta: JSON.stringify(video.meta ?? {}),
  }));
  const csv = stringifyCsv(rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="videos.csv"');
  res.send(csv);
});

app.get('/api/products', (_req, res) => {
  const state = readStore();
  res.json({ items: state.products });
});

app.post('/api/products', (req, res) => {
  const payload = req.body ?? {};
  const id = uniqueId('product');
  payload.id = id;
  writeStore((state) => {
    state.products.push({
      id,
      name: payload.name ?? '未命名产品',
      price: Number(payload.price ?? 0),
      category: payload.category ?? '',
      specs: payload.specs ?? [],
      gallery: payload.gallery ?? [],
      description: payload.description ?? '',
    });
  })
    .then(() => res.json({ success: true, id }))
    .catch((error) => res.status(500).json({ success: false, message: error.message }));
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  writeStore((state) => {
    const target = state.products.find((product) => product.id === id);
    if (!target) {
      throw new Error('产品不存在');
    }
    Object.assign(target, req.body ?? {});
    return target;
  })
    .then((product) => res.json({ success: true, product }))
    .catch((error) => res.status(404).json({ success: false, message: error.message }));
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  writeStore((state) => {
    const index = state.products.findIndex((product) => product.id === id);
    if (index === -1) {
      throw new Error('产品不存在');
    }
    const [removed] = state.products.splice(index, 1);
    return removed;
  })
    .then((removed) => res.json({ success: true, removed }))
    .catch((error) => res.status(404).json({ success: false, message: error.message }));
});

app.post('/api/orders', (req, res) => {
  const payload = req.body ?? {};
  const id = uniqueId('order');
  writeStore((state) => {
    const order = {
      id,
      customer: payload.customer ?? {},
      items: payload.items ?? [],
      total: payload.total ?? 0,
      status: payload.status ?? 'pending',
      createdAt: new Date().toISOString(),
    };
    state.orders.unshift(order);
    return order;
  })
    .then((order) => res.json({ success: true, order }))
    .catch((error) => res.status(500).json({ success: false, message: error.message }));
});

app.get('/api/orders', (_req, res) => {
  const state = readStore();
  res.json({ items: state.orders });
});

app.post('/api/quotes', (req, res) => {
  const payload = req.body ?? {};
  const id = uniqueId('quote');
  writeStore((state) => {
    const quote = {
      id,
      template: payload.template ?? '标准模板',
      customer: payload.customer ?? {},
      items: payload.items ?? [],
      discount: payload.discount ?? 0,
      total: payload.total ?? 0,
      createdAt: new Date().toISOString(),
    };
    state.quotes.unshift(quote);
    return quote;
  })
    .then((quote) => res.json({ success: true, quote }))
    .catch((error) => res.status(500).json({ success: false, message: error.message }));
});

app.get('/api/quotes', (_req, res) => {
  const state = readStore();
  res.json({ items: state.quotes });
});

app.get('/api/settings', (_req, res) => {
  const state = readStore();
  res.json(state.settings);
});

app.put('/api/settings', (req, res) => {
  writeStore((state) => {
    state.settings = {
      ...state.settings,
      ...req.body,
    };
    return state.settings;
  })
    .then((settings) => res.json({ success: true, settings }))
    .catch((error) => res.status(500).json({ success: false, message: error.message }));
});

app.get('/api/export/backup', (_req, res) => {
  const state = readStore();
  const payload = {
    createdAt: new Date().toISOString(),
    data: state,
  };
  const content = JSON.stringify(payload, null, 2);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="huicloud-backup.json"');
  res.send(content);
});

app.use(express.static(resolvePublicPath()));
app.get('*', (_req, res) => {
  res.sendFile(path.join(resolvePublicPath(), 'index.html'));
});

app.listen(PORT, () => {
  console.log(`HuiCloud OS API 已启动，端口 ${PORT}`);
  printServerAddresses(PORT);
});

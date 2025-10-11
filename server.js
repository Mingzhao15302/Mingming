import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const VIDEO_DIR = path.join(DATA_DIR, 'videos');
const METADATA_FILE = path.join(DATA_DIR, 'metadata.json');

await fs.mkdir(VIDEO_DIR, { recursive: true });

async function ensureMetadataFile() {
  try {
    await fs.access(METADATA_FILE);
  } catch (error) {
    await fs.writeFile(METADATA_FILE, '[]', 'utf-8');
  }
}

await ensureMetadataFile();

async function readMetadata() {
  const content = await fs.readFile(METADATA_FILE, 'utf-8');
  const data = JSON.parse(content || '[]');
  return Array.isArray(data) ? data : [];
}

async function writeMetadata(records) {
  await fs.writeFile(METADATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, VIDEO_DIR);
  },
  filename: (req, file, cb) => {
    const id = randomUUID();
    const ext = path.extname(file.originalname) || '.mp4';
    const filename = `${id}${ext}`;
    if (!req.uploadedFiles) {
      req.uploadedFiles = [];
    }
    req.uploadedFiles.push({ id, filename, originalName: file.originalname });
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024,
    files: 1000,
  },
});

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(ROOT_DIR));
app.use('/videos', express.static(VIDEO_DIR));

function buildRecord(file, descriptor) {
  return {
    id: descriptor.id,
    name: file.originalname,
    clientName: '',
    material: '',
    series: '',
    weight: '',
    capping: '',
    conveyor: '',
    buffer: '',
    voc: '',
    explosion: '',
    filename: descriptor.filename,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function enrich(records) {
  return records.map((record) => ({
    ...record,
    streamPath: `/videos/${record.filename}`,
  }));
}

app.get('/api/videos', async (req, res, next) => {
  try {
    const records = await readMetadata();
    records.sort((a, b) => a.createdAt - b.createdAt);
    res.json(enrich(records));
  } catch (error) {
    next(error);
  }
});

app.post('/api/videos/upload', upload.array('videos'), async (req, res, next) => {
  try {
    const files = req.files || [];
    const descriptors = req.uploadedFiles || [];
    if (!files.length) {
      return res.status(400).json({ message: '未接收到文件' });
    }
    const records = await readMetadata();
    const byId = new Map(descriptors.map((d) => [d.filename, d]));
    const created = files.map((file) => {
      const descriptor = byId.get(file.filename);
      return buildRecord(file, descriptor);
    });
    records.push(...created);
    await writeMetadata(records);
    res.status(201).json(enrich(created));
  } catch (error) {
    next(error);
  }
});

app.put('/api/videos/:id', async (req, res, next) => {
  try {
    const updates = req.body || {};
    const records = await readMetadata();
    const index = records.findIndex((item) => item.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: '视频不存在' });
    }
    const allowedKeys = [
      'name',
      'clientName',
      'material',
      'series',
      'weight',
      'capping',
      'conveyor',
      'buffer',
      'voc',
      'explosion',
    ];
    for (const key of allowedKeys) {
      if (key in updates) {
        records[index][key] = updates[key];
      }
    }
    records[index].updatedAt = Date.now();
    await writeMetadata(records);
    res.json(enrich([records[index]])[0]);
  } catch (error) {
    next(error);
  }
});

app.post('/api/videos/bulk-update', async (req, res, next) => {
  try {
    const { updates } = req.body || {};
    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: '缺少批量更新数据' });
    }
    const records = await readMetadata();
    const recordMap = new Map(records.map((item) => [item.id, item]));
    let updated = 0;
    for (const entry of updates) {
      const target = recordMap.get(entry.id);
      if (!target) continue;
      for (const key of [
        'name',
        'clientName',
        'material',
        'series',
        'weight',
        'capping',
        'conveyor',
        'buffer',
        'voc',
        'explosion',
      ]) {
        if (entry[key] !== undefined) {
          target[key] = entry[key];
        }
      }
      target.updatedAt = Date.now();
      updated += 1;
    }
    await writeMetadata(records);
    res.json({ updated });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/videos', async (req, res, next) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: '缺少要删除的 ID' });
    }
    const records = await readMetadata();
    const remain = [];
    const toDelete = new Set(ids);
    for (const record of records) {
      if (toDelete.has(record.id)) {
        try {
          await fs.unlink(path.join(VIDEO_DIR, record.filename));
        } catch (error) {
          if (error.code !== 'ENOENT') {
            console.warn('删除文件失败', error);
          }
        }
      } else {
        remain.push(record);
      }
    }
    await writeMetadata(remain);
    res.json({ removed: ids.length });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/videos/all', async (req, res, next) => {
  try {
    const records = await readMetadata();
    await writeMetadata([]);
    for (const record of records) {
      try {
        await fs.unlink(path.join(VIDEO_DIR, record.filename));
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn('删除文件失败', error);
        }
      }
    }
    res.json({ removed: records.length });
  } catch (error) {
    next(error);
  }
});

function calculateTotalSize(records) {
  return records.reduce((sum, item) => sum + (Number(item.size) || 0), 0);
}

app.get('/api/status', async (req, res, next) => {
  try {
    const records = await readMetadata();
    const totalSize = calculateTotalSize(records);
    res.json({
      online: true,
      videoCount: records.length,
      totalSize,
      serverTime: Date.now(),
      uptime: process.uptime(),
      storagePath: VIDEO_DIR,
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: '服务器内部错误', detail: error.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`辉鑫科技视频管理器已启动: http://localhost:${PORT}`);
});

import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import fssync from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads', 'videos');
const META_FILE = path.join(DATA_DIR, 'videos.json');

async function ensureDirectories() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  if (!fssync.existsSync(META_FILE)) {
    await fs.writeFile(META_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

async function readMetadata() {
  const raw = await fs.readFile(META_FILE, 'utf-8');
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.error('Failed to parse metadata file, resetting.', error);
    await fs.writeFile(META_FILE, JSON.stringify([], null, 2));
    return [];
  }
}

async function writeMetadata(items) {
  await fs.writeFile(META_FILE, JSON.stringify(items, null, 2));
}

function buildStorage() {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const unique = nanoid(10);
      const ext = path.extname(file.originalname) || '.bin';
      cb(null, `${Date.now()}-${unique}${ext}`);
    },
  });
}

function createApp(metadata) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use('/media', express.static(UPLOAD_DIR));
  app.use(express.static(__dirname));

  const upload = multer({
    storage: buildStorage(),
    limits: {
      fileSize: 200 * 1024 * 1024,
      files: 1000,
    },
  });

  function persist() {
    return writeMetadata(metadata);
  }

  function findIndexById(id) {
    return metadata.findIndex((item) => item.id === id);
  }

  app.get('/api/status', async (req, res) => {
    try {
      let totalSize = 0;
      for (const item of metadata) {
        totalSize += item.size || 0;
      }
      const status = {
        status: 'online',
        videoCount: metadata.length,
        totalSize,
        totalSizeReadable: formatSize(totalSize),
        uptime: process.uptime(),
        lastUpdated: Math.max(0, ...metadata.map((item) => item.updatedAt || 0)),
        storagePath: UPLOAD_DIR,
        metadataPath: META_FILE,
      };
      res.json(status);
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  app.get('/api/videos', (req, res) => {
    res.json({ videos: metadata });
  });

  app.post('/api/videos', upload.array('videos', 1000), async (req, res) => {
    try {
      const now = Date.now();
      const created = [];
      for (const file of req.files) {
        const id = nanoid(12);
        const record = {
          id,
          name: file.originalname,
          clientName: '',
          material: '',
          series: '30A系列',
          weight: '0.5~5kg',
          capping: '5L平板压盖',
          conveyor: '滚筒',
          buffer: '不锈钢面板',
          voc: '一体式集气罩',
          explosion: '防爆',
          size: file.size,
          type: file.mimetype,
          storageName: path.basename(file.path),
          createdAt: now,
          updatedAt: now,
        };
        metadata.push(record);
        created.push(record);
      }
      await persist();
      res.status(201).json({ videos: created });
    } catch (error) {
      console.error('Upload failed:', error);
      res.status(500).json({ message: '上传失败', error: error.message });
    }
  });

  app.put('/api/videos/:id', async (req, res) => {
    const { id } = req.params;
    const index = findIndexById(id);
    if (index === -1) {
      res.status(404).json({ message: '未找到对应视频' });
      return;
    }
    const updates = req.body || {};
    metadata[index] = {
      ...metadata[index],
      ...updates,
      updatedAt: Date.now(),
    };
    await persist();
    res.json({ video: metadata[index] });
  });

  app.put('/api/videos', async (req, res) => {
    const updates = Array.isArray(req.body?.videos) ? req.body.videos : [];
    const now = Date.now();
    const applied = [];
    for (const update of updates) {
      if (!update.id) continue;
      const index = findIndexById(update.id);
      if (index === -1) continue;
      metadata[index] = {
        ...metadata[index],
        ...update,
        updatedAt: now,
      };
      applied.push(metadata[index]);
    }
    await persist();
    res.json({ videos: applied });
  });

  app.delete('/api/videos', async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    let removed = 0;
    for (const id of ids) {
      const index = findIndexById(id);
      if (index === -1) continue;
      const [removedItem] = metadata.splice(index, 1);
      if (removedItem?.storageName) {
        const filePath = path.join(UPLOAD_DIR, removedItem.storageName);
        fs.unlink(filePath).catch(() => {});
      }
      removed += 1;
    }
    await persist();
    res.json({ removed });
  });

  app.delete('/api/videos/all', async (req, res) => {
    const removed = metadata.length;
    const files = metadata.map((item) => path.join(UPLOAD_DIR, item.storageName));
    metadata.splice(0, metadata.length);
    for (const file of files) {
      fs.unlink(file).catch(() => {});
    }
    await persist();
    res.json({ removed });
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  return app;
}

function formatSize(bytes) {
  if (!bytes || Number.isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

(async () => {
  await ensureDirectories();
  const metadata = await readMetadata();
  const app = createApp(metadata);
  app.listen(APP_PORT, () => {
    console.log(`辉鑫科技视频管理器服务器已启动，端口: ${APP_PORT}`);
  });
})();

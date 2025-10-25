import express from 'express';
import multer from 'multer';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const VIDEO_DIR = path.join(__dirname, 'videos');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'videos.json');

function stripBom(text) {
  if (text.charCodeAt(0) === 0xfeff) {
    return text.slice(1);
  }
  return text;
}

function parseCsv(text) {
  const rows = [];
  let current = '';
  let row = [];
  let insideQuotes = false;
  const source = stripBom(text);

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      row.push(current);
      rows.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows.filter((fields) => fields.some((value) => value && value.trim().length > 0));
}

function csvToObjects(text) {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const records = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const record = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = (row[index] ?? '').trim();
    });
    records.push(record);
  }
  return records;
}

async function ensureEnvironment() {
  await fsPromises.mkdir(PUBLIC_DIR, { recursive: true });
  await fsPromises.mkdir(VIDEO_DIR, { recursive: true });
  await fsPromises.mkdir(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    await fsPromises.writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

async function readVideoData() {
  try {
    const raw = await fsPromises.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to read videos.json, resetting to empty array.', error);
    await fsPromises.writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
}

async function writeVideoData(data) {
  await fsPromises.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

const videoStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, VIDEO_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const name = `${Date.now()}-${safeName}`;
    cb(null, name.endsWith(ext) ? name : `${name}${ext}`);
  },
});

const uploadVideos = multer({ storage: videoStorage });
const uploadCsv = multer({ storage: multer.memoryStorage() });

function createApp(videoData) {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(express.static(PUBLIC_DIR));
  app.use('/videos', express.static(VIDEO_DIR));

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body || {};
    if (username === 'hxadmin' && password === 'hx84556793') {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: '账号或密码错误' });
    }
  });

  app.get('/api/videos', (_, res) => {
    const payload = videoData.map((video) => ({
      ...video,
      url: `/videos/${video.storedName}`,
    }));
    res.json({ videos: payload });
  });

  app.post('/api/upload', uploadVideos.array('videos'), async (req, res) => {
    try {
      const files = req.files || [];
      const now = new Date().toISOString();
      const created = [];
      for (const file of files) {
        const record = {
          id: randomUUID(),
          originalName: file.originalname,
          storedName: file.filename,
          category: '',
          module: '',
          bucket: '',
          tags: [],
          createdAt: now,
          updatedAt: now,
        };
        videoData.push(record);
        created.push({ ...record, url: `/videos/${record.storedName}` });
      }
      await writeVideoData(videoData);
      res.status(201).json({ videos: created });
    } catch (error) {
      console.error('Video upload failed:', error);
      res.status(500).json({ message: '视频上传失败', error: error.message });
    }
  });

  app.put('/api/videos/:id', async (req, res) => {
    const { id } = req.params;
    const index = videoData.findIndex((item) => item.id === id);
    if (index === -1) {
      res.status(404).json({ message: '未找到对应视频' });
      return;
    }
    const payload = req.body || {};
    const tags = Array.isArray(payload.tags)
      ? payload.tags
      : typeof payload.tags === 'string'
      ? payload.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : videoData[index].tags;
    videoData[index] = {
      ...videoData[index],
      category: payload.category ?? videoData[index].category,
      module: payload.module ?? videoData[index].module,
      bucket: payload.bucket ?? videoData[index].bucket,
      tags,
      updatedAt: new Date().toISOString(),
    };
    await writeVideoData(videoData);
    res.json({
      video: {
        ...videoData[index],
        url: `/videos/${videoData[index].storedName}`,
      },
    });
  });

  app.post('/api/import-csv', uploadCsv.single('file'), async (req, res) => {
    if (!req.file) {
      res.status(400).json({ message: '未上传 CSV 文件' });
      return;
    }
    try {
      const text = req.file.buffer.toString('utf-8');
      const records = csvToObjects(text);
      const updates = [];
      for (const row of records) {
        const filename = row.filename || row.fileName || row.name || '';
        if (!filename) continue;
        const target = videoData.find(
          (item) =>
            item.originalName === filename ||
            item.storedName === filename ||
            path.basename(item.originalName) === path.basename(filename)
        );
        if (!target) continue;
        target.category = row.category ?? target.category ?? '';
        target.module = row.module ?? target.module ?? '';
        target.bucket = row.bucket ?? row.bucketType ?? target.bucket ?? '';
        const tagsValue = row.tags || row.tag || '';
        target.tags = typeof tagsValue === 'string'
          ? tagsValue
              .split(/[,\s]+/)
              .map((tag) => tag.trim())
              .filter(Boolean)
          : target.tags;
        target.updatedAt = new Date().toISOString();
        updates.push({ ...target, url: `/videos/${target.storedName}` });
      }
      await writeVideoData(videoData);
      res.json({ updated: updates, total: updates.length });
    } catch (error) {
      console.error('CSV import error:', error);
      res.status(500).json({ message: 'CSV 导入失败', error: error.message });
    }
  });

  app.get('/api/export-csv', (_, res) => {
    const header = 'filename,category,module,bucket,tags\n';
    const rows = videoData
      .map((video) => {
        const tags = Array.isArray(video.tags) ? video.tags.join(' ') : '';
        return [
          video.originalName,
          video.category ?? '',
          video.module ?? '',
          video.bucket ?? '',
          tags,
        ]
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(',');
      })
      .join('\n');
    const csv = `${header}${rows}`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="videos.csv"');
    res.send(csv);
  });

  app.get('/api/health', (_, res) => {
    res.json({ status: 'ok', count: videoData.length });
  });

  app.get('*', (_, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });

  return app;
}

function printAddresses(port) {
  const networks = os.networkInterfaces();
  const addresses = new Set(['http://localhost:' + port]);
  for (const net of Object.values(networks)) {
    if (!net) continue;
    for (const iface of net) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.add(`http://${iface.address}:${port}`);
      }
    }
  }
  console.log('辉云易达 OS 已启动，可访问以下地址:');
  for (const address of addresses) {
    console.log('  -', address);
  }
}

(async () => {
  await ensureEnvironment();
  const data = await readVideoData();
  const app = createApp(data);
  app.listen(PORT, () => {
    printAddresses(PORT);
  });
})();

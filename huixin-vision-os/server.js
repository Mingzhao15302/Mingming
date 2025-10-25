const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const VIDEOS_DIR = path.join(ROOT_DIR, 'videos');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'videos.json');
const CATEGORY_FILE = path.join(ROOT_DIR, 'config', 'categoryFields.json');

// Ensure required directories and files exist
function ensureDirectories() {
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function loadCategories() {
  try {
    const raw = fs.readFileSync(CATEGORY_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load category configuration:', err);
    return [];
  }
}

function loadVideos() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read videos data, returning empty list.', err);
    return [];
  }
}

function saveVideos(videos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2), 'utf8');
}

function buildDefaultCategories(categoryConfig) {
  const defaults = {};
  categoryConfig.forEach((field) => {
    if (field.type === 'multi') {
      defaults[field.key] = [];
    } else {
      const blankOption = field.options.find((option) => option === '空白');
      defaults[field.key] = blankOption ? '空白' : '';
    }
  });
  return defaults;
}

ensureDirectories();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, VIDEOS_DIR),
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const safeName = file.originalname
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_\.-]/g, '');
      cb(null, `${timestamp}-${safeName}`);
    },
  }),
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/videos', express.static(VIDEOS_DIR));
app.use(express.static(PUBLIC_DIR));

const categoryCache = loadCategories();

app.get('/api/config/categories', (req, res) => {
  res.json(categoryCache);
});

app.get('/api/videos', (req, res) => {
  const videos = loadVideos();
  res.json(videos);
});

app.post('/api/videos/import', upload.array('videos'), (req, res) => {
  const currentVideos = loadVideos();
  const defaults = buildDefaultCategories(categoryCache);

  const newEntries = (req.files || []).map((file) => {
    const title = path.parse(file.originalname).name;
    return {
      id: randomUUID(),
      fileName: file.filename,
      originalName: file.originalname,
      title,
      size: file.size,
      categories: { ...defaults },
      createdAt: new Date().toISOString(),
    };
  });

  const allVideos = [...currentVideos, ...newEntries];
  saveVideos(allVideos);
  res.json({ success: true, added: newEntries.length, videos: allVideos });
});

app.post('/api/videos/import-csv', upload.single('csv'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '未上传 CSV 文件' });
  }

  const csvBuffer = fs.readFileSync(req.file.path);
  fs.unlinkSync(req.file.path);

  let records = [];
  try {
    records = parse(csvBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    console.error('CSV parse error:', err);
    return res.status(400).json({ success: false, message: 'CSV 解析失败' });
  }

  const videos = loadVideos();
  let updatedCount = 0;

  records.forEach((row) => {
    const name = row.fileName || row.filename || row.title || '';
    if (!name) return;

    const matchIndex = videos.findIndex((video) => video.fileName === name || video.originalName === name || video.title === name);
    if (matchIndex === -1) return;

    const target = videos[matchIndex];
    const updatedCategories = { ...target.categories };

    categoryCache.forEach((field) => {
      const value = row[field.label] || row[field.key];
      if (value === undefined || value === null || value === '') return;

      if (field.type === 'multi') {
        const parts = Array.isArray(value) ? value : String(value).split(/[,;\n]/);
        updatedCategories[field.key] = parts
          .map((part) => part.trim())
          .filter((part) => part.length > 0);
      } else {
        updatedCategories[field.key] = value;
      }
    });

    videos[matchIndex] = { ...target, categories: updatedCategories };
    updatedCount += 1;
  });

  saveVideos(videos);
  res.json({ success: true, updated: updatedCount, videos });
});

app.put('/api/videos/:id', (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  const videos = loadVideos();
  const targetIndex = videos.findIndex((video) => video.id === id);
  if (targetIndex === -1) {
    return res.status(404).json({ success: false, message: '未找到对应视频' });
  }

  const target = videos[targetIndex];
  const updatedCategories = { ...target.categories };

  categoryCache.forEach((field) => {
    if (payload.categories && Object.prototype.hasOwnProperty.call(payload.categories, field.key)) {
      const value = payload.categories[field.key];
      if (field.type === 'multi') {
        updatedCategories[field.key] = Array.isArray(value)
          ? value.filter((item) => item)
          : typeof value === 'string' && value.length > 0
          ? value.split(',').map((item) => item.trim()).filter(Boolean)
          : [];
      } else {
        updatedCategories[field.key] = value || '';
      }
    }
  });

  const updatedVideo = { ...target, ...payload, categories: updatedCategories };
  videos[targetIndex] = updatedVideo;
  saveVideos(videos);

  res.json({ success: true, video: updatedVideo, videos });
});

app.get('/api/videos/export', (req, res) => {
  const videos = loadVideos();
  const headers = ['fileName', 'originalName', 'title'];
  categoryCache.forEach((field) => headers.push(field.label));

  const rows = videos.map((video) => {
    const base = [video.fileName, video.originalName, video.title];
    const categoryValues = categoryCache.map((field) => {
      const value = video.categories?.[field.key];
      if (field.type === 'multi') {
        return Array.isArray(value) ? value.join(';') : '';
      }
      return value || '';
    });
    return [...base, ...categoryValues];
  });

  const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="videos-export.csv"');
  res.send(csvContent);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'dashboard.html'));
});

const server = app.listen(PORT, () => {
  const { address, port } = server.address();
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];

  Object.values(networkInterfaces).forEach((ifs) => {
    ifs.forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(`http://${iface.address}:${port}`);
      }
    });
  });

  console.log('辉云易达 OS 已启动');
  console.log(`Local:   http://localhost:${port}`);
  if (address !== '::') {
    console.log(`Network: http://${address}:${port}`);
  }
  addresses.forEach((addr) => console.log(`Network: ${addr}`));
});

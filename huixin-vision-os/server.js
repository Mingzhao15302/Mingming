const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { parse } = require('csv-parse');
const fs = require('fs-extra');
const path = require('path');
const { nanoid } = require('nanoid');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const VIDEOS_DIR = path.join(__dirname, 'public', 'videos');
const DATA_FILE = path.join(DATA_DIR, 'videos.json');

// Predefined credentials for login validation
const DEFAULT_USER = { username: 'hxadmin', password: 'hx84556793' };

// List of metadata fields available for each video
const METADATA_FIELDS = [
  'productType',
  'autoFillingMachine',
  'autoFillingLine',
  'capType',
  'capacity',
  'feedingMethod',
  'explosionProof',
  'fillingMethod',
  'cappingMethod',
  'conveyorMethod',
  'bufferMethod',
  'vocRequirement',
  'barrelSeparation',
  'weighingMethod',
  'capSorting',
  'capPlacing',
  'labelingMethod',
  'palletizingMethod',
  'palletMethod',
  'boxingMethod',
  'otherFunctions'
];

// Ensure required directories and data file exist
fs.ensureDirSync(DATA_DIR);
fs.ensureDirSync(VIDEOS_DIR);
if (!fs.existsSync(DATA_FILE)) {
  fs.writeJsonSync(DATA_FILE, []);
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, VIDEOS_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `${Date.now()}-${base}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/videos', express.static(VIDEOS_DIR));

// Utility helpers for reading and persisting data
async function readVideos() {
  return fs.readJson(DATA_FILE);
}

async function writeVideos(videos) {
  return fs.writeJson(DATA_FILE, videos, { spaces: 2 });
}

// Login endpoint that validates against default credentials
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === DEFAULT_USER.username && password === DEFAULT_USER.password) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, message: '用户名或密码错误' });
});

// Retrieve stored videos and metadata
app.get('/api/videos', async (_, res) => {
  try {
    const videos = await readVideos();
    res.json(videos);
  } catch (error) {
    console.error('Failed to load videos', error);
    res.status(500).json({ message: '加载视频列表失败' });
  }
});

// Upload new videos and append to persistence layer
app.post('/api/videos/upload', upload.array('videos', 20), async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ message: '未选择任何视频' });
    }

    const videos = await readVideos();

    const newEntries = files.map((file) => {
      const id = nanoid();
      const metadata = METADATA_FIELDS.reduce((acc, field) => {
        acc[field] = '';
        return acc;
      }, {});

      return {
        id,
        filename: file.filename,
        originalName: file.originalname,
        path: `/videos/${file.filename}`,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        metadata
      };
    });

    const updated = [...videos, ...newEntries];
    await writeVideos(updated);

    res.json({ success: true, videos: newEntries });
  } catch (error) {
    console.error('Upload failed', error);
    res.status(500).json({ message: '视频上传失败' });
  }
});

// Update metadata for a single video entry
app.put('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const videos = await readVideos();
    const idx = videos.findIndex((video) => video.id === id);

    if (idx === -1) {
      return res.status(404).json({ message: '未找到视频' });
    }

    const video = videos[idx];
    video.metadata = { ...video.metadata, ...updates };
    videos[idx] = video;
    await writeVideos(videos);
    res.json({ success: true, video });
  } catch (error) {
    console.error('Update failed', error);
    res.status(500).json({ message: '更新视频信息失败' });
  }
});

// Import metadata from CSV file
app.post('/api/videos/import-csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '未上传CSV文件' });
    }

    const filePath = req.file.path;
    const videos = await readVideos();

    const parser = fs
      .createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }));

    let updatedCount = 0;

    for await (const record of parser) {
      const fileName = record.fileName || record.filename || record.name;
      if (!fileName) continue;
      const target = videos.find((video) => video.originalName === fileName || video.filename === fileName);
      if (!target) continue;

      METADATA_FIELDS.forEach((field) => {
        if (record[field] !== undefined) {
          target.metadata[field] = record[field];
        }
      });
      updatedCount += 1;
    }

    await writeVideos(videos);
    await fs.remove(filePath);

    res.json({ success: true, updated: updatedCount });
  } catch (error) {
    console.error('CSV import failed', error);
    res.status(500).json({ message: '导入CSV失败' });
  }
});

// Export all data as CSV for client download
app.get('/api/videos/export-csv', async (_, res) => {
  try {
    const videos = await readVideos();
    const header = ['fileName', ...METADATA_FIELDS];
    const rows = videos.map((video) => [
      video.originalName || video.filename,
      ...METADATA_FIELDS.map((field) => (video.metadata?.[field] || '').replace(/"/g, '""'))
    ]);

    const csvLines = [header.join(','), ...rows.map((row) => row.map((value) => `"${value}"`).join(','))];
    const csvContent = csvLines.join('\n');

    res.setHeader('Content-Disposition', 'attachment; filename="videos.csv"');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csvContent);
  } catch (error) {
    console.error('CSV export failed', error);
    res.status(500).json({ message: '导出CSV失败' });
  }
});

// Provide the metadata field definitions to front-end for dynamic rendering
app.get('/api/metadata-fields', (_, res) => {
  res.json({ fields: METADATA_FIELDS });
});

const server = app.listen(PORT, () => {
  const localUrl = `http://localhost:${PORT}`;
  const nets = os.networkInterfaces();
  const networkUrls = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        networkUrls.push(`http://${net.address}:${PORT}`);
      }
    }
  }

  console.log('\n辉云易达 OS 已启动 ✨');
  console.log(`Local:   ${localUrl}`);
  if (networkUrls.length) {
    networkUrls.forEach((url) => console.log(`Network: ${url}`));
  } else {
    console.log('Network: 未检测到外网地址，请确认网络设置');
  }
});

// Graceful shutdown handler for cleanup if necessary
process.on('SIGINT', () => {
  console.log('\n正在安全关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

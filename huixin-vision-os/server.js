const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;

const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');
const videosDir = path.join(rootDir, 'public', 'videos');
const dataDir = path.join(rootDir, 'data');
const dataFile = path.join(dataDir, 'videos.json');

// Ensure required directories and files exist
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, '[]', 'utf8');
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/videos', express.static(videosDir));
app.use(express.static(publicDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, videosDir);
  },
  filename: function (req, file, cb) {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9\.\-\_]/g, '_')}`;
    cb(null, safeName);
  }
});

const upload = multer({ storage });

const defaultCategories = () => ({
  productType: '',
  fillingMachine: '',
  fillingLine: '',
  capType: '',
  capacity: '',
  materialIn: '',
  explosionProof: '',
  fillingHeads: '',
  capping: '',
  conveyor: '',
  buffer: '',
  voc: '',
  bucketSeparation: '',
  weighing: [],
  capArrangement: '',
  capPlacement: '',
  labeling: [],
  palletizing: '',
  palletHandling: [],
  boxing: [],
  extraFeatures: []
});

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  const length = line.length;

  for (let i = 0; i < length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseCsv(content) {
  const lines = content
    .split(/
?
/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const records = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    if (values.every((value) => value === '')) {
      continue;
    }

    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] !== undefined ? values[index].trim() : '';
    });

    records.push(record);
  }

  return records;
}

function loadVideos() {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load video data', err);
    return [];
  }
}

function saveVideos(videos) {
  fs.writeFileSync(dataFile, JSON.stringify(videos, null, 2), 'utf8');
}

function findVideoIndex(videos, id) {
  return videos.findIndex((video) => video.id === id);
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'hxadmin' && password === 'hx84556793') {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: '账号或密码错误' });
});

app.get('/api/videos', (req, res) => {
  const videos = loadVideos();
  res.json(videos);
});

app.post('/api/upload', upload.array('videos'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: '未收到任何视频文件' });
  }

  const videos = loadVideos();
  const now = new Date().toISOString();
  const added = [];

  req.files.forEach((file) => {
    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fileName: file.filename,
      displayName: path.parse(file.originalname).name,
      path: `/videos/${file.filename}`,
      uploadedAt: now,
      categories: defaultCategories()
    };
    videos.push(record);
    added.push(record);
  });

  saveVideos(videos);
  res.json({ message: '上传成功', videos: added });
});

app.put('/api/videos/:id', (req, res) => {
  const { id } = req.params;
  const { categories, displayName } = req.body;

  const videos = loadVideos();
  const idx = findVideoIndex(videos, id);
  if (idx === -1) {
    return res.status(404).json({ message: '未找到视频' });
  }

  videos[idx].categories = {
    ...defaultCategories(),
    ...videos[idx].categories,
    ...categories,
    weighing: categories?.weighing || [],
    labeling: categories?.labeling || [],
    palletHandling: categories?.palletHandling || [],
    boxing: categories?.boxing || [],
    extraFeatures: categories?.extraFeatures || []
  };

  if (typeof displayName === 'string') {
    videos[idx].displayName = displayName;
  }

  saveVideos(videos);
  res.json(videos[idx]);
});

app.post('/api/import-csv', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '未上传 CSV 文件' });
  }

  try {
    const csvContent = fs.readFileSync(req.file.path, 'utf8');
    fs.unlinkSync(req.file.path);

    const records = parseCsv(csvContent);

    const videos = loadVideos();
    let updatedCount = 0;

    records.forEach((row) => {
      const name = row.fileName || row.displayName;
      if (!name) return;

      const target = videos.find((video) => video.fileName === name || video.displayName === name);
      if (!target) return;

      const newCategories = { ...row };
      delete newCategories.fileName;
      delete newCategories.displayName;

      const parseMulti = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        return String(value)
          .split(/[，,;]/)
          .map((item) => item.trim())
          .filter(Boolean);
      };

      target.categories = {
        ...defaultCategories(),
        ...target.categories,
        ...newCategories,
        weighing: parseMulti(row.weighing),
        labeling: parseMulti(row.labeling),
        palletHandling: parseMulti(row.palletHandling),
        boxing: parseMulti(row.boxing),
        extraFeatures: parseMulti(row.extraFeatures)
      };

      if (row.displayName) {
        target.displayName = row.displayName;
      }

      updatedCount += 1;
    });

    saveVideos(videos);

    res.json({ message: `CSV 导入完成，更新 ${updatedCount} 条记录` });
  } catch (error) {
    console.error('CSV import error', error);
    res.status(500).json({ message: 'CSV 解析失败', error: error.message });
  }
});

app.get('/api/export-csv', (req, res) => {
  const videos = loadVideos();
  const headers = [
    'fileName',
    'displayName',
    'productType',
    'fillingMachine',
    'fillingLine',
    'capType',
    'capacity',
    'materialIn',
    'explosionProof',
    'fillingHeads',
    'capping',
    'conveyor',
    'buffer',
    'voc',
    'bucketSeparation',
    'weighing',
    'capArrangement',
    'capPlacement',
    'labeling',
    'palletizing',
    'palletHandling',
    'boxing',
    'extraFeatures'
  ];

  const lines = [headers.join(',')];

  videos.forEach((video) => {
    const data = {
      ...defaultCategories(),
      ...video.categories
    };

    const formatValue = (value) => {
      if (Array.isArray(value)) {
        return `"${value.join('、')}"`;
      }
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value || '';
    };

    const row = [
      video.fileName,
      video.displayName,
      data.productType,
      data.fillingMachine,
      data.fillingLine,
      data.capType,
      data.capacity,
      data.materialIn,
      data.explosionProof,
      data.fillingHeads,
      data.capping,
      data.conveyor,
      data.buffer,
      data.voc,
      data.bucketSeparation,
      formatValue(data.weighing),
      data.capArrangement,
      data.capPlacement,
      formatValue(data.labeling),
      data.palletizing,
      formatValue(data.palletHandling),
      formatValue(data.boxing),
      formatValue(data.extraFeatures)
    ];

    lines.push(row.join(','));
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="videos.csv"');
  res.send(lines.join('\n'));
});

// Fallback to serve index
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(publicDir, 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(publicDir, 'dashboard.html'));
});

app.listen(PORT, () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(`http://${iface.address}:${PORT}`);
      }
    }
  }

  console.log(`辉云易达 OS 已启动`);
  console.log(`Local:   http://localhost:${PORT}`);
  if (addresses.length) {
    addresses.forEach((addr) => console.log(`Network: ${addr}`));
  } else {
    console.log('Network: 未检测到可用的局域网地址');
  }
});

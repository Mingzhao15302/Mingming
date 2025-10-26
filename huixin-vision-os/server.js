const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { randomUUID } = require('crypto');
const { execSync } = require('child_process');
const iconv = require('iconv-lite');

const app = express();
const PORT = process.env.PORT || 3000;

const ROOT_DIR = __dirname;
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
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
    } else if (field.default) {
      defaults[field.key] = field.default;
    } else if (Array.isArray(field.options) && field.options.includes('空白')) {
      defaults[field.key] = '空白';
    } else {
      defaults[field.key] = Array.isArray(field.options) && field.options.length ? field.options[0] : '';
    }
  });
  return defaults;
}

function ensureBuildArtifacts() {
  const distIndex = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(distIndex)) {
    return;
  }

  if (!fs.existsSync(CLIENT_DIR)) {
    return;
  }

  try {
    console.log('未检测到前端构建产物，正在执行 Vite 构建...');
    execSync('npx vite build', { stdio: 'inherit', cwd: ROOT_DIR });
  } catch (error) {
    console.warn('Vite 构建失败，将使用未构建的前端资源。', error);
  }
}

function fieldAppliesTo(field, productType) {
  if (!field || field.key === 'productType') return true;
  if (!Array.isArray(field.contexts) || field.contexts.length === 0) return true;
  if (field.contexts.includes('all')) return true;
  return field.contexts.includes(productType);
}

function sanitizeCategories(inputCategories = {}, categoryConfig, defaultCategories) {
  const sanitized = {};
  const productField = categoryConfig.find((field) => field.key === 'productType');
  let resolvedType = defaultCategories.productType || '';

  if (productField) {
    const incomingType = inputCategories.productType;
    if (incomingType && productField.options?.includes(incomingType)) {
      resolvedType = incomingType;
    } else {
      resolvedType = defaultCategories.productType || productField.options?.[0] || '';
    }
    sanitized.productType = resolvedType;
  }

  categoryConfig.forEach((field) => {
    if (field.key === 'productType') return;
    const applies = fieldAppliesTo(field, resolvedType);
    const incomingValue = inputCategories[field.key];

    if (field.type === 'multi') {
      if (applies && Array.isArray(incomingValue)) {
        sanitized[field.key] = incomingValue
          .map((item) => (typeof item === 'string' ? item.trim() : String(item)))
          .filter((item) => item.length > 0);
      } else {
        sanitized[field.key] = [];
      }
    } else if (applies) {
      if (typeof incomingValue === 'string' && incomingValue.length > 0) {
        sanitized[field.key] = incomingValue;
      } else if (field.default) {
        sanitized[field.key] = field.default;
      } else {
        sanitized[field.key] = defaultCategories[field.key] ?? '';
      }
    } else if (field.default) {
      sanitized[field.key] = field.default;
    } else if (field.type === 'multi') {
      sanitized[field.key] = [];
    } else {
      sanitized[field.key] = defaultCategories[field.key] ?? '';
    }
  });

  return sanitized;
}

ensureDirectories();
ensureBuildArtifacts();

function toHalfWidth(str = '') {
  return str
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/\u3000/g, ' ');
}

function normalizeFileName(input) {
  if (!input || typeof input !== 'string') {
    return {
      original: input || '',
      withExt: '',
      withoutExt: '',
      hasValue: false,
    };
  }

  let value = input.trim();
  value = value.replace(/[\u200B-\u200D\uFEFF]/g, '');
  value = toHalfWidth(value);
  value = value.replace(/\\/g, '/');
  const baseName = path.posix.basename(value);

  const ext = path.extname(baseName);
  const nameWithoutExt = ext ? baseName.slice(0, -ext.length) : baseName;
  const lowerBase = nameWithoutExt.toLowerCase();
  const lowerExt = ext.toLowerCase();

  return {
    original: input,
    withExt: lowerExt ? `${lowerBase}${lowerExt}` : lowerBase,
    withoutExt: lowerBase,
    hasValue: true,
  };
}

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

const categoryCache = loadCategories();
const defaultCategories = buildDefaultCategories(categoryCache);

const staticDir = fs.existsSync(path.join(DIST_DIR, 'index.html')) ? DIST_DIR : CLIENT_DIR;
app.use(express.static(staticDir));

app.get('/api/config/categories', (req, res) => {
  res.json(categoryCache);
});

app.get('/api/videos', (req, res) => {
  const videos = loadVideos();
  res.json(videos);
});

app.post('/api/videos/import', upload.array('videos'), (req, res) => {
  const currentVideos = loadVideos();

  const newEntries = (req.files || []).map((file) => {
    const title = path.parse(file.originalname).name;
    return {
      id: randomUUID(),
      fileName: file.filename,
      originalName: file.originalname,
      title,
      size: file.size,
      categories: { ...defaultCategories },
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
    let csvString = csvBuffer.toString('utf8');

    if (csvBuffer.length >= 2) {
      const bom = csvBuffer.slice(0, 2);
      if (bom[0] === 0xff && bom[1] === 0xfe) {
        csvString = iconv.decode(csvBuffer, 'utf16le');
      } else if (bom[0] === 0xfe && bom[1] === 0xff) {
        csvString = iconv.decode(csvBuffer, 'utf16be');
      }
    }

    if (csvString.includes('\uFFFD')) {
      csvString = iconv.decode(csvBuffer, 'gb18030');
    }

    csvString = csvString.replace(/^\uFEFF/, '');

    records = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    console.error('CSV parse error:', err);
    return res.status(400).json({ success: false, message: 'CSV 解析失败' });
  }

  const videos = loadVideos();

  const normalizedVideos = videos.map((video, index) => ({
    index,
    video,
    fileName: normalizeFileName(video.fileName),
    originalName: normalizeFileName(video.originalName),
  }));

  const allowedCategoryKeys = new Set(categoryCache.map((field) => field.key));

  const totalRows = records.length;
  let matchedCount = 0;

  const unmatchedRecords = [];
  const duplicateTracker = new Map();

  function recordDuplicate(normalizedKey, detail) {
    if (!normalizedKey) return;
    if (!duplicateTracker.has(normalizedKey)) {
      duplicateTracker.set(normalizedKey, []);
    }
    duplicateTracker.get(normalizedKey).push(detail);
  }

  function findUniqueMatch(matches, failureReason) {
    if (matches.length === 1) {
      return { index: matches[0], reason: null };
    }
    if (matches.length > 1) {
      return { index: -1, reason: `${failureReason}（匹配到多条记录）` };
    }
    return { index: -1, reason: `${failureReason}（未找到对应文件）` };
  }

  function locateVideo(rowInfo) {
    const reasons = [];

    if (rowInfo.fileName?.hasValue) {
      const exactMatches = normalizedVideos
        .filter((entry) => entry.fileName.withExt && entry.fileName.withExt === rowInfo.fileName.withExt)
        .map((entry) => entry.index);
      const result = findUniqueMatch(exactMatches, '根据 fileName（含扩展名）');
      if (result.index !== -1) {
        return result;
      }
      reasons.push(result.reason);

      if (rowInfo.fileName.withoutExt) {
        const withoutExtMatches = normalizedVideos
          .filter((entry) => entry.fileName.withoutExt && entry.fileName.withoutExt === rowInfo.fileName.withoutExt)
          .map((entry) => entry.index);
        const looseResult = findUniqueMatch(withoutExtMatches, '根据 fileName（不含扩展名）');
        if (looseResult.index !== -1) {
          return looseResult;
        }
        reasons.push(looseResult.reason);
      }
    }

    if (rowInfo.originalName?.hasValue) {
      const exactMatches = normalizedVideos
        .filter(
          (entry) =>
            (entry.fileName.withExt && entry.fileName.withExt === rowInfo.originalName.withExt) ||
            (entry.originalName.withExt && entry.originalName.withExt === rowInfo.originalName.withExt)
        )
        .map((entry) => entry.index);
      const result = findUniqueMatch(exactMatches, '根据 originalName（含扩展名）');
      if (result.index !== -1) {
        return result;
      }
      reasons.push(result.reason);

      if (rowInfo.originalName.withoutExt) {
        const withoutExtMatches = normalizedVideos
          .filter(
            (entry) =>
              (entry.fileName.withoutExt && entry.fileName.withoutExt === rowInfo.originalName.withoutExt) ||
              (entry.originalName.withoutExt && entry.originalName.withoutExt === rowInfo.originalName.withoutExt)
          )
          .map((entry) => entry.index);
        const looseResult = findUniqueMatch(withoutExtMatches, '根据 originalName（不含扩展名）');
        if (looseResult.index !== -1) {
          return looseResult;
        }
        reasons.push(looseResult.reason);
      }
    }

    return { index: -1, reason: reasons.filter(Boolean).join('；') || '缺少可用于匹配的文件名' };
  }

  records.forEach((row, idx) => {
    const fileNameRaw = row.fileName ?? row.filename ?? '';
    const originalNameRaw = row.originalName ?? row.originalname ?? '';
    const rowInfo = {
      fileName: normalizeFileName(fileNameRaw),
      originalName: normalizeFileName(originalNameRaw),
    };

    const csvLineNumber = idx + 2;

    if (rowInfo.fileName.hasValue) {
      const duplicateKey = rowInfo.fileName.withExt || rowInfo.fileName.withoutExt;
      recordDuplicate(duplicateKey, {
        lineNumber: csvLineNumber,
        fileName: fileNameRaw,
        originalName: originalNameRaw,
      });
    }

    const match = locateVideo(rowInfo);
    if (match.index === -1) {
      unmatchedRecords.push({
        lineNumber: csvLineNumber,
        fileName: fileNameRaw,
        originalName: originalNameRaw,
        reason: match.reason,
      });
      return;
    }

    const targetIndex = match.index;
    const target = videos[targetIndex];
    const updatedCategories = { ...target.categories };

    categoryCache.forEach((field) => {
      if (!allowedCategoryKeys.has(field.key)) return;

      const hasLabel = Object.prototype.hasOwnProperty.call(row, field.label);
      const hasKey = Object.prototype.hasOwnProperty.call(row, field.key);
      if (!hasLabel && !hasKey) return;

      const rawValue = hasLabel ? row[field.label] : row[field.key];

      if (field.type === 'multi') {
        if (rawValue === undefined || rawValue === null || rawValue === '') {
          updatedCategories[field.key] = [];
        } else if (Array.isArray(rawValue)) {
          updatedCategories[field.key] = rawValue.map((item) => String(item).trim()).filter((item) => item.length > 0);
        } else {
          updatedCategories[field.key] = String(rawValue)
            .split(/[，,;；\n]/)
            .map((part) => part.trim())
            .filter((part) => part.length > 0);
        }
      } else if (typeof rawValue === 'string') {
        updatedCategories[field.key] = rawValue.trim();
      } else {
        updatedCategories[field.key] = rawValue;
      }
    });

    const sanitized = sanitizeCategories(updatedCategories, categoryCache, defaultCategories);
    videos[targetIndex] = {
      ...target,
      categories: sanitized,
      updatedAt: new Date().toISOString(),
    };
    matchedCount += 1;
  });

  const duplicateRecords = [];
  let duplicateOverrides = 0;
  duplicateTracker.forEach((entries, key) => {
    if (!entries || entries.length <= 1) return;
    duplicateOverrides += entries.length - 1;
    duplicateRecords.push({
      normalizedKey: key,
      rows: entries.map((entry, index) => ({
        ...entry,
        status: index === entries.length - 1 ? '保留' : '覆盖',
      })),
    });
  });

  saveVideos(videos);

  const summary = {
    totalRows,
    matched: matchedCount,
    unmatched: unmatchedRecords.length,
    duplicateOverrides,
  };

  console.log(
    `CSV 导入完成：总行数 ${summary.totalRows}，成功 ${summary.matched}，未匹配 ${summary.unmatched}，重复覆盖 ${summary.duplicateOverrides}`
  );

  res.json({
    success: true,
    summary,
    unmatched: unmatchedRecords,
    duplicates: duplicateRecords,
    videos,
  });
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
  const incomingCategories = payload.categories || {};
  const mergedCategories = { ...target.categories, ...incomingCategories };
  const sanitized = sanitizeCategories(mergedCategories, categoryCache, defaultCategories);

  const updatedVideo = { ...target, categories: sanitized };
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

  const lines = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ];
  const csvContent = `\uFEFF${lines.join('\r\n')}`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="videos-export.csv"');
  res.send(csvContent);
});

app.delete('/api/videos/:id', (req, res) => {
  const { id } = req.params;
  const videos = loadVideos();
  const targetIndex = videos.findIndex((video) => video.id === id);
  if (targetIndex === -1) {
    return res.status(404).json({ success: false, message: '未找到对应视频' });
  }

  const [removed] = videos.splice(targetIndex, 1);
  if (removed?.fileName) {
    const filePath = path.join(VIDEOS_DIR, removed.fileName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.warn('删除视频文件失败：', error);
      }
    }
  }

  saveVideos(videos);
  res.json({ success: true, videos });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(staticDir, 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(staticDir, 'dashboard.html'));
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

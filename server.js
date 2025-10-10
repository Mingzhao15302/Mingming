const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const rootDir = __dirname;
const videoDir = path.join(rootDir, 'video');

fs.mkdirSync(videoDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, videoDir);
  },
  filename: (_, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '');
    const safeExt = ext.slice(0, 10);
    cb(null, `${timestamp}-${random}${safeExt}`);
  },
});

const upload = multer({ storage });

app.use(express.json({ limit: '1mb' }));
app.use(express.static(rootDir));

app.post('/api/upload', upload.array('videos'), (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  res.json({
    files: files.map((file) => ({
      originalName: file.originalname,
      storedName: file.filename,
      size: file.size,
      type: file.mimetype,
      path: path.posix.join('video', file.filename),
    })),
  });
});

app.delete('/api/videos', (req, res) => {
  const { paths } = req.body || {};
  if (!Array.isArray(paths)) {
    return res.status(400).json({ error: 'paths 必须是数组' });
  }

  const results = [];
  for (const relativePath of paths) {
    if (typeof relativePath !== 'string' || !relativePath.trim()) {
      continue;
    }
    const fileName = path.basename(relativePath);
    const absolutePath = path.join(videoDir, fileName);
    if (!absolutePath.startsWith(videoDir)) {
      continue;
    }
    try {
      fs.unlinkSync(absolutePath);
      results.push({ path: path.posix.join('video', fileName), deleted: true });
    } catch (error) {
      if (error.code === 'ENOENT') {
        results.push({ path: path.posix.join('video', fileName), deleted: false, reason: 'not found' });
      } else {
        results.push({ path: path.posix.join('video', fileName), deleted: false, reason: error.message });
      }
    }
  }

  res.json({ results });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

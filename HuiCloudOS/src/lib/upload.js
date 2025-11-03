import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { VIDEO_DIR, sanitizeFileName } from './utils.js';

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(VIDEO_DIR)) {
      fs.mkdirSync(VIDEO_DIR, { recursive: true });
    }
    cb(null, VIDEO_DIR);
  },
  filename: (_req, file, cb) => {
    const base = sanitizeFileName(path.parse(file.originalname).name);
    const finalName = `${base}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, finalName);
  }
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE }
});

import multer from 'multer';
import path from 'path';
import { VIDEO_DIR, ensureDirectories, sanitizeFilename } from './utils.js';

ensureDirectories();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, VIDEO_DIR);
  },
  filename: (req, file, cb) => {
    const unique = Date.now();
    const safeName = sanitizeFilename(file.originalname);
    cb(null, `${unique}-${safeName}`);
  }
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

export function toPublicVideo(file) {
  return {
    id: file.filename,
    filename: file.originalname,
    path: path.join(VIDEO_DIR, file.filename),
    size: file.size
  };
}

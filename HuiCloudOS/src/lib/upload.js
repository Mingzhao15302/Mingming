import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { ensureDir, resolveDataPath, sanitizeFilename, fileSizeWithinLimit } from './utils.js';

const tmpDir = resolveDataPath('tmp');
ensureDir(tmpDir);

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, tmpDir);
  },
  filename(_req, file, cb) {
    const name = sanitizeFilename(file.originalname);
    const id = Date.now().toString(36);
    cb(null, `${id}-${name}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

export function moveUploadedFile(tempPath, targetDir, targetName) {
  ensureDir(targetDir);
  const finalPath = path.join(targetDir, targetName);
  fs.renameSync(tempPath, finalPath);
  return finalPath;
}

export function validateFileSize(bytes) {
  if (!fileSizeWithinLimit(bytes)) {
    throw new Error('文件超过 100MB 限制');
  }
}

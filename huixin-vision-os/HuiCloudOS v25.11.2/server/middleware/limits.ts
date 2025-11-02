import fs from 'node:fs';
import multer from 'multer';
import os from 'node:os';
import path from 'node:path';

const uploadTempDir = path.resolve(os.tmpdir(), 'huicloud-os');

if (!fs.existsSync(uploadTempDir)) {
  fs.mkdirSync(uploadTempDir, { recursive: true });
}

export const upload = multer({
  dest: uploadTempDir,
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('video/')) {
      cb(new Error('仅支持视频文件上传'));
      return;
    }
    cb(null, true);
  },
});

export function createUploadGate(maxConcurrent = 3) {
  let active = 0;
  return function uploadGate(req: Parameters<import('express').RequestHandler>[0], res: Parameters<import('express').RequestHandler>[1], next: Parameters<import('express').RequestHandler>[2]) {
    if (active >= maxConcurrent) {
      res.status(429).json({ message: '上传队列繁忙，请稍后重试' });
      return;
    }
    active += 1;
    res.on('finish', () => {
      active = Math.max(active - 1, 0);
    });
    next();
  };
}

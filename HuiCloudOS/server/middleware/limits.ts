import multer from 'multer';
import createError from 'http-errors';

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const uploadLimits: multer.Options = {
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('video/')) {
      cb(createError(400, '仅支持上传视频文件'));
      return;
    }
    cb(null, true);
  }
};

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ensureDir, TEMP_DIR, VIDEO_DIR, sanitizeFilename } from './utils.js';

const MAX_SIZE = 100 * 1024 * 1024;

export const saveChunk = async ({ filename, index, buffer }) => {
  const safeName = sanitizeFilename(filename);
  const chunkDir = path.join(TEMP_DIR, safeName);
  await ensureDir(chunkDir);
  const chunkPath = path.join(chunkDir, `${index}.part`);
  await fs.promises.writeFile(chunkPath, buffer);
  return chunkPath;
};

export const mergeChunks = async ({ filename, originalName, total, size, mime }) => {
  const safeName = sanitizeFilename(filename);
  const chunkDir = path.join(TEMP_DIR, safeName);
  const files = (await fs.promises.readdir(chunkDir)).filter((name) => name.endsWith('.part'));
  if (files.length !== total) {
    throw new Error('缺少部分分片');
  }
  if (size > MAX_SIZE) {
    throw new Error('文件超过 100MB 限制');
  }
  files.sort((a, b) => Number(a.split('.')[0]) - Number(b.split('.')[0]));
  const videoId = crypto.randomUUID();
  await ensureDir(VIDEO_DIR);
  const outputPath = path.join(VIDEO_DIR, `${videoId}-${safeName}`);
  const writeStream = fs.createWriteStream(outputPath);
  for (const file of files) {
    const chunkPath = path.join(chunkDir, file);
    const data = await fs.promises.readFile(chunkPath);
    writeStream.write(data);
  }
  await new Promise((resolve) => writeStream.end(resolve));
  await fs.promises.rm(chunkDir, { recursive: true, force: true });
  const stats = await fs.promises.stat(outputPath);
  if (stats.size !== size) {
    throw new Error('文件合并失败，大小不匹配');
  }
  return {
    id: videoId,
    filename: path.basename(outputPath),
    originalName: originalName || filename,
    size: stats.size,
    mime
  };
};

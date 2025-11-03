import { createWriteStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDir } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadTmpDir = path.join(__dirname, '..', 'data', 'uploads');
const publicDir = path.join(__dirname, '..', '..', 'web', 'public');
const videosDir = path.join(publicDir, 'videos');
const postersDir = path.join(publicDir, 'posters');

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export async function writeChunk({ uploadId, chunkIndex }, stream) {
  if (!uploadId) {
    throw new Error('Missing uploadId');
  }
  const targetDir = path.join(uploadTmpDir, uploadId);
  await ensureDir(targetDir);
  const partPath = path.join(targetDir, `${chunkIndex}.part`);
  await new Promise((resolve, reject) => {
    const fileStream = createWriteStream(partPath);
    stream.pipe(fileStream);
    fileStream.on('finish', resolve);
    fileStream.on('error', reject);
    stream.on('error', reject);
  });
  return partPath;
}

async function getChunkPaths(uploadId, totalChunks) {
  const dir = path.join(uploadTmpDir, uploadId);
  const files = await fs.readdir(dir);
  const expected = Array.from({ length: Number(totalChunks) }).map((_, idx) => `${idx}.part`);
  expected.forEach((file) => {
    if (!files.includes(file)) {
      throw new Error(`Missing chunk ${file}`);
    }
  });
  return expected.map((file) => path.join(dir, file));
}

export async function mergeChunks({ uploadId, fileName, totalChunks }) {
  if (!uploadId || !fileName) {
    throw new Error('Invalid merge payload');
  }
  await ensureDir(videosDir);
  const target = path.join(videosDir, fileName);
  const chunkPaths = await getChunkPaths(uploadId, totalChunks);
  const writeStream = createWriteStream(target);
  for (const chunkPath of chunkPaths) {
    const data = await fs.readFile(chunkPath);
    writeStream.write(data);
  }
  writeStream.end();
  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
  const stat = await fs.stat(target);
  if (stat.size > MAX_VIDEO_SIZE) {
    await fs.unlink(target);
    throw new Error('文件超过 100MB 限制');
  }
  await removeTemp(uploadId);
  return { size: stat.size, path: target };
}

export async function calculateUploadSize(uploadId) {
  const dir = path.join(uploadTmpDir, uploadId);
  const files = await fs.readdir(dir);
  let size = 0;
  for (const file of files) {
    const stat = await fs.stat(path.join(dir, file));
    size += stat.size;
  }
  return size;
}

export async function removeTemp(uploadId) {
  const dir = path.join(uploadTmpDir, uploadId);
  try {
    const entries = await fs.readdir(dir);
    await Promise.all(entries.map((file) => fs.unlink(path.join(dir, file))));
    await fs.rmdir(dir);
  } catch (err) {
    // ignore
  }
}

export async function savePoster(fileName, buffer) {
  await ensureDir(postersDir);
  const filePath = path.join(postersDir, fileName);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function ensureSampleAssets() {
  await ensureDir(videosDir);
  await ensureDir(postersDir);
}

export function getPublicDirs() {
  return { videosDir, postersDir, publicDir };
}

export { MAX_VIDEO_SIZE };

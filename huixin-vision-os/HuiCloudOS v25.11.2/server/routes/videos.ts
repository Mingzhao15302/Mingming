import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { database } from '../db/index.js';
import { createUploadGate, upload } from '../middleware/limits.js';
import { extractPoster } from '../services/ffmpeg.js';
import { exportCsv } from '../services/csv.js';
import {
  buildVideoFilename,
  ensureStorageStructure,
  getPosterStoragePath,
  getPublicUrlPath,
  getVideoStoragePath,
} from '../services/storage.js';

const router = Router();
const csvUpload = multer({ storage: multer.memoryStorage() });

ensureStorageStructure();

router.get('/', (req, res) => {
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 30);
  const search = String(req.query.search ?? '').trim();
  const category = String(req.query.category ?? '').trim();

  let query = 'SELECT * FROM videos';
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (search) {
    conditions.push('(original_name LIKE ? OR filename LIKE ? OR IFNULL(category, "") LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (category) {
    conditions.push('IFNULL(category, "") = ?');
    params.push(category);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const total = database.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count')).get(...params) as { count: number };

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(pageSize, (page - 1) * pageSize);

  const rows = database.prepare(query).all(...params) as any[];
  const data = rows.map((row) => ({
    filename: row.filename,
    originalName: row.original_name,
    category: row.category,
    size: row.size,
    created_at: row.created_at,
    metadata: typeof row.metadata === 'string' && row.metadata ? JSON.parse(row.metadata) : row.metadata ?? {},
    posterUrl: getPublicUrlPath('posters', `${path.parse(row.filename).name}.jpg`),
    videoUrl: getPublicUrlPath('videos', row.filename),
  }));

  res.json({
    data,
    total: total.count,
    page,
    pageSize,
  });
});

router.post('/upload', createUploadGate(5), upload.array('files', 5), async (req, res) => {
  const files = (req.files ?? []) as Express.Multer.File[];
  if (!files.length) {
    res.status(400).json({ message: '未接收到上传文件' });
    return;
  }

  const results = [] as unknown[];

  for (const file of files) {
    if (file.size > 100 * 1024 * 1024) {
      fs.unlinkSync(file.path);
      continue;
    }

    const newFilename = buildVideoFilename(file.originalname);
    const videoPath = getVideoStoragePath(newFilename);
    fs.renameSync(file.path, videoPath);

    const posterPath = getPosterStoragePath(newFilename);
    try {
      await extractPoster(videoPath, posterPath);
    } catch (error) {
      console.error('Failed to extract poster', error);
    }

    const stmt = database.prepare(
      'INSERT INTO videos (filename, original_name, size, category, metadata) VALUES (?, ?, ?, ?, json(?)) ON CONFLICT(filename) DO UPDATE SET original_name = excluded.original_name, size = excluded.size'
    );
    stmt.run(newFilename, file.originalname, file.size, null, JSON.stringify({}));

    results.push({
      filename: newFilename,
      originalName: file.originalname,
      size: file.size,
      videoUrl: getPublicUrlPath('videos', newFilename),
      posterUrl: getPublicUrlPath('posters', `${path.parse(newFilename).name}.jpg`),
    });
  }

  res.json({ message: '上传成功', items: results });
});

router.put('/:filename', (req, res) => {
  const { filename } = req.params;
  const { category, metadata } = req.body as { category?: string; metadata?: Record<string, unknown> };

  const stmt = database.prepare('UPDATE videos SET category = ?, metadata = json(?) WHERE filename = ?');
  const result = stmt.run(category ?? null, JSON.stringify(metadata ?? {}), filename);

  if (result.changes === 0) {
    res.status(404).json({ message: '未找到视频' });
    return;
  }

  res.json({ message: '更新成功' });
});

router.post('/import', (req, res) => {
  const { records } = req.body as { records: { filename: string; category?: string; metadata?: Record<string, unknown> }[] };
  if (!records?.length) {
    res.status(400).json({ message: '记录为空' });
    return;
  }

  const stmt = database.prepare('UPDATE videos SET category = ?, metadata = json(?) WHERE filename = ?');
  let updated = 0;
  for (const record of records) {
    const result = stmt.run(record.category ?? null, JSON.stringify(record.metadata ?? {}), record.filename);
    updated += result.changes;
  }

  res.json({ message: '导入完成', updated });
});

router.post('/export', csvUpload.none(), (req, res) => {
  const { columns } = req.body as { columns?: string[] };
  const rows = database.prepare('SELECT filename, original_name, category, metadata FROM videos ORDER BY created_at DESC').all() as any[];

  const records = rows.map((row) => ({
    filename: row.filename,
    original_name: row.original_name,
    category: row.category ?? '',
    metadata: row.metadata ?? '{}',
  }));

  const filepath = getExportFilename('csv');
  exportCsv(records, columns ?? ['filename', 'original_name', 'category', 'metadata'], filepath);
  res.json({ message: '导出完成', path: filepath });
});

function getExportFilename(kind: 'csv') {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.resolve('HuiCloudOS v25.11.2', 'exports', kind, `videos-${stamp}.csv`);
}

export default router;

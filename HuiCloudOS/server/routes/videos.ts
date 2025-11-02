import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import createError from 'http-errors';
import { db } from '../services/database.js';
import { uploadLimits } from '../middleware/limits.js';
import { prepareStorage, createVideoFilename, getVideoPath, getPosterPath } from '../services/storage.js';
import { extractPoster, buildPosterUrl, buildVideoUrl } from '../services/ffmpeg.js';
import { buildCsv, parseCsv } from '../services/csv.js';

const router = Router();
const uploadTemp = path.resolve(process.cwd(), 'uploads');
prepareStorage();
if (!fs.existsSync(uploadTemp)) {
  fs.mkdirSync(uploadTemp, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadTemp);
    },
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  ...uploadLimits
});

const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const MAX_CONCURRENT_UPLOADS = 3;
let activeUploads = 0;
const uploadQueue: Array<() => void> = [];

async function withUploadConcurrency<T>(fn: () => Promise<T>): Promise<T> {
  if (activeUploads >= MAX_CONCURRENT_UPLOADS) {
    await new Promise<void>((resolve) => uploadQueue.push(resolve));
  }
  activeUploads += 1;
  try {
    return await fn();
  } finally {
    activeUploads -= 1;
    const next = uploadQueue.shift();
    if (next) next();
  }
}

router.get('/', (req, res) => {
  const page = Number.parseInt((req.query.page as string) ?? '1', 10) || 1;
  const pageSize = Number.parseInt((req.query.pageSize as string) ?? '30', 10) || 30;
  const offset = (page - 1) * pageSize;

  const total = db.prepare('SELECT COUNT(1) as count FROM videos').get() as { count: number };
  const rows = db
    .prepare('SELECT * FROM videos ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(pageSize, offset) as any[];

  const data = rows.map((row) => ({
    id: row.id,
    filename: row.filename,
    originalName: row.original_name,
    title: row.title,
    category: row.category,
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    posterUrl: row.poster_path ? buildPosterUrl(row.filename) : null,
    videoUrl: buildVideoUrl(row.filename),
    createdAt: row.created_at
  }));

  res.json({ page, pageSize, total: total.count, data });
});

router.post('/upload', upload.array('videos', 5), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw createError(400, '未选择任何文件');
    }

    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};
    const inserts: any[] = [];

    for (const file of files) {
      const record = await withUploadConcurrency(async () => {
        const finalName = createVideoFilename(file.originalname);
        const finalPath = getVideoPath(finalName);
        fs.renameSync(file.path, finalPath);

        let posterPath: string | null = null;
        try {
          posterPath = getPosterPath(finalName);
          await extractPoster(finalPath, posterPath);
        } catch (err) {
          posterPath = null;
          console.warn('生成首帧图失败', err);
        }

        const insertStmt = db.prepare(
          'INSERT INTO videos (filename, original_name, title, category, metadata, poster_path, video_path) VALUES (?, ?, ?, ?, ?, ?, ?)' // prettier-ignore
        );
        const info = insertStmt.run(
          finalName,
          file.originalname,
          metadata.title ?? null,
          metadata.category ?? null,
          JSON.stringify(metadata),
          posterPath,
          finalPath
        );

        return {
          id: info.lastInsertRowid as number,
          filename: finalName,
          originalName: file.originalname,
          title: metadata.title ?? null,
          category: metadata.category ?? null,
          metadata,
          posterUrl: posterPath ? buildPosterUrl(finalName) : null,
          videoUrl: buildVideoUrl(finalName)
        };
      });

      inserts.push(record);
    }

    res.status(201).json({ success: true, data: inserts });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const row = db.prepare('SELECT * FROM videos WHERE id = ?').get(id) as any;
    if (!row) {
      throw createError(404, '视频不存在');
    }
    db.prepare('DELETE FROM videos WHERE id = ?').run(id);
    if (row.video_path) {
      fs.existsSync(row.video_path) && fs.unlinkSync(row.video_path);
    }
    if (row.poster_path) {
      fs.existsSync(row.poster_path) && fs.unlinkSync(row.poster_path);
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const body = req.body ?? {};
    const row = db.prepare('SELECT * FROM videos WHERE id = ?').get(id) as any;
    if (!row) {
      throw createError(404, '视频不存在');
    }

    const metadata = { ...JSON.parse(row.metadata ?? '{}'), ...body.metadata };
    db.prepare('UPDATE videos SET title = ?, category = ?, metadata = ? WHERE id = ?').run(
      body.title ?? row.title,
      body.category ?? row.category,
      JSON.stringify(metadata),
      id
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/export/csv', (_req, res, next) => {
  try {
    const rows = db.prepare('SELECT * FROM videos ORDER BY created_at DESC').all() as any[];
    const data = rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      original_name: row.original_name,
      title: row.title,
      category: row.category,
      metadata: row.metadata
    }));

    const csv = buildCsv(data);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="videos.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

router.post('/import/csv', csvUpload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      throw createError(400, '未上传 CSV 文件');
    }
    const content = req.file.buffer.toString('utf-8');
    const rows = parseCsv(content);

    const updateStmt = db.prepare('UPDATE videos SET metadata = ?, category = ?, title = ? WHERE filename = ? OR original_name = ?');
    let updated = 0;
    rows.forEach((row) => {
      const metadata = { ...row };
      const result = updateStmt.run(
        JSON.stringify(metadata),
        row.category ?? null,
        row.title ?? null,
        row.filename,
        row.original_name
      );
      if (result.changes) {
        updated += result.changes;
      }
    });

    res.json({ success: true, updated });
  } catch (error) {
    next(error);
  }
});

export default router;

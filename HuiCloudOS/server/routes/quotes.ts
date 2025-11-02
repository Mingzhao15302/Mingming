import { Router } from 'express';
import createError from 'http-errors';
import { db } from '../services/database.js';
import { generateQuotePdf } from '../services/pdf.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM quotes ORDER BY created_at DESC').all() as any[];
  const data = rows.map((row) => ({
    id: row.id,
    templateId: row.template_id,
    name: row.name,
    sections: row.sections ? JSON.parse(row.sections) : []
  }));
  res.json({ data });
});

router.post('/', (req, res, next) => {
  try {
    const body = req.body ?? {};
    if (!body.templateId || !body.name) {
      throw createError(400, '缺少必要字段');
    }
    const stmt = db.prepare('INSERT INTO quotes (template_id, name, sections) VALUES (?, ?, ?)');
    const info = stmt.run(body.templateId, body.name, JSON.stringify(body.sections ?? []));
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (error) {
    next(error);
  }
});

router.patch('/:templateId', (req, res, next) => {
  try {
    const quote = db
      .prepare('SELECT * FROM quotes WHERE template_id = ?')
      .get(req.params.templateId) as any;
    if (!quote) {
      throw createError(404, '模板不存在');
    }
    const body = req.body ?? {};
    db.prepare('UPDATE quotes SET name = ?, sections = ? WHERE template_id = ?').run(
      body.name ?? quote.name,
      JSON.stringify(body.sections ?? JSON.parse(quote.sections ?? '[]')),
      req.params.templateId
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/:templateId/export', async (req, res, next) => {
  try {
    const quote = db
      .prepare('SELECT * FROM quotes WHERE template_id = ?')
      .get(req.params.templateId) as any;
    if (!quote) {
      throw createError(404, '模板不存在');
    }
    const body = req.body ?? {};
    const payload = {
      title: body.title ?? quote.name,
      customer: body.customer ?? '客户',
      salesperson: body.salesperson ?? '业务员',
      items: body.items ?? [],
      total: body.total ?? 0
    };
    const outputPath = await generateQuotePdf(payload, `${quote.template_id}-${Date.now()}.pdf`);
    res.json({ success: true, path: outputPath });
  } catch (error) {
    next(error);
  }
});

export default router;

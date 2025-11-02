import { Router } from 'express';
import { database } from '../db/index.js';
import { generateQuotePdf } from '../services/pdf.js';
import { getExportPath } from '../services/storage.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = database.prepare('SELECT * FROM quotes ORDER BY created_at DESC').all();
  res.json({ data: rows });
});

router.post('/', (req, res) => {
  const { id, title, body, discount } = req.body as {
    id: string;
    title: string;
    body: Record<string, unknown>;
    discount?: number;
  };

  database
    .prepare('INSERT INTO quotes (id, title, body, discount) VALUES (?, ?, json(?), ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, discount = excluded.discount')
    .run(id, title, JSON.stringify(body), discount ?? 0);

  res.status(201).json({ message: '模板已保存' });
});

router.post('/:id/export', async (req, res) => {
  const quote = database.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id) as any;
  if (!quote) {
    res.status(404).json({ message: '模板不存在' });
    return;
  }

  const body = JSON.parse(quote.body ?? '{}') as { lines?: Array<{ description: string; quantity: number; unitPrice: number }> };
  const lines = body.lines ?? [];
  const filepath = getExportPath('quotes', `${quote.id}-${Date.now()}.pdf`);
  await generateQuotePdf(
    {
      title: quote.title,
      customer: (body as any).customer ?? '未指定客户',
      salesperson: (body as any).salesperson ?? '未指定',
      discount: quote.discount ?? 0,
      lines: lines.length
        ? lines
        : [
            {
              description: '示例项目',
              quantity: 1,
              unitPrice: 0,
            },
          ],
    },
    filepath
  );

  res.json({ message: 'PDF 已生成', path: filepath });
});

export default router;

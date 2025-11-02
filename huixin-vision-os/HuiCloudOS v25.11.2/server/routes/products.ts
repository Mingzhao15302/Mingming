import { Router } from 'express';
import { database } from '../db/index.js';

const router = Router();

router.get('/', (req, res) => {
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 20);
  const search = String(req.query.search ?? '').trim();

  let query = 'SELECT * FROM products';
  const params: unknown[] = [];
  if (search) {
    query += ' WHERE name LIKE ? OR id LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }
  const total = database.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count')).get(...params) as { count: number };

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(pageSize, (page - 1) * pageSize);

  const rows = database.prepare(query).all(...params);
  res.json({ data: rows, total: total.count, page, pageSize });
});

router.get('/:id', (req, res) => {
  const row = database.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) {
    res.status(404).json({ message: '产品不存在' });
    return;
  }
  res.json(row);
});

router.post('/', (req, res) => {
  const { id, name, price, currency, specs } = req.body as {
    id: string;
    name: string;
    price: number;
    currency?: string;
    specs?: Record<string, unknown>;
  };

  database
    .prepare('INSERT INTO products (id, name, price, currency, specs) VALUES (?, ?, ?, ?, json(?)) ON CONFLICT(id) DO UPDATE SET name = excluded.name, price = excluded.price, currency = excluded.currency, specs = excluded.specs')
    .run(id, name, price, currency ?? 'CNY', JSON.stringify(specs ?? {}));

  res.status(201).json({ message: '保存成功' });
});

router.delete('/:id', (req, res) => {
  const result = database.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ message: '产品不存在' });
    return;
  }
  res.json({ message: '已删除' });
});

export default router;

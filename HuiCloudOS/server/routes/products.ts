import { Router } from 'express';
import createError from 'http-errors';
import { db } from '../services/database.js';

const router = Router();

router.get('/', (req, res) => {
  const page = Number.parseInt((req.query.page as string) ?? '1', 10) || 1;
  const pageSize = Number.parseInt((req.query.pageSize as string) ?? '12', 10) || 12;
  const offset = (page - 1) * pageSize;
  const total = db.prepare('SELECT COUNT(1) as count FROM products').get() as { count: number };
  const rows = db
    .prepare('SELECT * FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(pageSize, offset) as any[];

  const data = rows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    name: row.name,
    description: row.description,
    price: row.price,
    specs: row.specs ? JSON.parse(row.specs) : {},
    images: row.images ? JSON.parse(row.images) : []
  }));
  res.json({ page, pageSize, total: total.count, data });
});

router.get('/:productId', (req, res, next) => {
  try {
    const product = db
      .prepare('SELECT * FROM products WHERE product_id = ?')
      .get(req.params.productId) as any;
    if (!product) {
      throw createError(404, '商品不存在');
    }
    res.json({
      id: product.id,
      productId: product.product_id,
      name: product.name,
      description: product.description,
      price: product.price,
      specs: product.specs ? JSON.parse(product.specs) : {},
      images: product.images ? JSON.parse(product.images) : []
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', (req, res, next) => {
  try {
    const body = req.body ?? {};
    if (!body.productId || !body.name) {
      throw createError(400, '缺少必要字段');
    }
    const stmt = db.prepare(
      'INSERT INTO products (product_id, name, description, price, specs, images) VALUES (?, ?, ?, ?, ?, ?)' // prettier-ignore
    );
    const info = stmt.run(
      body.productId,
      body.name,
      body.description ?? '',
      body.price ?? 0,
      JSON.stringify(body.specs ?? {}),
      JSON.stringify(body.images ?? [])
    );
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (error) {
    next(error);
  }
});

router.patch('/:productId', (req, res, next) => {
  try {
    const body = req.body ?? {};
    const product = db
      .prepare('SELECT * FROM products WHERE product_id = ?')
      .get(req.params.productId) as any;
    if (!product) {
      throw createError(404, '商品不存在');
    }
    db.prepare('UPDATE products SET name = ?, description = ?, price = ?, specs = ?, images = ? WHERE product_id = ?').run(
      body.name ?? product.name,
      body.description ?? product.description,
      body.price ?? product.price,
      JSON.stringify(body.specs ?? JSON.parse(product.specs ?? '{}')),
      JSON.stringify(body.images ?? JSON.parse(product.images ?? '[]')),
      req.params.productId
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/:productId', (req, res, next) => {
  try {
    const result = db.prepare('DELETE FROM products WHERE product_id = ?').run(req.params.productId);
    if (!result.changes) {
      throw createError(404, '商品不存在');
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;

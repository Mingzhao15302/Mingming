import { Router } from 'express';
import createError from 'http-errors';
import { db } from '../services/database.js';
import { buildCsv } from '../services/csv.js';
import { generateQuotePdf } from '../services/pdf.js';

const router = Router();

router.get('/', (req, res) => {
  const page = Number.parseInt((req.query.page as string) ?? '1', 10) || 1;
  const pageSize = Number.parseInt((req.query.pageSize as string) ?? '20', 10) || 20;
  const offset = (page - 1) * pageSize;
  const total = db.prepare('SELECT COUNT(1) as count FROM orders').get() as { count: number };
  const rows = db
    .prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(pageSize, offset) as any[];

  const data = rows.map((row) => ({
    id: row.id,
    orderNo: row.order_no,
    customerName: row.customer_name,
    contact: row.contact,
    phone: row.phone,
    salesperson: row.salesperson,
    items: row.items ? JSON.parse(row.items) : [],
    total: row.total,
    status: row.status,
    createdAt: row.created_at
  }));
  res.json({ page, pageSize, total: total.count, data });
});

router.post('/', (req, res, next) => {
  try {
    const body = req.body ?? {};
    if (!body.orderNo) {
      throw createError(400, '订单号必填');
    }
    const stmt = db.prepare(
      'INSERT INTO orders (order_no, customer_name, contact, phone, salesperson, items, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)' // prettier-ignore
    );
    const info = stmt.run(
      body.orderNo,
      body.customerName ?? '',
      body.contact ?? '',
      body.phone ?? '',
      body.salesperson ?? '',
      JSON.stringify(body.items ?? []),
      body.total ?? 0,
      body.status ?? 'pending'
    );
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (error) {
    next(error);
  }
});

router.patch('/:orderNo', (req, res, next) => {
  try {
    const body = req.body ?? {};
    const order = db
      .prepare('SELECT * FROM orders WHERE order_no = ?')
      .get(req.params.orderNo) as any;
    if (!order) {
      throw createError(404, '订单不存在');
    }
    db.prepare('UPDATE orders SET customer_name = ?, contact = ?, phone = ?, salesperson = ?, items = ?, total = ?, status = ? WHERE order_no = ?').run(
      body.customerName ?? order.customer_name,
      body.contact ?? order.contact,
      body.phone ?? order.phone,
      body.salesperson ?? order.salesperson,
      JSON.stringify(body.items ?? JSON.parse(order.items ?? '[]')),
      body.total ?? order.total,
      body.status ?? order.status,
      req.params.orderNo
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/export/csv', (_req, res, next) => {
  try {
    const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as any[];
    const csv = buildCsv(
      rows.map((row) => ({
        order_no: row.order_no,
        customer_name: row.customer_name,
        contact: row.contact,
        phone: row.phone,
        salesperson: row.salesperson,
        total: row.total,
        status: row.status,
        created_at: row.created_at
      }))
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

router.post('/:orderNo/export/pdf', async (req, res, next) => {
  try {
    const order = db
      .prepare('SELECT * FROM orders WHERE order_no = ?')
      .get(req.params.orderNo) as any;
    if (!order) {
      throw createError(404, '订单不存在');
    }
    const outputPath = await generateQuotePdf({
      title: `订单 ${order.order_no}`,
      customer: order.customer_name,
      salesperson: order.salesperson,
      items: order.items ? JSON.parse(order.items) : [],
      total: order.total ?? 0
    }, `order-${order.order_no}.pdf`);
    res.json({ success: true, path: outputPath });
  } catch (error) {
    next(error);
  }
});

export default router;

import { Router } from 'express';
import { database } from '../db/index.js';
import { exportCsv } from '../services/csv.js';
import { generateQuotePdf } from '../services/pdf.js';
import { getExportPath } from '../services/storage.js';

const router = Router();

router.get('/', (req, res) => {
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 20);

  const total = database.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
  const rows = database
    .prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(pageSize, (page - 1) * pageSize);

  res.json({ data: rows, total: total.count, page, pageSize });
});

router.post('/', async (req, res) => {
  const { id, customerName, contact, salesperson, items, total, status } = req.body as {
    id: string;
    customerName: string;
    contact: string;
    salesperson: string;
    items: Array<{ id: string; name: string; quantity: number; price: number }>;
    total: number;
    status?: string;
  };

  database
    .prepare('INSERT INTO orders (id, customer_name, contact, salesperson, items, total, status) VALUES (?, ?, ?, ?, json(?), ?, ?) ON CONFLICT(id) DO UPDATE SET customer_name = excluded.customer_name, contact = excluded.contact, salesperson = excluded.salesperson, items = excluded.items, total = excluded.total, status = excluded.status')
    .run(id, customerName, contact, salesperson, JSON.stringify(items), total, status ?? 'pending');

  res.status(201).json({ message: '订单已保存' });
});

router.post('/:id/quote', async (req, res) => {
  const order = database.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
  if (!order) {
    res.status(404).json({ message: '订单不存在' });
    return;
  }

  const lines = JSON.parse(order.items) as Array<{ name: string; quantity: number; price: number }>;
  const filepath = getExportPath('quotes', `${order.id}.pdf`);
  await generateQuotePdf(
    {
      title: `报价单 - ${order.id}`,
      customer: order.customer_name,
      salesperson: order.salesperson ?? '未指派',
      discount: 0,
      lines: lines.map((line) => ({ description: line.name, quantity: line.quantity, unitPrice: line.price })),
    },
    filepath
  );

  res.json({ message: '报价单已生成', path: filepath });
});

router.post('/export', (req, res) => {
  const rows = database.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as any[];
  const records = rows.map((row) => ({
    id: row.id,
    customer_name: row.customer_name,
    salesperson: row.salesperson,
    total: row.total,
    status: row.status,
    created_at: row.created_at,
  }));

  const filepath = getExportPath('csv', `orders-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
  exportCsv(records, ['id', 'customer_name', 'salesperson', 'total', 'status', 'created_at'], filepath);
  res.json({ message: '订单导出完成', path: filepath });
});

export default router;

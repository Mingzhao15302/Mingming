import { Router } from 'express';
import { database } from '../db/index.js';

const router = Router();

router.get('/', (_req, res) => {
  const row = database.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (!row) {
    res.json({ company_name: '', logo_path: '', sales_team: [], terms: '' });
    return;
  }
  res.json({
    company_name: row.company_name,
    logo_path: row.logo_path,
    sales_team: row.sales_team ? JSON.parse(row.sales_team) : [],
    terms: row.terms ?? '',
  });
});

router.post('/', (req, res) => {
  const { company_name, logo_path, sales_team, terms } = req.body as {
    company_name?: string;
    logo_path?: string;
    sales_team?: string[];
    terms?: string;
  };

  database
    .prepare('INSERT INTO settings (id, company_name, logo_path, sales_team, terms) VALUES (1, ?, ?, json(?), ?) ON CONFLICT(id) DO UPDATE SET company_name = excluded.company_name, logo_path = excluded.logo_path, sales_team = excluded.sales_team, terms = excluded.terms')
    .run(company_name ?? '', logo_path ?? '', JSON.stringify(sales_team ?? []), terms ?? '');

  res.json({ message: '设置已更新' });
});

export default router;

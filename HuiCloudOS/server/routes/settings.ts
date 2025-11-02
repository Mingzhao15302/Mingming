import { Router } from 'express';
import { db } from '../services/database.js';

const router = Router();

router.get('/', (_req, res) => {
  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
  res.json({
    companyName: row?.company_name ?? '',
    logoUrl: row?.logo_url ?? '',
    salesTeam: row?.sales_team ? JSON.parse(row.sales_team) : [],
    terms: row?.terms ?? ''
  });
});

router.put('/', (req, res) => {
  const body = req.body ?? {};
  db.prepare('UPDATE settings SET company_name = ?, logo_url = ?, sales_team = ?, terms = ? WHERE id = 1').run(
    body.companyName ?? '',
    body.logoUrl ?? '',
    JSON.stringify(body.salesTeam ?? []),
    body.terms ?? ''
  );
  res.json({ success: true });
});

export default router;

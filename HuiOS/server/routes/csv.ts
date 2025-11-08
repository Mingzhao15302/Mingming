import { Router } from 'express'
import { exportCsv } from '../services/csvService'

const router = Router()

router.post('/export', async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body.data) ? (req.body.data as Array<Record<string, string>>) : []
    const filename = typeof req.body.filename === 'string' ? req.body.filename : `export-${Date.now()}.csv`
    if (rows.length === 0) {
      res.status(400).json({ message: '缺少导出数据' })
      return
    }
    const path = await exportCsv(filename, rows)
    res.json({ path })
  } catch (error) {
    next(error)
  }
})

export default router

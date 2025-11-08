import { Router } from 'express'
import { readSettings, writeSettings } from '../services/settingsService'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const data = await readSettings()
    res.json(data)
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    await writeSettings(req.body)
    res.json({ saved: true })
  } catch (error) {
    next(error)
  }
})

export default router

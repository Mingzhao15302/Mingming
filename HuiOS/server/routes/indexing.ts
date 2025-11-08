import { Router } from 'express'
import { rescanVideos } from '../services/videoService'

const router = Router()

router.get('/rescan', async (_req, res, next) => {
  try {
    const total = await rescanVideos()
    res.json({ total })
  } catch (error) {
    next(error)
  }
})

export default router

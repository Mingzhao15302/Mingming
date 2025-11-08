import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { paths } from '../services/pathService'
import { attachPoster, createVideo, getVideoById, listVideos, rescanVideos } from '../services/videoService'

const upload = multer({
  dest: paths.tempDir,
  limits: {
    fileSize: 100 * 1024 * 1024
  }
})

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const items = await listVideos()
    res.json(items)
  } catch (error) {
    next(error)
  }
})

router.post('/upload', upload.single('video'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: '未选择视频文件' })
      return
    }
    const fileSize = req.file.size
    if (fileSize > 100 * 1024 * 1024) {
      fs.unlinkSync(req.file.path)
      res.status(400).json({ message: '文件超过 100MB 限制' })
      return
    }
    const title = typeof req.body.title === 'string' ? req.body.title : req.file.originalname
    const created = await createVideo(req.file, title)
    res.json(created)
  } catch (error) {
    next(error)
  }
})

router.post('/poster', upload.single('poster'), async (req, res, next) => {
  try {
    if (!req.file || typeof req.body.id !== 'string') {
      res.status(400).json({ message: '缺少必要参数' })
      return
    }
    const updated = await attachPoster(req.body.id, req.file)
    res.json({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      src: `/api/videos/stream/${updated.id}`,
      poster: updated.poster ? `/api/videos/posters/${updated.poster}` : undefined
    })
  } catch (error) {
    next(error)
  }
})

router.get('/stream/:id', async (req, res, next) => {
  try {
    const video = await getVideoById(req.params.id)
    if (!video) {
      res.status(404).json({ message: '未找到视频' })
      return
    }
    const filePath = path.join(paths.videosDir, video.filename)
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: '视频文件缺失' })
      return
    }
    res.sendFile(filePath)
  } catch (error) {
    next(error)
  }
})

router.get('/posters/:filename', (req, res) => {
  const filePath = path.join(paths.postersDir, path.basename(req.params.filename))
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ message: '未找到封面' })
    return
  }
  res.sendFile(filePath)
})

router.post('/rescan', async (_req, res, next) => {
  try {
    const total = await rescanVideos()
    res.json({ total })
  } catch (error) {
    next(error)
  }
})

export default router

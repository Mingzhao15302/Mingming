import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import os from 'os'
import { ensureStorageStructure, paths } from './services/pathService'
import videoRouter from './routes/videos'
import csvRouter from './routes/csv'
import settingsRouter from './routes/settings'
import indexingRouter from './routes/indexing'

const app = express()
const port = Number(process.env.PORT ?? 4000)

ensureStorageStructure()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(morgan('dev'))
app.use('/data/posters', express.static(paths.postersDir))
app.use('/data/videos', express.static(paths.videosDir))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/videos', videoRouter)
app.use('/api/csv', csvRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/index', indexingRouter)

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ message: err.message })
})

app.listen(port, () => {
  const localUrl = `http://localhost:${port}`
  const networkAddresses = getNetworkAddresses(port)
  console.log(`
辉云易达 OS API 已启动：\n  Local:   ${localUrl}\n  Network: ${networkAddresses.join(', ')}`)
})

function getNetworkAddresses(port: number) {
  const interfaces = os.networkInterfaces()
  const urls: string[] = []
  Object.values(interfaces).forEach((nets) => {
    nets?.forEach((net) => {
      if (net.family === 'IPv4' && !net.internal) {
        urls.push(`http://${net.address}:${port}`)
      }
    })
  })
  return urls.length > 0 ? urls : ['不可用']
}

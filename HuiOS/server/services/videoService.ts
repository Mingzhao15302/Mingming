import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { paths } from './pathService'

export interface VideoMeta {
  id: string
  title: string
  description?: string
  filename: string
  poster?: string
  size?: number
  createdAt: string
}

const readMetadata = async (): Promise<VideoMeta[]> => {
  const content = await fs.readFile(paths.metadataFile, 'utf8')
  try {
    return JSON.parse(content) as VideoMeta[]
  } catch (error) {
    console.warn('Failed to parse metadata, resetting file.', error)
    await fs.writeFile(paths.metadataFile, JSON.stringify([]), 'utf8')
    return []
  }
}

const writeMetadata = async (items: VideoMeta[]) => {
  await fs.writeFile(paths.metadataFile, JSON.stringify(items, null, 2), 'utf8')
}

export const listVideos = async () => {
  const metadata = await readMetadata()
  return metadata.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    src: `/api/videos/stream/${item.id}`,
    poster: item.poster ? `/api/videos/posters/${item.poster}` : undefined,
    size: item.size,
    createdAt: item.createdAt
  }))
}

export const getVideoById = async (id: string) => {
  const metadata = await readMetadata()
  return metadata.find((item) => item.id === id)
}

export const createVideo = async (file: Express.Multer.File, title: string) => {
  const metadata = await readMetadata()
  const id = crypto.randomUUID()
  const filename = `${id}${path.extname(file.originalname)}`
  const destination = path.join(paths.videosDir, filename)
  await fs.rename(file.path, destination)

  const entry: VideoMeta = {
    id,
    title: title || file.originalname,
    filename,
    size: file.size,
    createdAt: new Date().toISOString()
  }

  metadata.push(entry)
  await writeMetadata(metadata)
  return entry
}

export const attachPoster = async (id: string, file: Express.Multer.File) => {
  const metadata = await readMetadata()
  const index = metadata.findIndex((item) => item.id === id)
  if (index === -1) {
    throw new Error('未找到视频记录')
  }
  const filename = `${id}.jpg`
  await fs.rename(file.path, path.join(paths.postersDir, filename))
  metadata[index].poster = filename
  await writeMetadata(metadata)
  return metadata[index]
}

export const rescanVideos = async () => {
  const files = await fs.readdir(paths.videosDir)
  const metadata = await readMetadata()
  const existing = new Set(metadata.map((item) => item.filename))
  for (const file of files) {
    if (!existing.has(file)) {
      const id = crypto.randomUUID()
      metadata.push({
        id,
        title: file,
        filename: file,
        createdAt: new Date().toISOString()
      })
    }
  }
  await writeMetadata(metadata)
  return metadata.length
}

import fs from 'fs'
import path from 'path'

export interface StoragePaths {
  root: string
  videosDir: string
  postersDir: string
  csvDir: string
  exportsDir: string
  metadataFile: string
  settingsFile: string
  tempDir: string
}

const root = path.resolve(process.cwd(), 'data')

export const paths: StoragePaths = {
  root,
  videosDir: path.join(root, 'videos'),
  postersDir: path.join(root, 'posters'),
  csvDir: path.join(root, 'csv'),
  exportsDir: path.join(root, 'exports'),
  metadataFile: path.join(root, 'videos.json'),
  settingsFile: path.join(root, 'settings.json'),
  tempDir: path.join(root, 'temp')
}

export const ensureStorageStructure = () => {
  ;[paths.root, paths.videosDir, paths.postersDir, paths.csvDir, paths.exportsDir, paths.tempDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })

  if (!fs.existsSync(paths.metadataFile)) {
    fs.writeFileSync(paths.metadataFile, JSON.stringify([]), 'utf8')
  }

  if (!fs.existsSync(paths.settingsFile)) {
    fs.writeFileSync(paths.settingsFile, JSON.stringify({}), 'utf8')
  }
}

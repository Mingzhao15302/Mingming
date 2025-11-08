import fs from 'fs/promises'
import { paths } from './pathService'

interface SettingsData {
  company?: string
  salesperson?: string
  notes?: string
}

export const readSettings = async (): Promise<SettingsData> => {
  try {
    const content = await fs.readFile(paths.settingsFile, 'utf8')
    return JSON.parse(content) as SettingsData
  } catch (error) {
    await fs.writeFile(paths.settingsFile, JSON.stringify({}, null, 2), 'utf8')
    return {}
  }
}

export const writeSettings = async (data: SettingsData) => {
  await fs.writeFile(paths.settingsFile, JSON.stringify(data, null, 2), 'utf8')
  return data
}

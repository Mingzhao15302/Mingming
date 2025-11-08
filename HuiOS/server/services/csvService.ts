import fs from 'fs/promises'
import path from 'path'
import { paths } from './pathService'

export const exportCsv = async (filename: string, rows: Array<Record<string, string>>) => {
  const headers = Object.keys(rows[0] ?? {})
  const csvLines = [headers.join(',')]
  for (const row of rows) {
    const line = headers
      .map((header) => escapeValue(row[header] ?? ''))
      .join(',')
    csvLines.push(line)
  }
  const content = `\uFEFF${csvLines.join('\n')}`
  const target = path.join(paths.csvDir, filename)
  await fs.writeFile(target, content, 'utf8')
  return target
}

const escapeValue = (value: string) => {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

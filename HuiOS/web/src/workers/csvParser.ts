/// <reference lib="webworker" />

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope

ctx.addEventListener('message', (event) => {
  const { text, delimiter = ',', hasHeader = true } = event.data as {
    text: string
    delimiter?: string
    hasHeader?: boolean
  }

  const rows = parseCSV(text, delimiter)
  const payload = hasHeader ? convertToObjects(rows) : rows

  ctx.postMessage({ rows: payload })
})

function parseCSV(text: string, delimiter: string) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const rows: string[][] = []
  let current: string[] = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentField += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      current.push(currentField)
      currentField = ''
    } else if (char === '\n' && !inQuotes) {
      current.push(currentField)
      rows.push(current)
      current = []
      currentField = ''
    } else if (char !== '\r') {
      currentField += char
    }
  }

  if (currentField || current.length > 0) {
    current.push(currentField)
    rows.push(current)
  }

  return rows.filter((row) => row.some((cell) => cell.trim() !== ''))
}

function convertToObjects(rows: string[][]) {
  if (rows.length === 0) return []
  const [header, ...data] = rows
  return data.map((row) => {
    const record: Record<string, string> = {}
    header.forEach((key, index) => {
      record[key] = row[index] ?? ''
    })
    return record
  })
}

export {}

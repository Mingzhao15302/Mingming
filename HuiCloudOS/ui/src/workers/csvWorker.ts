const ctx: Worker = self as any;

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const headers = parseLine(lines[0]);
  const rows = [] as Record<string, string>[];
  for (let i = 1; i < lines.length; i += 1) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

function parseLine(line: string) {
  const result: string[] = [];
  let buffer = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          buffer += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        buffer += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(buffer);
        buffer = '';
      } else {
        buffer += char;
      }
    }
  }
  result.push(buffer);
  return result;
}

ctx.addEventListener('message', (event) => {
  const { id, text } = event.data as { id: string; text: string };
  try {
    const rows = parseCsv(text.replace(/^\uFEFF/, ''));
    ctx.postMessage({ id, success: true, rows });
  } catch (error) {
    ctx.postMessage({ id, success: false, message: (error as Error).message });
  }
});

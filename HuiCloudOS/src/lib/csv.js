import fs from 'fs/promises';

const BOM = '\uFEFF';

export async function parseCSV(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    return headers.reduce((acc, header, index) => {
      acc[header] = cells[index] || '';
      return acc;
    }, {});
  });
}

export async function writeCSV(filePath, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    await fs.writeFile(filePath, '', 'utf8');
    return;
  }
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCell(row[header] ?? '')).join(','));
  }
  await fs.writeFile(filePath, BOM + lines.join('\n'), 'utf8');
}

function splitLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function escapeCell(value) {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

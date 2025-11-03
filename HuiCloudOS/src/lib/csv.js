export function stringifyCsv(rows) {
  const header = rows[0] ? Object.keys(rows[0]) : [];
  const lines = [toCsvLine(header)];
  for (const row of rows) {
    lines.push(toCsvLine(header.map((key) => row[key] ?? '')));
  }
  const content = lines.join('\r\n');
  return `\uFEFF${content}`;
}

export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const header = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const row = {};
    header.forEach((key, index) => {
      row[key] = values[index] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

function toCsvLine(values) {
  return values
    .map((value) => {
      const str = `${value ?? ''}`;
      if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    })
    .join(',');
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        const next = line[i + 1];
        if (next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

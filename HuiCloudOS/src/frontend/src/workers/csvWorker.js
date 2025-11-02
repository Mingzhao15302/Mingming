const SEPARATOR = ',';

function parseLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === SEPARATOR && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter(Boolean);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const item = {};
    headers.forEach((header, index) => {
      item[header] = cells[index] || '';
    });
    return item;
  });
  return { headers, rows };
}

function stringifyRow(values) {
  return values
    .map((value = '') => {
      const str = String(value);
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(SEPARATOR);
}

function stringifyCsv(headers, rows) {
  const lines = [stringifyRow(headers)];
  rows.forEach((row) => {
    lines.push(stringifyRow(headers.map((header) => row[header] ?? '')));
  });
  return `\uFEFF${lines.join('\n')}`;
}

self.onmessage = (event) => {
  const { type, payload } = event.data;
  if (type === 'parse') {
    const result = parseCsv(payload.text);
    self.postMessage({ type: 'parse', id: payload.id, result });
  } else if (type === 'stringify') {
    const result = stringifyCsv(payload.headers, payload.rows);
    self.postMessage({ type: 'stringify', id: payload.id, result });
  }
};

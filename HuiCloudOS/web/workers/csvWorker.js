self.onmessage = (event) => {
  const { type, payload } = event.data || {};
  if (type === 'parse') {
    const { text } = payload;
    const rows = parseCSV(text || '');
    self.postMessage({ type: 'parsed', payload: { rows } });
  }
};

function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = cells[idx] ?? '';
    });
    return record;
  });
}

function splitLine(line) {
  const result = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

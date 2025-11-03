const parseLine = (line) => {
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
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

self.onmessage = (event) => {
  const text = event.data;
  const rows = text.split(/\r?\n/).filter(Boolean);
  if (!rows.length) {
    self.postMessage({ headers: [], records: [] });
    return;
  }
  const headers = parseLine(rows[0]);
  const records = rows.slice(1).map((row) => {
    const values = parseLine(row);
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? '';
    });
    return record;
  });
  self.postMessage({ headers, records });
};

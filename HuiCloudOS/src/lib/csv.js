export const parseCsv = (text) => {
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [], records: [] };
  const headers = parseLine(lines[0]);
  const records = lines.slice(1).map((line) => {
    const values = parseLine(line);
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? '';
    });
    return record;
  });
  return { headers, records };
};

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
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((value) => value.trim());
};

export const stringifyCsv = (records, headers) => {
  const headerLine = headers.join(',');
  const lines = records.map((record) => headers.map((header) => escapeValue(record[header])).join(','));
  return ['\uFEFF' + headerLine, ...lines].join('\n');
};

const escapeValue = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

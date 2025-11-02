import fs from 'node:fs';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';

type CsvRecord = Record<string, string | number | boolean | null>;

export function exportCsv(records: CsvRecord[], columns: string[], filepath: string) {
  const output = stringify(records, {
    header: true,
    columns,
    bom: true,
  });
  fs.writeFileSync(filepath, output, 'utf8');
}

export function importCsv(filepath: string) {
  const raw = fs.readFileSync(filepath, 'utf8');
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as CsvRecord[];
}

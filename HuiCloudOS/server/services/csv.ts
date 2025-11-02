import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

export function parseCsv(content: string) {
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    bom: true
  }) as Record<string, string>[];
}

export function buildCsv(rows: Record<string, unknown>[]) {
  return '\ufeff' +
    stringify(rows, {
      header: true
    });
}

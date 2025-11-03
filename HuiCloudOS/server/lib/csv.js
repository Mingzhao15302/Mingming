import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDir, createId } from './utils.js';
import { updateStore } from './store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvDir = path.join(__dirname, '..', 'data', 'csv');

const videoHeaders = [
  'id',
  'title',
  'description',
  'fileName',
  'posterName',
  'fileSize',
  'duration',
  'uploadedAt',
  '产品类型',
  '灌装机型号',
  '灌装自动线',
  '桶盖',
  '容量',
  '来料方式',
  '防爆要求',
  '灌装方式',
  '理盖方式',
  '放盖方式',
  '压盖方式',
  '输送方式',
  '缓存方式',
  'VOC要求',
  '分桶方式',
  '码垛方式',
  '检重方式',
  '贴标方式',
  '托盘方式',
  '装箱方式',
  '其他功能'
];

function escapeField(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCSV(rows) {
  const headerLine = videoHeaders.join(',');
  const body = rows
    .map((row) => {
      return videoHeaders
        .map((field) => {
          if (['检重方式', '贴标方式', '托盘方式', '装箱方式', '其他功能'].includes(field)) {
            return escapeField((row.multiSelect?.[field] || []).join('|'));
          }
          if (
            [
              '产品类型',
              '灌装机型号',
              '灌装自动线',
              '桶盖',
              '容量',
              '来料方式',
              '防爆要求',
              '灌装方式',
              '理盖方式',
              '放盖方式',
              '压盖方式',
              '输送方式',
              '缓存方式',
              'VOC要求',
              '分桶方式',
              '码垛方式'
            ].includes(field)
          ) {
            return escapeField(row.category?.[field] || '');
          }
          return escapeField(row[field]);
        })
        .join(',');
    })
    .join('\n');
  return `\uFEFF${headerLine}\n${body}`;
}

function parseLine(line) {
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

export function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const [headerLine, ...rows] = lines;
  const headers = parseLine(headerLine);
  return rows.map((line) => {
    const cells = parseLine(line);
    const entry = {};
    headers.forEach((key, idx) => {
      entry[key] = cells[idx] ?? '';
    });
    return entry;
  });
}

export async function exportVideos(store) {
  await ensureDir(csvDir);
  const fileName = `videos-${Date.now()}.csv`;
  const csvContent = toCSV(store.videos);
  const filePath = path.join(csvDir, fileName);
  await fs.writeFile(filePath, csvContent, 'utf-8');
  return { fileName, content: csvContent };
}

export async function importVideosFromCSV(text) {
  const records = parseCSV(text);
  const updated = await updateStore((draft) => {
    records.forEach((row) => {
      const existing = draft.videos.find((video) => video.id === row.id);
      const category = {
        产品类型: row['产品类型'] || '',
        灌装机型号: row['灌装机型号'] || '',
        灌装自动线: row['灌装自动线'] || '',
        桶盖: row['桶盖'] || '',
        容量: row['容量'] || '',
        来料方式: row['来料方式'] || '',
        防爆要求: row['防爆要求'] || '',
        灌装方式: row['灌装方式'] || '',
        理盖方式: row['理盖方式'] || '',
        放盖方式: row['放盖方式'] || '',
        压盖方式: row['压盖方式'] || '',
        输送方式: row['输送方式'] || '',
        缓存方式: row['缓存方式'] || '',
        VOC要求: row['VOC要求'] || '',
        分桶方式: row['分桶方式'] || '',
        码垛方式: row['码垛方式'] || ''
      };
      const multiSelect = {
        检重方式: (row['检重方式'] || '').split('|').filter(Boolean),
        贴标方式: (row['贴标方式'] || '').split('|').filter(Boolean),
        托盘方式: (row['托盘方式'] || '').split('|').filter(Boolean),
        装箱方式: (row['装箱方式'] || '').split('|').filter(Boolean),
        其他功能: (row['其他功能'] || '').split('|').filter(Boolean)
      };
      const payload = {
        id: row.id || createId('vid_'),
        title: row.title,
        description: row.description,
        fileName: row.fileName || 'sample.mp4',
        posterName: row.posterName || 'sample.jpg',
        fileSize: Number(row.fileSize || 0),
        duration: Number(row.duration || 0),
        uploadedAt: row.uploadedAt || new Date().toISOString(),
        category,
        multiSelect
      };
      if (existing) {
        Object.assign(existing, payload);
      } else {
        draft.videos.push(payload);
      }
    });
  });
  return updated;
}

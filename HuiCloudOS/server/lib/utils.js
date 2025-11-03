import { randomBytes } from 'node:crypto';
import { access, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

export async function ensureDir(dirPath) {
  try {
    await access(dirPath, constants.F_OK);
  } catch (err) {
    await mkdir(dirPath, { recursive: true });
  }
}

export function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With'
  });
  res.end(body);
}

export function sendText(res, status, text, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(text),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With'
  });
  res.end(text);
}

export function notFound(res) {
  sendJSON(res, 404, { message: 'Not Found' });
}

export async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  const type = req.headers['content-type'] || '';
  if (type.includes('application/json')) {
    try {
      return JSON.parse(buffer.toString('utf-8'));
    } catch (err) {
      return {};
    }
  }
  if (type.includes('application/x-www-form-urlencoded')) {
    const text = buffer.toString('utf-8');
    const params = new URLSearchParams(text);
    const obj = {};
    params.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
  return buffer;
}

export function createId(prefix = '') {
  return `${prefix}${randomBytes(8).toString('hex')}`;
}

export function mapNetworkInterfaces(osModule) {
  const interfaces = osModule.networkInterfaces();
  const addresses = [];
  Object.values(interfaces).forEach((list) => {
    if (!list) return;
    list.forEach((addr) => {
      if (addr.family === 'IPv4') {
        addresses.push(addr.address);
      }
    });
  });
  return addresses;
}

export function resolvePublicPath(baseDir, requestPath) {
  const resolved = path.normalize(path.join(baseDir, requestPath));
  if (!resolved.startsWith(baseDir)) {
    return null;
  }
  return resolved;
}

export function withCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
}

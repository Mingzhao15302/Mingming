import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { getStore, updateStore, getProductTypes } from './lib/store.js';
import { sendJSON, parseBody, notFound, resolvePublicPath, withCors, mapNetworkInterfaces, createId } from './lib/utils.js';
import { writeChunk, mergeChunks, calculateUploadSize, removeTemp, savePoster, ensureSampleAssets, getPublicDirs, MAX_VIDEO_SIZE } from './lib/upload.js';
import { exportVideos, importVideosFromCSV } from './lib/csv.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sessions = new Map();
const TOKEN_TTL = 1000 * 60 * 60 * 12; // 12 hours

await ensureSampleAssets();

function authenticate(req) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  if (!token || !sessions.has(token)) {
    return null;
  }
  const payload = sessions.get(token);
  if (Date.now() > payload.expiredAt) {
    sessions.delete(token);
    return null;
  }
  return payload;
}

async function handleLogin(req, res) {
  const body = await parseBody(req);
  const { username, password } = body;
  if (username === 'hxadmin' && password === 'hx84556793') {
    const token = createId('token_');
    const payload = { token, username, role: 'admin', expiredAt: Date.now() + TOKEN_TTL };
    sessions.set(token, payload);
    sendJSON(res, 200, { token, user: { username, role: 'admin' } });
  } else {
    sendJSON(res, 401, { message: '账号或密码错误' });
  }
}

async function handleSession(req, res) {
  const session = authenticate(req);
  if (!session) {
    sendJSON(res, 401, { message: '未登录' });
    return;
  }
  sendJSON(res, 200, { token: session.token, user: { username: session.username, role: session.role } });
}

function applyVideoFilters(videos, query) {
  const page = Number(query.page || 1);
  const pageSize = Number(query.pageSize || 30);
  const search = (query.search || '').toLowerCase();
  const filtered = videos.filter((video) => {
    const desc = (video.description || '').toLowerCase();
    const title = (video.title || '').toLowerCase();
    const matchesSearch = !search || title.includes(search) || desc.includes(search);
    if (!matchesSearch) return false;
    let categoryValid = true;
    Object.entries(query).forEach(([key, value]) => {
      if (!value) return;
      if (key.startsWith('category[')) {
        const field = key.slice(9, -1);
        if (value && video.category?.[field] !== value) {
          categoryValid = false;
        }
      }
      if (key.startsWith('multi[')) {
        const field = key.slice(6, -1);
        const values = value.split('|').filter(Boolean);
        if (values.length && !values.every((item) => video.multiSelect?.[field]?.includes(item))) {
          categoryValid = false;
        }
      }
    });
    return categoryValid;
  });
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);
  return { page, pageSize, total: filtered.length, list: paged };
}

async function handleVideos(req, res, query) {
  const store = await getStore();
  const result = applyVideoFilters(store.videos, query);
  sendJSON(res, 200, result);
}

async function handleVideoUpdate(req, res, id) {
  try {
    const body = await parseBody(req);
    await updateStore((draft) => {
      const target = draft.videos.find((video) => video.id === id);
      if (!target) {
        throw new Error('视频不存在');
      }
      Object.assign(target, body);
    });
    sendJSON(res, 200, { success: true });
  } catch (err) {
    sendJSON(res, 404, { message: err.message });
  }
}

async function handleUploadChunk(req, res, query) {
  try {
    const { uploadId, chunkIndex } = query;
    if (!uploadId) {
      throw new Error('缺少 uploadId');
    }
    await writeChunk({ uploadId, chunkIndex }, req);
    const size = await calculateUploadSize(uploadId);
    if (size > MAX_VIDEO_SIZE) {
      await removeTemp(uploadId);
      throw new Error('上传文件超过 100MB');
    }
    sendJSON(res, 200, { success: true, size });
  } catch (err) {
    sendJSON(res, 400, { message: err.message });
  }
}

async function handleMerge(req, res) {
  try {
    const body = await parseBody(req);
    const { uploadId, fileName, totalChunks, meta } = body;
    const { size } = await mergeChunks({ uploadId, fileName, totalChunks });
    const payload = await updateStore((draft) => {
      const record = {
        id: meta?.id || createId('vid_'),
        title: meta?.title || fileName,
        description: meta?.description || '上传视频',
        fileName,
        posterName: meta?.posterName || 'sample.jpg',
        fileSize: size,
        duration: meta?.duration || 0,
        uploadedAt: new Date().toISOString(),
        category: meta?.category || {},
        multiSelect: meta?.multiSelect || {}
      };
      if (meta?.id) {
        const existing = draft.videos.find((v) => v.id === meta.id);
        if (existing) {
          Object.assign(existing, record);
        } else {
          draft.videos.push(record);
        }
      } else {
        draft.videos.unshift(record);
      }
      return record;
    });
    sendJSON(res, 200, { success: true, video: payload });
  } catch (err) {
    sendJSON(res, 400, { message: err.message });
  }
}

async function handlePoster(req, res) {
  try {
    const body = await parseBody(req);
    const { fileName, data } = body;
    if (!fileName || !data) {
      throw new Error('缺少参数');
    }
    const base64 = data.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    await savePoster(fileName, buffer);
    sendJSON(res, 200, { success: true });
  } catch (err) {
    sendJSON(res, 400, { message: err.message });
  }
}

async function handleExport(req, res) {
  const store = await getStore();
  const { content } = await exportVideos(store);
  res.writeHead(200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="videos-${Date.now()}.csv"`,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With'
  });
  res.end(content);
}

async function handleImport(req, res) {
  try {
    const body = await parseBody(req);
    const { csv } = body;
    if (!csv) {
      throw new Error('缺少 csv 内容');
    }
    await importVideosFromCSV(csv);
    sendJSON(res, 200, { success: true });
  } catch (err) {
    sendJSON(res, 400, { message: err.message });
  }
}

async function handleProducts(res, query) {
  const store = await getStore();
  if (query.id) {
    const target = store.products.find((product) => product.id === query.id);
    sendJSON(res, 200, { product: target || null });
    return;
  }
  const page = Number(query.page || 1);
  const pageSize = Number(query.pageSize || 12);
  const search = (query.search || '').toLowerCase();
  const filtered = store.products.filter((product) => {
    if (!search) return true;
    return product.name.toLowerCase().includes(search) || product.model.toLowerCase().includes(search);
  });
  const start = (page - 1) * pageSize;
  const list = filtered.slice(start, start + pageSize);
  sendJSON(res, 200, { page, pageSize, total: filtered.length, list });
}

async function handleOrders(req, res) {
  if (req.method === 'GET') {
    const store = await getStore();
    sendJSON(res, 200, { list: store.orders });
    return;
  }
  if (req.method === 'POST') {
    const body = await parseBody(req);
    const order = await updateStore((draft) => {
      const payload = {
        id: createId('ord_'),
        ...body,
        createdAt: new Date().toISOString()
      };
      draft.orders.push(payload);
      return payload;
    });
    sendJSON(res, 200, { order });
  }
}

async function handleQuotes(req, res) {
  if (req.method === 'GET') {
    const store = await getStore();
    sendJSON(res, 200, { list: store.quotes });
    return;
  }
  if (req.method === 'POST') {
    const body = await parseBody(req);
    const quote = await updateStore((draft) => {
      const payload = {
        id: createId('quo_'),
        ...body,
        createdAt: new Date().toISOString()
      };
      draft.quotes.push(payload);
      return payload;
    });
    sendJSON(res, 200, { quote });
  }
}

async function handleSettings(req, res) {
  if (req.method === 'GET') {
    const store = await getStore();
    sendJSON(res, 200, store.settings);
    return;
  }
  if (req.method === 'PUT') {
    const body = await parseBody(req);
    const settings = await updateStore((draft) => {
      draft.settings = { ...draft.settings, ...body };
      return draft.settings;
    });
    sendJSON(res, 200, settings);
  }
}

function serveStatic(req, res, pathname) {
  const { publicDir } = getPublicDirs();
  const base = path.join(publicDir);
  const filePath = resolvePublicPath(base, pathname);
  if (!filePath) {
    notFound(res);
    return;
  }
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      notFound(res);
      return;
    }
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => notFound(res));
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With'
    });
    stream.pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  withCors(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With'
    });
    res.end();
    return;
  }

  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || '/';

  if (pathname === '/api/login' && req.method === 'POST') {
    await handleLogin(req, res);
    return;
  }
  if (pathname === '/api/session' && req.method === 'GET') {
    await handleSession(req, res);
    return;
  }

  if (pathname === '/api/videos' && req.method === 'GET') {
    await handleVideos(req, res, parsed.query);
    return;
  }
  if (pathname === '/api/product-types' && req.method === 'GET') {
    sendJSON(res, 200, getProductTypes());
    return;
  }

  if (pathname.startsWith('/api')) {
    const session = authenticate(req);
    if (!session) {
      sendJSON(res, 401, { message: '未登录或登录超时' });
      return;
    }

    if (pathname.startsWith('/api/videos/') && req.method === 'PUT') {
      const id = pathname.split('/').pop();
      await handleVideoUpdate(req, res, id);
      return;
    }
    if (pathname === '/api/videos/upload' && req.method === 'POST') {
      await handleUploadChunk(req, res, parsed.query);
      return;
    }
    if (pathname === '/api/videos/merge' && req.method === 'POST') {
      await handleMerge(req, res);
      return;
    }
    if (pathname === '/api/videos/poster' && req.method === 'POST') {
      await handlePoster(req, res);
      return;
    }
    if (pathname === '/api/videos/export' && req.method === 'GET') {
      await handleExport(req, res);
      return;
    }
    if (pathname === '/api/videos/import' && req.method === 'POST') {
      await handleImport(req, res);
      return;
    }
    if (pathname === '/api/products' && req.method === 'GET') {
      await handleProducts(res, parsed.query);
      return;
    }
    if (pathname === '/api/orders') {
      await handleOrders(req, res);
      return;
    }
    if (pathname === '/api/quotes') {
      await handleQuotes(req, res);
      return;
    }
    if (pathname === '/api/settings') {
      await handleSettings(req, res);
      return;
    }
    notFound(res);
    return;
  }

  if (pathname.startsWith('/assets') || pathname.startsWith('/videos') || pathname.startsWith('/posters') || pathname.startsWith('/products')) {
    serveStatic(req, res, pathname);
    return;
  }

  notFound(res);
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  const addresses = mapNetworkInterfaces(os);
  const localUrl = `http://localhost:${PORT}`;
  console.log(`HuiCloud OS API 已启动，端口 ${PORT}`);
  console.log('可用地址:');
  console.log(`  • ${localUrl}`);
  addresses
    .filter((addr) => addr !== '127.0.0.1')
    .forEach((addr) => {
      console.log(`  • http://${addr}:${PORT}`);
    });
});

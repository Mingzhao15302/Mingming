const API_BASE = import.meta.env.VITE_API_BASE || '';
const MAX_SIZE = 100 * 1024 * 1024;

const buildOptions = (options = {}) => {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }
  return {
    credentials: 'include',
    ...options,
    headers
  };
};

export const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, buildOptions(options));
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const login = (payload) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
export const fetchVideos = (params) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/api/videos?${query}`);
};

export const updateVideoMeta = (id, payload) => apiFetch(`/api/videos/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
export const deleteVideo = (id) => apiFetch(`/api/videos/${id}`, { method: 'DELETE' });
export const savePoster = (id, dataUrl) =>
  apiFetch(`/api/videos/${id}/poster`, { method: 'POST', body: JSON.stringify({ dataUrl }) });

export const uploadPoster = (id, dataUrl) => savePoster(id, dataUrl);

const createChunkPayload = (file, chunkSize) => {
  const chunks = [];
  let offset = 0;
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    chunks.push({ chunk, start: offset, end: offset + chunk.size });
    offset += chunkSize;
  }
  return chunks;
};

export const uploadVideo = async ({ file, onProgress, signal, concurrency = 3 }) => {
  if (file.size > MAX_SIZE) {
    throw new Error('文件超过 100MB 限制');
  }
  const chunkSize = 2 * 1024 * 1024;
  const chunks = createChunkPayload(file, chunkSize);
  let uploaded = 0;
  let failed = false;
  const queue = [...chunks.entries()];

  const uploadChunk = async ([index, chunkData]) => {
    const formData = new FormData();
    formData.append('file', chunkData.chunk, file.name);
    formData.append('index', index.toString());
    formData.append('total', chunks.length.toString());
    formData.append('filename', file.name);
    formData.append('size', file.size.toString());

    const response = await fetch(`${API_BASE}/api/videos/upload-chunk`, {
      method: 'POST',
      body: formData,
      signal
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    uploaded += chunkData.chunk.size;
    onProgress?.(Math.min(100, Math.floor((uploaded / file.size) * 100)));
  };

  const workers = new Array(Math.min(concurrency, chunks.length)).fill(null).map(async () => {
    while (queue.length && !failed) {
      const job = queue.shift();
      try {
        await uploadChunk(job);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  });

  await Promise.all(workers);

  if (failed) {
    throw new Error('上传失败');
  }

  const response = await fetch(`${API_BASE}/api/videos/complete`, buildOptions({
    method: 'POST',
    body: JSON.stringify({ filename: file.name, size: file.size })
  }));
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
};

export const fetchProducts = () => apiFetch('/api/products');
export const fetchOrders = () => apiFetch('/api/orders');
export const fetchQuotes = () => apiFetch('/api/quotes');
export const createQuote = (payload) => apiFetch('/api/quotes', { method: 'POST', body: JSON.stringify(payload) });
export const saveSettings = (payload) => apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify(payload) });
export const getSettings = () => apiFetch('/api/settings');
export const fetchMaintenance = () => apiFetch('/api/maintenance');
export const triggerBackup = () => apiFetch('/api/maintenance/backup', { method: 'POST' });

export const submitOrder = (payload) => apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(payload) });

export const exportVideosCsv = (params) => {
  const query = new URLSearchParams(params).toString();
  return fetch(`${API_BASE}/api/videos/export?${query}`, {
    headers: { Accept: 'text/csv' }
  }).then((response) => response.text());
};

export const importVideosCsv = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE}/api/videos/import`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
};

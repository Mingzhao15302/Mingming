const CATEGORY_OPTIONS = {
  series: ['30A系列', '30B系列', '30BG系列', '30G系列', '30GY系列', 'ZSQ系列', 'HX200系列', '2T系列'],
  weight: ['0.5~5kg', '10~20kg', '50~200kg', '1000kg'],
  capping: ['5L平板压盖', '20L平板压盖', '花篮压盖', '辊压', '助力臂拧盖', '无'],
  conveyor: ['滚筒', '板链', '无'],
  buffer: ['不锈钢面板', '无动力滚筒', '无动力滚筒延长架', '无'],
  voc: ['一体式集气罩', '灌装阀集气罩', '无'],
  explosion: ['防爆', '不防爆'],
};

const API_ENDPOINTS = {
  status: '/api/status',
  videos: '/api/videos',
  video: (id) => `/api/videos/${id}`,
  deleteAll: '/api/videos/all',
};

const state = {
  videos: [],
  selected: new Set(),
  editingIndex: null,
  status: null,
  statusUpdatedAt: null,
};

const elements = {
  uploadInput: document.getElementById('video-upload'),
  tableBody: document.getElementById('video-table-body'),
  selectAllBtn: document.getElementById('select-all'),
  clearSelectionBtn: document.getElementById('clear-selection'),
  deleteSelectedBtn: document.getElementById('delete-selected'),
  deleteAllBtn: document.getElementById('delete-all'),
  exportBtn: document.getElementById('export-csv'),
  importInput: document.getElementById('import-csv'),
  selectAllCheckbox: document.getElementById('select-all-checkbox'),
  managementStatus: document.getElementById('management-status'),
  globalStatus: document.getElementById('global-status'),
  refreshStatusBtn: document.getElementById('refresh-status'),
  editDialog: document.getElementById('edit-dialog'),
  editForm: document.getElementById('edit-form'),
  editPrev: document.getElementById('edit-prev'),
  editNext: document.getElementById('edit-next'),
  editCancel: document.getElementById('edit-cancel'),
};

function formatBytes(size) {
  if (!size && size !== 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(Math.max(size, 1)) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(timestamp) {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

function formatDuration(seconds) {
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60).toString().padStart(2, '0');
  const secs = (total % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function populateSelect(select, options, withBlank = true) {
  if (!select) return;
  select.innerHTML = '';
  if (withBlank) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '全部';
    select.appendChild(option);
  }
  for (const value of options) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }
}

function populateDialogSelects() {
  const dialogSelects = elements.editForm.querySelectorAll('select');
  dialogSelects.forEach((select) => {
    const key = select.name;
    populateSelect(select, CATEGORY_OPTIONS[key], false);
  });
}

async function fetchStatus() {
  try {
    const response = await fetch(API_ENDPOINTS.status);
    if (!response.ok) throw new Error('无法获取服务器状态');
    const status = await response.json();
    state.status = status;
    state.statusUpdatedAt = Date.now();
    updateStatusUI();
  } catch (error) {
    console.error(error);
    state.status = { status: 'offline' };
    updateStatusUI();
  }
}

async function fetchVideos() {
  try {
    const response = await fetch(API_ENDPOINTS.videos);
    if (!response.ok) throw new Error('无法获取视频列表');
    const data = await response.json();
    state.videos = Array.isArray(data.videos) ? data.videos : [];
  } catch (error) {
    console.error(error);
    state.videos = [];
  }
  state.videos.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  state.selected.clear();
  renderTable();
  refreshSelectionUI();
}

function videoUrl(video) {
  return `/media/${encodeURIComponent(video.storageName)}`;
}

function renderStatusCards(container, status) {
  if (!container) return;
  container.innerHTML = '';
  if (!status || status.status === 'offline') {
    const div = document.createElement('div');
    div.className = 'status-card';
    div.innerHTML = `
      <span class="label">连接状态</span>
      <span class="value">离线</span>
      <span class="label">请检查服务器是否已启动</span>
    `;
    container.appendChild(div);
    return;
  }

  const items = [
    { label: '连接状态', value: '在线' },
    { label: '视频数量', value: `${status.videoCount || 0} 个` },
    { label: '存储占用', value: status.totalSizeReadable || formatBytes(status.totalSize) },
    { label: '更新时间', value: formatDate(status.lastUpdated) },
    { label: '服务器运行时长', value: formatDuration(status.uptime || 0) },
  ];

  for (const item of items) {
    const card = document.createElement('div');
    card.className = 'status-card';
    card.innerHTML = `
      <span class="label">${item.label}</span>
      <span class="value">${item.value}</span>
    `;
    container.appendChild(card);
  }
}

function updateStatusUI() {
  const status = state.status;
  const isOnline = status && status.status === 'online';

  if (elements.globalStatus) {
    elements.globalStatus.classList.toggle('offline', !isOnline);
    const text = elements.globalStatus.querySelector('.status-text');
    const indicator = elements.globalStatus.querySelector('.indicator');
    if (text) {
      text.textContent = isOnline
        ? `服务器在线 · 更新于 ${formatDate(state.statusUpdatedAt)}`
        : '服务器离线';
    }
    if (indicator) {
      indicator.style.background = isOnline ? 'var(--success)' : 'var(--danger)';
    }
  }

  renderStatusCards(elements.managementStatus, status);
}

function renderTable() {
  elements.tableBody.innerHTML = '';
  for (const video of state.videos) {
    const row = document.createElement('tr');
    const checked = state.selected.has(video.id);
    row.innerHTML = `
      <td><input type="checkbox" data-id="${video.id}" ${checked ? 'checked' : ''} /></td>
      <td>
        <div class="preview-thumb">
          <video src="${videoUrl(video)}" preload="metadata"></video>
        </div>
      </td>
      <td>${video.name || video.storageName}</td>
      <td>${video.clientName || '—'}</td>
      <td>${video.material || '—'}</td>
      <td>${video.series || '—'}</td>
      <td>${video.weight || '—'}</td>
      <td>${video.capping || '—'}</td>
      <td>${video.conveyor || '—'}</td>
      <td>${video.buffer || '—'}</td>
      <td>${video.voc || '—'}</td>
      <td>${video.explosion || '—'}</td>
      <td>
        <div class="table-actions">
          <button class="secondary" data-action="edit" data-id="${video.id}">编辑</button>
          <button class="danger" data-action="delete" data-id="${video.id}">删除</button>
        </div>
      </td>
    `;
    elements.tableBody.appendChild(row);
  }
}

function refreshSelectionUI() {
  const total = state.videos.length;
  const selected = state.selected.size;
  if (elements.selectAllCheckbox) {
    elements.selectAllCheckbox.checked = total > 0 && selected === total;
    elements.selectAllCheckbox.indeterminate = selected > 0 && selected < total;
  }
}

async function handleUpload(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;
  const formData = new FormData();
  for (const file of files) {
    formData.append('videos', file);
  }

  try {
    const response = await fetch(API_ENDPOINTS.videos, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('上传失败');
    }

    await fetchVideos();
    await fetchStatus();
  } catch (error) {
    console.error(error);
    alert('上传失败，请检查文件大小或服务器状态。');
  } finally {
    elements.uploadInput.value = '';
  }
}

async function handleDelete(ids) {
  if (!ids.length) return;
  await fetch(API_ENDPOINTS.videos, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  await fetchVideos();
  await fetchStatus();
}

async function handleDeleteAll() {
  await fetch(API_ENDPOINTS.deleteAll, { method: 'DELETE' });
  await fetchVideos();
  await fetchStatus();
}

function exportCSV() {
  const headers = [
    'id',
    '文件名',
    '客户名称',
    '物料信息',
    '型号系列',
    '灌装重量',
    '压盖方式',
    '输送方式',
    '缓存方式',
    'VOC要求',
    '防爆要求',
  ];
  const rows = state.videos.map((video) => [
    video.id,
    video.name || '',
    video.clientName || '',
    video.material || '',
    video.series || '',
    video.weight || '',
    video.capping || '',
    video.conveyor || '',
    video.buffer || '',
    video.voc || '',
    video.explosion || '',
  ]);

  const lines = [headers.join(','), ...rows.map((row) => row.map(escapeCsvCell).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `辉鑫科技视频列表-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value) {
  const stringValue = `${value ?? ''}`;
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

async function importCSV(file) {
  if (!file) return;
  const content = await file.text();
  const rows = parseCSV(content);
  if (!rows.length) return;
  const headers = rows[0];
  const updates = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || !row.length) continue;
    const entry = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']));
    if (!entry.id) continue;
    updates.push({
      id: entry.id,
      name: entry['文件名'] || '',
      clientName: entry['客户名称'] || '',
      material: entry['物料信息'] || '',
      series: entry['型号系列'] || '',
      weight: entry['灌装重量'] || '',
      capping: entry['压盖方式'] || '',
      conveyor: entry['输送方式'] || '',
      buffer: entry['缓存方式'] || '',
      voc: entry['VOC要求'] || '',
      explosion: entry['防爆要求'] || '',
    });
  }

  if (!updates.length) return;

  await fetch(API_ENDPOINTS.videos, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videos: updates }),
  });
  await fetchVideos();
}

function parseCSV(text) {
  const rows = [];
  let current = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      current.push(value.trim());
      value = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (value || current.length) {
        current.push(value.trim());
        rows.push(current);
        current = [];
        value = '';
      }
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      continue;
    }

    value += char;
  }

  if (value || current.length) {
    current.push(value.trim());
    rows.push(current);
  }

  return rows.filter((row) => row.some((cell) => cell !== ''));
}

function setupSelectionControls() {
  elements.selectAllBtn.addEventListener('click', () => {
    state.selected = new Set(state.videos.map((video) => video.id));
    renderTable();
    refreshSelectionUI();
  });

  elements.clearSelectionBtn.addEventListener('click', () => {
    state.selected.clear();
    renderTable();
    refreshSelectionUI();
  });

  elements.deleteSelectedBtn.addEventListener('click', async () => {
    if (state.selected.size === 0) return;
    if (!confirm(`确定删除选中的 ${state.selected.size} 个视频吗？`)) return;
    await handleDelete(Array.from(state.selected));
  });

  elements.deleteAllBtn.addEventListener('click', async () => {
    if (!state.videos.length) return;
    if (!confirm('确定删除全部视频及其信息吗？此操作不可撤销。')) return;
    await handleDeleteAll();
  });

  elements.selectAllCheckbox.addEventListener('change', (event) => {
    if (event.target.checked) {
      state.selected = new Set(state.videos.map((video) => video.id));
    } else {
      state.selected.clear();
    }
    renderTable();
    refreshSelectionUI();
  });
}

function setupTableListeners() {
  elements.tableBody.addEventListener('change', async (event) => {
    const checkbox = event.target;
    if (!(checkbox instanceof HTMLInputElement)) return;
    const id = checkbox.dataset.id;
    if (!id) return;
    if (checkbox.checked) {
      state.selected.add(id);
    } else {
      state.selected.delete(id);
    }
    refreshSelectionUI();
  });

  elements.tableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const id = button.dataset.id;
    const action = button.dataset.action;
    if (!id || !action) return;

    if (action === 'edit') {
      openEditDialog(id);
    } else if (action === 'delete') {
      if (confirm('确定删除该视频吗？')) {
        await handleDelete([id]);
      }
    }
  });
}

function openEditDialog(id) {
  const index = state.videos.findIndex((video) => video.id === id);
  if (index === -1) return;
  state.editingIndex = index;
  const video = state.videos[index];
  const form = elements.editForm;
  form.name.value = video.name || '';
  form.clientName.value = video.clientName || '';
  form.material.value = video.material || '';
  form.series.value = video.series || CATEGORY_OPTIONS.series[0];
  form.weight.value = video.weight || CATEGORY_OPTIONS.weight[0];
  form.capping.value = video.capping || CATEGORY_OPTIONS.capping[0];
  form.conveyor.value = video.conveyor || CATEGORY_OPTIONS.conveyor[0];
  form.buffer.value = video.buffer || CATEGORY_OPTIONS.buffer[0];
  form.voc.value = video.voc || CATEGORY_OPTIONS.voc[0];
  form.explosion.value = video.explosion || CATEGORY_OPTIONS.explosion[0];
  if (typeof elements.editDialog.showModal === 'function') {
    elements.editDialog.showModal();
  }
}

function changeEditingIndex(direction) {
  if (state.editingIndex == null) return;
  const nextIndex = state.editingIndex + direction;
  if (nextIndex < 0 || nextIndex >= state.videos.length) return;
  openEditDialog(state.videos[nextIndex].id);
}

function setupEditDialog() {
  elements.editPrev.addEventListener('click', () => changeEditingIndex(-1));
  elements.editNext.addEventListener('click', () => changeEditingIndex(1));
  elements.editCancel.addEventListener('click', () => {
    elements.editDialog.close();
  });

  elements.editForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const video = state.videos[state.editingIndex];
    if (!video) return;
    const formData = new FormData(elements.editForm);
    const updates = Object.fromEntries(formData.entries());
    const response = await fetch(API_ENDPOINTS.video(video.id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      alert('保存失败，请稍后重试');
      return;
    }
    elements.editDialog.close();
    await fetchVideos();
  });
}

function setupStatusRefresh() {
  elements.refreshStatusBtn.addEventListener('click', () => {
    fetchStatus();
  });
  setInterval(fetchStatus, 15000);
}

async function bootstrap() {
  populateDialogSelects();
  setupSelectionControls();
  setupTableListeners();
  setupEditDialog();
  setupStatusRefresh();

  elements.uploadInput.addEventListener('change', handleUpload);
  elements.exportBtn.addEventListener('click', exportCSV);
  elements.importInput.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    importCSV(file).finally(() => {
      elements.importInput.value = '';
    });
  });

  await fetchStatus();
  await fetchVideos();
}

document.addEventListener('DOMContentLoaded', bootstrap);

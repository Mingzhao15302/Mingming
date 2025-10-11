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
  chart: null,
  chartType: 'radar',
  editingIndex: null,
  dialogMinimized: false,
  status: null,
  statusUpdatedAt: null,
};

const elements = {
  tabButtons: Array.from(document.querySelectorAll('.tab-button')),
  sections: Array.from(document.querySelectorAll('.tab-section')),
  uploadInput: document.getElementById('video-upload'),
  tableBody: document.getElementById('video-table-body'),
  selectAllBtn: document.getElementById('select-all'),
  clearSelectionBtn: document.getElementById('clear-selection'),
  deleteSelectedBtn: document.getElementById('delete-selected'),
  deleteAllBtn: document.getElementById('delete-all'),
  exportBtn: document.getElementById('export-csv'),
  importInput: document.getElementById('import-csv'),
  selectAllCheckbox: document.getElementById('select-all-checkbox'),
  dashboardFilters: document.getElementById('dashboard-filters'),
  viewToggleButtons: Array.from(document.querySelectorAll('.view-toggle button')),
  chartCanvas: document.getElementById('distribution-chart'),
  previewGrid: document.getElementById('preview-grid'),
  statsGrid: document.getElementById('stats-grid'),
  managementStatus: document.getElementById('management-status'),
  dashboardStatus: document.getElementById('dashboard-status'),
  dashboardStatusGrid: document.getElementById('dashboard-status-grid'),
  globalStatus: document.getElementById('global-status'),
  refreshStatusBtn: document.getElementById('refresh-status'),
  editDialog: document.getElementById('edit-dialog'),
  editForm: document.getElementById('edit-form'),
  editPrev: document.getElementById('edit-prev'),
  editNext: document.getElementById('edit-next'),
  editCancel: document.getElementById('edit-cancel'),
  editMinimize: document.getElementById('edit-minimize'),
  editClose: document.getElementById('edit-close'),
  editSubtitle: document.getElementById('edit-dialog-subtitle'),
  dialogHeader: document.querySelector('#edit-dialog .dialog-header'),
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

function truncateMiddle(text, maxLength = 38) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  const separator = '…';
  const available = maxLength - separator.length;
  const front = Math.ceil(available / 2);
  const back = Math.floor(available / 2);
  return `${text.slice(0, front)}${separator}${text.slice(text.length - back)}`;
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

function ensureOption(key, value) {
  const options = CATEGORY_OPTIONS[key] || [];
  if (value && options.includes(value)) {
    return value;
  }
  return options[0] || '';
}

function populateAllSelects() {
  const filterSelects = elements.dashboardFilters.querySelectorAll('select');
  filterSelects.forEach((select) => {
    const key = select.name;
    populateSelect(select, CATEGORY_OPTIONS[key], true);
  });

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
  const currentEditingId =
    elements.editDialog?.open && state.editingIndex != null
      ? state.videos[state.editingIndex]?.id
      : null;
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
  updateDashboard();

  if (currentEditingId && elements.editDialog?.open) {
    const newIndex = state.videos.findIndex((video) => video.id === currentEditingId);
    if (newIndex !== -1) {
      setEditingIndex(newIndex);
    } else {
      elements.editDialog.close();
    }
  }
}

function videoUrl(video) {
  return `/media/${encodeURIComponent(video.storageName)}`;
}

function renderStatusCards(container, status) {
  if (!container) return;
  container.innerHTML = '';

  if (!status || status.status === 'offline') {
    const card = document.createElement('div');
    card.className = 'status-card';

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = '连接状态';

    const value = document.createElement('span');
    value.className = 'value value--danger';
    value.textContent = '离线';

    const hint = document.createElement('span');
    hint.className = 'label';
    hint.textContent = '请检查服务器是否已启动';

    card.append(label, value, hint);
    container.appendChild(card);
    return;
  }

  const items = [
    { label: '连接状态', value: '在线' },
    { label: '视频数量', value: `${status.videoCount || 0} 个` },
    {
      label: '存储占用',
      value: status.totalSizeReadable || formatBytes(status.totalSize),
    },
    { label: '更新时间', value: formatDate(status.lastUpdated) },
    { label: '服务器运行时长', value: formatDuration(status.uptime || 0) },
    status.storagePath
      ? {
          label: '视频存储路径',
          value: truncateMiddle(status.storagePath, 44),
          tooltip: status.storagePath,
          mono: true,
        }
      : null,
    status.metadataPath
      ? {
          label: '元数据路径',
          value: truncateMiddle(status.metadataPath, 44),
          tooltip: status.metadataPath,
          mono: true,
        }
      : null,
  ].filter(Boolean);

  for (const item of items) {
    const card = document.createElement('div');
    card.className = 'status-card';

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = item.label;

    const value = document.createElement('span');
    value.className = `value${item.mono ? ' value--mono' : ''}`;
    value.textContent = item.value;
    if (item.tooltip) {
      value.title = item.tooltip;
    }

    card.append(label, value);
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

  if (elements.dashboardStatus) {
    elements.dashboardStatus.textContent = isOnline
      ? `在线 · ${formatBytes(status.totalSize || 0)} / ${status.videoCount || 0} 个视频`
      : '服务器离线';
  }

  renderStatusCards(elements.managementStatus, status);
  renderStatusCards(elements.dashboardStatusGrid, status);
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

function updateEditDialogSummary() {
  if (state.editingIndex == null) return;
  const index = state.editingIndex;
  const video = state.videos[index];
  if (!video) return;
  if (elements.editSubtitle) {
    const title = video.name || video.storageName;
    elements.editSubtitle.textContent = `第 ${index + 1} / ${state.videos.length} 个 · ${title}`;
  }
  if (elements.editPrev) {
    elements.editPrev.disabled = index <= 0;
  }
  if (elements.editNext) {
    elements.editNext.disabled = index >= state.videos.length - 1;
  }
}

function applyFilters(videos) {
  const filters = new FormData(elements.dashboardFilters);
  return videos.filter((video) => {
    for (const [key, value] of filters.entries()) {
      if (!value) continue;
      if ((video[key] || '') !== value) return false;
    }
    return true;
  });
}

function renderStats(filtered) {
  const total = state.videos.length;
  const filteredCount = filtered.length;
  const uniqueSeries = new Set(filtered.map((video) => video.series).filter(Boolean)).size;
  const totalSize = state.videos.reduce((sum, video) => sum + (video.size || 0), 0);
  const filteredSize = filtered.reduce((sum, video) => sum + (video.size || 0), 0);

  const stats = [
    { label: '全部视频', value: `${total} 个` },
    { label: '筛选结果', value: `${filteredCount} 个` },
    { label: '涉及分类', value: `${uniqueSeries} 个` },
    { label: '总存储占用', value: formatBytes(totalSize) },
    { label: '筛选存储', value: formatBytes(filteredSize) },
  ];

  elements.statsGrid.innerHTML = '';
  for (const stat of stats) {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = `
      <span class="label">${stat.label}</span>
      <span class="value">${stat.value}</span>
    `;
    elements.statsGrid.appendChild(card);
  }
}

function renderPreview(filtered) {
  elements.previewGrid.innerHTML = '';
  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.className = 'hint';
    empty.textContent = '暂无符合条件的视频，请调整筛选条件。';
    elements.previewGrid.appendChild(empty);
    return;
  }

  for (const video of filtered) {
    const card = document.createElement('div');
    card.className = 'preview-card';
    card.innerHTML = `
      <video src="${videoUrl(video)}" controls preload="metadata"></video>
      <h3>${video.name || video.storageName}</h3>
      <div class="meta">
        客户：${video.clientName || '—'} · 物料：${video.material || '—'}<br />
        型号：${video.series || '—'} · 重量：${video.weight || '—'}
      </div>
    `;
    elements.previewGrid.appendChild(card);
  }
}

function updateChart(filtered) {
  const ctx = elements.chartCanvas.getContext('2d');
  const labels = CATEGORY_OPTIONS.series;
  const counts = labels.map((series) => filtered.filter((video) => video.series === series).length);
  const dataset = {
    labels,
    datasets: [
      {
        label: '视频数量',
        data: counts,
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: 'rgba(37, 99, 235, 0.8)',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: state.chartType === 'bar'
      ? {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
        }
      : {},
  };

  if (state.chart) {
    state.chart.destroy();
  }

  state.chart = new Chart(ctx, {
    type: state.chartType,
    data: dataset,
    options,
  });
}

function updateDashboard() {
  const filtered = applyFilters(state.videos);
  renderStats(filtered);
  renderPreview(filtered);
  updateChart(filtered);
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

function setupTabNavigation() {
  elements.tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.target;
      elements.tabButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
      elements.sections.forEach((section) =>
        section.classList.toggle('active', section.id === target),
      );
    });
  });
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
  setDialogMinimized(false);
  if (setEditingIndex(index) && typeof elements.editDialog.showModal === 'function') {
    if (!elements.editDialog.open) {
      elements.editDialog.showModal();
    }
  }
}

function changeEditingIndex(direction) {
  if (state.editingIndex == null) return;
  const nextIndex = state.editingIndex + direction;
  if (nextIndex < 0 || nextIndex >= state.videos.length) return;
  setEditingIndex(nextIndex);
}

function setupEditDialog() {
  elements.editPrev.addEventListener('click', () => changeEditingIndex(-1));
  elements.editNext.addEventListener('click', () => changeEditingIndex(1));
  elements.editCancel.addEventListener('click', () => {
    elements.editDialog.close();
  });

  elements.editMinimize.addEventListener('click', () => {
    setDialogMinimized(!state.dialogMinimized);
  });

  elements.editClose.addEventListener('click', () => {
    elements.editDialog.close();
  });

  if (elements.dialogHeader) {
    elements.dialogHeader.addEventListener('click', (event) => {
      if (!state.dialogMinimized) return;
      if (event.target.closest('.dialog-window-controls')) return;
      setDialogMinimized(false);
    });
  }

  elements.editDialog.addEventListener('close', () => {
    state.editingIndex = null;
    setDialogMinimized(false);
    if (elements.editSubtitle) {
      elements.editSubtitle.textContent = '请选择要编辑的视频';
    }
  });

  elements.editForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const index = state.editingIndex;
    if (index == null) return;
    const video = state.videos[index];
    if (!video) return;
    const formData = new FormData(elements.editForm);
    const updates = Object.fromEntries(formData.entries());
    try {
      const response = await fetch(API_ENDPOINTS.video(video.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('保存失败');
      }
      const data = await response.json();
      const updatedVideo = data.video || { ...video, ...updates };
      const stateIndex = state.videos.findIndex((item) => item.id === video.id);
      if (stateIndex !== -1) {
        state.videos[stateIndex] = {
          ...state.videos[stateIndex],
          ...updatedVideo,
        };
      }
      renderTable();
      refreshSelectionUI();
      updateDashboard();
      if (stateIndex !== -1 && elements.editDialog?.open) {
        setEditingIndex(stateIndex);
      }
      fetchStatus();
    } catch (error) {
      console.error(error);
      alert('保存失败，请稍后重试');
    }
  });
}

function setEditingIndex(index) {
  if (index == null || index < 0 || index >= state.videos.length) {
    return false;
  }
  state.editingIndex = index;
  const video = state.videos[index];
  if (!video) {
    return false;
  }
  const form = elements.editForm;
  form.name.value = video.name || '';
  form.clientName.value = video.clientName || '';
  form.material.value = video.material || '';
  form.series.value = ensureOption('series', video.series);
  form.weight.value = ensureOption('weight', video.weight);
  form.capping.value = ensureOption('capping', video.capping);
  form.conveyor.value = ensureOption('conveyor', video.conveyor);
  form.buffer.value = ensureOption('buffer', video.buffer);
  form.voc.value = ensureOption('voc', video.voc);
  form.explosion.value = ensureOption('explosion', video.explosion);
  updateEditDialogSummary();
  return true;
}

function setDialogMinimized(minimized) {
  state.dialogMinimized = minimized;
  if (elements.editDialog) {
    elements.editDialog.classList.toggle('minimized', minimized);
  }
  if (elements.editMinimize) {
    elements.editMinimize.textContent = minimized ? '▢' : '▁';
    elements.editMinimize.setAttribute(
      'aria-label',
      minimized ? '还原编辑窗口' : '最小化编辑窗口',
    );
    elements.editMinimize.setAttribute(
      'title',
      minimized ? '还原编辑窗口' : '最小化编辑窗口',
    );
  }
}

function setupViewToggle() {
  elements.viewToggleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.chartType = button.dataset.chart;
      elements.viewToggleButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
      updateDashboard();
    });
  });
}

function setupFilters() {
  elements.dashboardFilters.addEventListener('change', () => {
    updateDashboard();
  });

  elements.dashboardFilters.addEventListener('reset', (event) => {
    event.preventDefault();
    for (const select of elements.dashboardFilters.querySelectorAll('select')) {
      select.value = '';
    }
    updateDashboard();
  });
}

function setupStatusRefresh() {
  elements.refreshStatusBtn.addEventListener('click', () => {
    fetchStatus();
  });
  setInterval(fetchStatus, 15000);
}

async function bootstrap() {
  setupTabNavigation();
  populateAllSelects();
  setupSelectionControls();
  setupTableListeners();
  setupEditDialog();
  setupViewToggle();
  setupFilters();
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

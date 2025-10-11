const CATEGORY_OPTIONS = {
  series: [
    '30A系列',
    '30B系列',
    '30BG系列',
    '30G系列',
    '30GY系列',
    'ZSQ系列',
    'HX200系列',
    '2T系列',
  ],
  weight: ['0.5~5kg', '10~20kg', '50~200kg', '1000kg'],
  capping: ['5L平板压盖', '20L平板压盖', '花篮压盖', '辊压', '助力臂拧盖', '无'],
  conveyor: ['滚筒', '板链', '无'],
  buffer: ['不锈钢面板', '无动力滚筒', '无动力滚筒延长架', '无'],
  voc: ['一体式集气罩', '灌装阀集气罩', '无'],
  explosion: ['防爆', '不防爆'],
};

const state = {
  videos: [],
  selected: new Set(),
  chart: null,
  chartType: 'radar',
  editingIndex: null,
  status: {
    online: null,
    videoCount: 0,
    totalSize: 0,
    lastChecked: null,
  },
};

const elements = {
  tabButtons: Array.from(document.querySelectorAll('.tab-button')),
  sections: Array.from(document.querySelectorAll('.tab-section')),
  statusWidgets: Array.from(document.querySelectorAll('[data-status-widget]')),
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
  editDialog: document.getElementById('edit-dialog'),
  editForm: document.getElementById('edit-form'),
  editPrev: document.getElementById('edit-prev'),
  editNext: document.getElementById('edit-next'),
  editCancel: document.getElementById('edit-cancel'),
  metricTotal: document.getElementById('metric-total'),
  metricFiltered: document.getElementById('metric-filtered'),
  metricSeries: document.getElementById('metric-series'),
  metricStorage: document.getElementById('metric-storage'),
};

function populateSelect(select, options, includeAll = false) {
  select.innerHTML = '';
  if (includeAll) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '全部';
    select.append(option);
  }
  for (const value of options) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.append(option);
  }
}

function initFilters() {
  for (const [key, options] of Object.entries(CATEGORY_OPTIONS)) {
    const select = elements.dashboardFilters.elements.namedItem(key);
    if (select) {
      populateSelect(select, options, true);
    }
  }

  const editSelects = elements.editForm.querySelectorAll('select');
  editSelects.forEach((select) => {
    const key = select.name;
    populateSelect(select, CATEGORY_OPTIONS[key] ?? []);
  });
}

function switchTab(targetId) {
  elements.tabButtons.forEach((btn) => {
    const active = btn.dataset.target === targetId;
    btn.classList.toggle('active', active);
  });
  elements.sections.forEach((section) => {
    section.classList.toggle('active', section.id === targetId);
  });
}

elements.tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.target));
});

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = Number(bytes);
  let unit = units.shift();
  while (size >= 1024 && units.length) {
    size /= 1024;
    unit = units.shift();
  }
  return `${size.toFixed(size >= 10 || !units.length ? 0 : 1)} ${unit}`;
}

function updateStatusUI() {
  const { online, videoCount, totalSize, lastChecked } = state.status;
  elements.statusWidgets.forEach((widget) => {
    const indicator = widget.querySelector('[data-status-indicator]');
    const text = widget.querySelector('[data-status-text]');
    const meta = widget.querySelector('[data-status-meta]');
    if (!indicator || !text || !meta) return;
    indicator.classList.toggle('online', online === true);
    indicator.classList.toggle('offline', online === false);
    if (online === null) {
      text.textContent = '文件服务器状态检测中…';
      meta.textContent = '—';
    } else if (online) {
      text.textContent = '文件服务器正常运行';
      const checked = lastChecked
        ? new Date(lastChecked).toLocaleString()
        : new Date().toLocaleString();
      meta.textContent = `视频：${videoCount} 条 · 存储：${formatSize(totalSize)} · 最近检测：${checked}`;
    } else {
      text.textContent = '文件服务器离线';
      meta.textContent = '请检查 Node.js 服务是否启动';
    }
  });
}

async function fetchStatus() {
  try {
    const response = await fetch('/api/status', { cache: 'no-store' });
    if (!response.ok) throw new Error('status error');
    const data = await response.json();
    state.status = {
      online: true,
      videoCount: data.videoCount,
      totalSize: data.totalSize,
      lastChecked: Date.now(),
    };
  } catch (error) {
    state.status.online = false;
    state.status.lastChecked = Date.now();
  } finally {
    updateStatusUI();
    window.setTimeout(fetchStatus, 10000);
  }
}

function renderTable() {
  elements.tableBody.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (const [index, video] of state.videos.entries()) {
    const tr = document.createElement('tr');

    const checkboxCell = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = state.selected.has(video.id);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        state.selected.add(video.id);
      } else {
        state.selected.delete(video.id);
      }
      refreshSelectionUI();
    });
    checkboxCell.append(checkbox);
    tr.append(checkboxCell);

    const previewCell = document.createElement('td');
    const videoEl = document.createElement('video');
    videoEl.className = 'video-preview';
    videoEl.src = video.streamPath;
    videoEl.controls = true;
    videoEl.muted = true;
    previewCell.append(videoEl);
    tr.append(previewCell);

    const fields = [
      video.name,
      video.clientName,
      video.material,
      video.series,
      video.weight,
      video.capping,
      video.conveyor,
      video.buffer,
      video.voc,
      video.explosion,
    ];

    for (const value of fields) {
      const td = document.createElement('td');
      td.textContent = value || '—';
      tr.append(td);
    }

    const actionsCell = document.createElement('td');
    const sizeInfo = document.createElement('div');
    sizeInfo.className = 'meta';
    sizeInfo.textContent = formatSize(video.size);
    const editButton = document.createElement('button');
    editButton.textContent = '修改';
    editButton.addEventListener('click', () => openEditDialog(index));
    actionsCell.append(editButton, sizeInfo);
    tr.append(actionsCell);

    fragment.append(tr);
  }
  elements.tableBody.append(fragment);
  elements.selectAllCheckbox.checked =
    state.videos.length > 0 && state.selected.size === state.videos.length;
}

function refreshSelectionUI() {
  const hasSelection = state.selected.size > 0;
  elements.clearSelectionBtn.disabled = !hasSelection;
  elements.deleteSelectedBtn.disabled = !hasSelection;
  elements.selectAllBtn.disabled = state.videos.length === 0;
  elements.deleteAllBtn.disabled = state.videos.length === 0;
  elements.exportBtn.disabled = state.videos.length === 0;
  elements.selectAllCheckbox.indeterminate =
    hasSelection && state.selected.size !== state.videos.length;
  elements.selectAllCheckbox.checked =
    state.videos.length > 0 && state.selected.size === state.videos.length;
}

function applyFilters() {
  const formData = new FormData(elements.dashboardFilters);
  const filters = Object.fromEntries(formData.entries());
  return state.videos.filter((video) =>
    Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      return video[key] === value;
    }),
  );
}

function renderMetrics() {
  const filtered = applyFilters();
  const totalStorage = state.videos.reduce((sum, video) => sum + (video.size || 0), 0);
  const uniqueSeries = new Set(state.videos.map((video) => video.series).filter(Boolean));
  elements.metricTotal.textContent = state.videos.length;
  elements.metricFiltered.textContent = filtered.length;
  elements.metricSeries.textContent = uniqueSeries.size;
  elements.metricStorage.textContent = formatSize(totalStorage);
}

function updateChart() {
  const filtered = applyFilters();
  const categories = CATEGORY_OPTIONS.series;
  const counts = categories.map((series) =>
    filtered.filter((video) => video.series === series).length,
  );

  const config = {
    type: state.chartType,
    data: {
      labels: categories,
      datasets: [
        {
          label: '视频数量',
          data: counts,
          backgroundColor:
            state.chartType === 'bar' ? '#93c5fd' : 'rgba(37, 99, 235, 0.35)',
          borderColor: '#2563eb',
          borderWidth: 2,
          pointBackgroundColor: '#2563eb',
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      scales:
        state.chartType === 'bar'
          ? {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0,
                },
              },
            }
          : {},
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  };

  if (state.chart) {
    state.chart.destroy();
  }
  state.chart = new Chart(elements.chartCanvas, config);
}

function renderPreviewGrid() {
  const filtered = applyFilters();
  elements.previewGrid.innerHTML = '';
  if (filtered.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = '暂无符合条件的视频，请调整筛选条件。';
    empty.className = 'hint';
    elements.previewGrid.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const video of filtered) {
    const card = document.createElement('div');
    card.className = 'preview-card';

    const title = document.createElement('h3');
    title.textContent = video.name;

    const videoEl = document.createElement('video');
    videoEl.controls = true;
    videoEl.src = video.streamPath;
    videoEl.setAttribute('preload', 'metadata');

    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.className = 'fullscreen-btn';
    fullscreenBtn.textContent = '全屏播放';
    fullscreenBtn.addEventListener('click', () => {
      if (videoEl.requestFullscreen) {
        videoEl.requestFullscreen();
      } else if (videoEl.webkitRequestFullscreen) {
        videoEl.webkitRequestFullscreen();
      }
    });

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `
      <span>客户：${video.clientName || '—'}</span>
      <span>物料：${video.material || '—'}</span>
      <span>型号系列：${video.series || '—'}</span>
      <span>灌装重量：${video.weight || '—'}</span>
      <span>压盖方式：${video.capping || '—'}</span>
      <span>输送方式：${video.conveyor || '—'}</span>
      <span>缓存方式：${video.buffer || '—'}</span>
      <span>VOC 要求：${video.voc || '—'}</span>
      <span>防爆要求：${video.explosion || '—'}</span>
    `;

    card.append(title, videoEl, fullscreenBtn, meta);
    fragment.append(card);
  }
  elements.previewGrid.append(fragment);
}

function updateDashboard() {
  renderMetrics();
  updateChart();
  renderPreviewGrid();
}

function openEditDialog(index) {
  const video = state.videos[index];
  if (!video) return;
  state.editingIndex = index;
  const form = elements.editForm;
  form.elements.name.value = video.name || '';
  form.elements.clientName.value = video.clientName || '';
  form.elements.material.value = video.material || '';
  for (const key of Object.keys(CATEGORY_OPTIONS)) {
    if (form.elements[key]) {
      form.elements[key].value = video[key] || '';
    }
  }
  elements.editPrev.disabled = index === 0;
  elements.editNext.disabled = index === state.videos.length - 1;
  elements.editDialog.showModal();
}

function closeEditDialog() {
  elements.editDialog.close();
  state.editingIndex = null;
}

elements.editPrev.addEventListener('click', () => {
  if (state.editingIndex == null) return;
  const prevIndex = Math.max(0, state.editingIndex - 1);
  openEditDialog(prevIndex);
});

elements.editNext.addEventListener('click', () => {
  if (state.editingIndex == null) return;
  const nextIndex = Math.min(state.videos.length - 1, state.editingIndex + 1);
  openEditDialog(nextIndex);
});

elements.editCancel.addEventListener('click', () => {
  closeEditDialog();
});

elements.editDialog.addEventListener('close', () => {
  state.editingIndex = null;
});

elements.editForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (state.editingIndex == null) return;
  const video = state.videos[state.editingIndex];
  const formData = new FormData(elements.editForm);
  const payload = Object.fromEntries(formData.entries());
  payload.name = payload.name.trim();
  try {
    const response = await fetch(`/api/videos/${video.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('更新失败');
    await hydrateState();
    closeEditDialog();
  } catch (error) {
    alert(error.message || '更新失败，请重试');
  }
});

function createCSVRow(values) {
  return values
    .map((value) => {
      if (value == null) return '';
      const text = String(value);
      if (/[",\n]/.test(text)) {
        return '"' + text.replace(/"/g, '""') + '"';
      }
      return text;
    })
    .join(',');
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
    '原始文件名',
    '文件大小',
  ];
  const rows = [createCSVRow(headers)];
  for (const video of state.videos) {
    rows.push(
      createCSVRow([
        video.id,
        video.name,
        video.clientName,
        video.material,
        video.series,
        video.weight,
        video.capping,
        video.conveyor,
        video.buffer,
        video.voc,
        video.explosion,
        video.originalName,
        video.size,
      ]),
    );
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `视频信息_${timestamp}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  const pushValue = (row) => {
    if (!rows[row]) rows[row] = [];
    rows[row].push(current);
    current = '';
  };
  let row = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        pushValue(row);
      } else if (char === '\n') {
        pushValue(row);
        row += 1;
      } else if (char === '\r') {
        // ignore
      } else {
        current += char;
      }
    }
  }
  pushValue(row);
  return rows.filter((r) => r.length > 0);
}

async function importCSV(file) {
  if (!file) return;
  const text = await file.text();
  const rows = parseCSV(text);
  if (rows.length <= 1) return;
  const [header, ...dataRows] = rows;
  const headerMap = header.map((h) => h.trim());
  const updates = [];
  for (const row of dataRows) {
    const entry = {};
    headerMap.forEach((key, idx) => {
      entry[key] = row[idx];
    });
    if (!entry.id) continue;
    updates.push({
      id: entry.id,
      name: entry['文件名'] ?? '',
      clientName: entry['客户名称'] ?? '',
      material: entry['物料信息'] ?? '',
      series: entry['型号系列'] ?? '',
      weight: entry['灌装重量'] ?? '',
      capping: entry['压盖方式'] ?? '',
      conveyor: entry['输送方式'] ?? '',
      buffer: entry['缓存方式'] ?? '',
      voc: entry['VOC要求'] ?? '',
      explosion: entry['防爆要求'] ?? '',
    });
  }
  try {
    const response = await fetch('/api/videos/bulk-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    if (!response.ok) throw new Error('导入失败');
    await hydrateState();
  } catch (error) {
    alert(error.message || '导入 CSV 失败，请重试');
  }
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
    try {
      const response = await fetch('/api/videos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(state.selected) }),
      });
      if (!response.ok) throw new Error('删除失败');
      await hydrateState();
    } catch (error) {
      alert(error.message || '删除失败，请重试');
    }
  });

  elements.deleteAllBtn.addEventListener('click', async () => {
    if (state.videos.length === 0) return;
    if (!confirm('确定删除全部视频及其信息吗？此操作不可撤销。')) return;
    try {
      const response = await fetch('/api/videos/all', { method: 'DELETE' });
      if (!response.ok) throw new Error('删除失败');
      await hydrateState();
    } catch (error) {
      alert(error.message || '删除失败，请重试');
    }
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

function setupDashboardControls() {
  elements.dashboardFilters.addEventListener('input', () => {
    updateDashboard();
  });

  elements.dashboardFilters.addEventListener('reset', (event) => {
    event.preventDefault();
    for (const element of elements.dashboardFilters.elements) {
      if (element.tagName === 'SELECT') {
        element.value = '';
      }
    }
    updateDashboard();
  });

  elements.viewToggleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.chartType = button.dataset.chart;
      elements.viewToggleButtons.forEach((btn) =>
        btn.classList.toggle('active', btn === button),
      );
      updateDashboard();
    });
  });
}

function setupFileControls() {
  elements.uploadInput.addEventListener('change', async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const formData = new FormData();
    files.forEach((file) => formData.append('videos', file));
    try {
      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('上传失败');
      elements.uploadInput.value = '';
      await hydrateState();
    } catch (error) {
      alert(error.message || '上传失败，请重试');
    }
  });

  elements.exportBtn.addEventListener('click', exportCSV);

  elements.importInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    await importCSV(file);
    elements.importInput.value = '';
  });
}

async function hydrateState() {
  try {
    const response = await fetch('/api/videos');
    if (!response.ok) throw new Error('加载失败');
    const videos = await response.json();
    videos.sort((a, b) => a.createdAt - b.createdAt);
    state.videos = videos;
    state.selected.clear();
    renderTable();
    refreshSelectionUI();
    updateDashboard();
  } catch (error) {
    console.error(error);
  }
}

async function bootstrap() {
  initFilters();
  setupSelectionControls();
  setupDashboardControls();
  setupFileControls();
  await hydrateState();
  updateStatusUI();
  fetchStatus();
}

document.addEventListener('DOMContentLoaded', bootstrap);

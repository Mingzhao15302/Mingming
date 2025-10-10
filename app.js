const { openDB } = window.idb;

const CATEGORY_OPTIONS = {
  series: ['30A', '30B', '30BG-', '30G', '30GY', 'ZSQ', 'HX200', '2T'],
  weight: ['0.5~5kg', '10~20kg', '50~200kg', '1000kg'],
  capping: ['5L平板压盖', '20L平板压盖', '花篮压盖', '辊压', '助力臂拧盖', '无'],
  conveyor: ['滚筒', '板链', '无'],
  buffer: ['不锈钢面板', '无动力滚筒', '无动力滚筒延长架', '无'],
  voc: ['一体式集气罩', '灌装阀集气罩', '无'],
  explosion: ['防爆', '不防爆'],
};

class VideoStore {
  static async create() {
    const db = await openDB('hx-video-manager', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('videos')) {
          const store = db.createObjectStore('videos', { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
        }
      },
    });
    return new VideoStore(db);
  }

  constructor(db) {
    this.db = db;
  }

  async getAll() {
    return await this.db.getAllFromIndex('videos', 'createdAt');
  }

  async addFiles(files) {
    if (!files.length) return [];

    const formData = new FormData();
    for (const file of files) {
      formData.append('videos', file);
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('上传视频文件失败');
    }

    const payload = await response.json();
    const uploaded = Array.isArray(payload.files) ? payload.files : [];

    if (!uploaded.length) {
      throw new Error('上传响应中没有包含任何文件');
    }

    const tx = this.db.transaction('videos', 'readwrite');
    const store = tx.store;
    const added = [];

    for (const file of uploaded) {
      const id = crypto.randomUUID();
      const timestamp = Date.now();
      const record = {
        id,
        name: file.originalName,
        clientName: '',
        material: '',
        series: CATEGORY_OPTIONS.series[0] ?? '',
        weight: CATEGORY_OPTIONS.weight[0] ?? '',
        capping: CATEGORY_OPTIONS.capping[0] ?? '',
        conveyor: CATEGORY_OPTIONS.conveyor[0] ?? '',
        buffer: CATEGORY_OPTIONS.buffer[0] ?? '',
        voc: CATEGORY_OPTIONS.voc[0] ?? '',
        explosion: CATEGORY_OPTIONS.explosion[0] ?? '',
        createdAt: timestamp,
        updatedAt: timestamp,
        size: file.size,
        type: file.type,
        originalName: file.originalName,
        filePath: file.path,
      };
      await store.put(record);
      added.push(record);
    }

    await tx.done;
    return added;
  }

  async update(id, updates) {
    const existing = await this.db.get('videos', id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };
    await this.db.put('videos', updated);
    return updated;
  }

  async deleteMany(ids) {
    if (!ids.length) return;

    const records = await Promise.all(ids.map((id) => this.db.get('videos', id)));
    const paths = records
      .map((record) => record?.filePath)
      .filter((value) => typeof value === 'string' && value.length > 0);

    if (paths.length) {
      try {
        await fetch('/api/videos', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths }),
        });
      } catch (error) {
        console.error('删除视频文件时出错', error);
      }
    }

    const tx = this.db.transaction('videos', 'readwrite');
    for (const id of ids) {
      await tx.store.delete(id);
    }
    await tx.done;
  }

  async deleteAll() {
    const videos = await this.getAll();
    const paths = videos
      .map((video) => video.filePath)
      .filter((value) => typeof value === 'string' && value.length > 0);

    if (paths.length) {
      try {
        await fetch('/api/videos', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths }),
        });
      } catch (error) {
        console.error('删除视频文件时出错', error);
      }
    }

    await this.db.clear('videos');
  }
}

const state = {
  videos: [],
  selected: new Set(),
  editingIndex: null,
  chart: null,
  chartType: 'radar',
};

const legacyObjectUrls = new Map();

function clearLegacyObjectUrls() {
  for (const url of legacyObjectUrls.values()) {
    URL.revokeObjectURL(url);
  }
  legacyObjectUrls.clear();
}

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
  editDialog: document.getElementById('edit-dialog'),
  editForm: document.getElementById('edit-form'),
  editPrev: document.getElementById('edit-prev'),
  editNext: document.getElementById('edit-next'),
  editCancel: document.getElementById('edit-cancel'),
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
  const filterForm = elements.dashboardFilters;
  for (const [key, options] of Object.entries(CATEGORY_OPTIONS)) {
    const select = filterForm.elements.namedItem(key);
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

function getVideoSrc(video) {
  if (!video) return '';
  if (video.filePath) {
    const cacheBuster = video.updatedAt || video.createdAt || Date.now();
    return `./${video.filePath}?v=${cacheBuster}`;
  }
  if (video.blob instanceof Blob) {
    if (!legacyObjectUrls.has(video.id)) {
      legacyObjectUrls.set(video.id, URL.createObjectURL(video.blob));
    }
    return legacyObjectUrls.get(video.id) ?? '';
  }
  return '';
}

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = units.shift();
  while (size >= 1024 && units.length) {
    size /= 1024;
    unit = units.shift();
  }
  return `${size.toFixed(size >= 10 || !units.length ? 0 : 1)} ${unit}`;
}

function renderTable() {
  const tbody = elements.tableBody;
  tbody.innerHTML = '';
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
    videoEl.src = getVideoSrc(video);
    videoEl.controls = true;
    videoEl.muted = true;
    previewCell.append(videoEl);
    tr.append(previewCell);

    const cells = [
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

    for (const value of cells) {
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
  tbody.append(fragment);
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
  return state.videos.filter((video) => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      return video[key] === value;
    });
  });
}

function updateChart() {
  const filtered = applyFilters();
  const categories = CATEGORY_OPTIONS.series;
  const counts = categories.map(
    (series) => filtered.filter((video) => video.series === series).length,
  );
  const config = {
    type: state.chartType,
    data: {
      labels: categories,
      datasets: [
        {
          label: '视频数量',
          data: counts,
          backgroundColor: state.chartType === 'bar' ? '#93c5fd' : 'rgba(37, 99, 235, 0.4)',
          borderColor: '#2563eb',
          borderWidth: 2,
          pointBackgroundColor: '#2563eb',
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: state.chartType === 'bar'
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
    videoEl.src = getVideoSrc(video);
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
      <span>型号系列：${video.series}</span>
      <span>灌装重量：${video.weight}</span>
      <span>压盖方式：${video.capping}</span>
      <span>输送方式：${video.conveyor}</span>
      <span>缓存方式：${video.buffer}</span>
      <span>VOC 要求：${video.voc}</span>
      <span>防爆要求：${video.explosion}</span>
    `;

    card.append(title, videoEl, fullscreenBtn, meta);
    fragment.append(card);
  }
  elements.previewGrid.append(fragment);
}

function updateDashboard() {
  updateChart();
  renderPreviewGrid();
}

function openEditDialog(index) {
  state.editingIndex = index;
  const video = state.videos[index];
  if (!video) return;
  const form = elements.editForm;
  form.elements.name.value = video.name;
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
  if (state.editingIndex === null) return;
  const prevIndex = Math.max(0, state.editingIndex - 1);
  openEditDialog(prevIndex);
});

elements.editNext.addEventListener('click', () => {
  if (state.editingIndex === null) return;
  const nextIndex = Math.min(state.videos.length - 1, state.editingIndex + 1);
  openEditDialog(nextIndex);
});

elements.editCancel.addEventListener('click', () => {
  closeEditDialog();
});

elements.editForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (state.editingIndex === null) return;
  const video = state.videos[state.editingIndex];
  const formData = new FormData(elements.editForm);
  const updates = Object.fromEntries(formData.entries());
  updates.name = updates.name.trim();
  await store.update(video.id, updates);
  await hydrateState();
  closeEditDialog();
});

elements.editDialog.addEventListener('close', () => {
  state.editingIndex = null;
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
    '文件路径',
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
        video.filePath,
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
  for (const row of dataRows) {
    const entry = {};
    headerMap.forEach((key, idx) => {
      entry[key] = row[idx];
    });
    if (!entry.id) continue;
    const updates = {
      name: entry['文件名'],
      clientName: entry['客户名称'],
      material: entry['物料信息'],
      series: entry['型号系列'],
      weight: entry['灌装重量'],
      capping: entry['压盖方式'],
      conveyor: entry['输送方式'],
      buffer: entry['缓存方式'],
      voc: entry['VOC要求'],
      explosion: entry['防爆要求'],
    };
    if (entry['文件路径']) {
      updates.filePath = entry['文件路径'];
    }
    await store.update(entry.id, updates);
  }
  await hydrateState();
}

async function hydrateState() {
  const videos = await store.getAll();
  clearLegacyObjectUrls();
  videos.sort((a, b) => a.createdAt - b.createdAt);
  state.videos = videos;
  state.selected.clear();
  renderTable();
  refreshSelectionUI();
  updateDashboard();
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
    await store.deleteMany(Array.from(state.selected));
    await hydrateState();
  });

  elements.deleteAllBtn.addEventListener('click', async () => {
    if (state.videos.length === 0) return;
    if (!confirm('确定删除全部视频及其信息吗？此操作不可撤销。')) return;
    await store.deleteAll();
    await hydrateState();
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
    try {
      await store.addFiles(files);
      await hydrateState();
    } catch (error) {
      console.error(error);
      alert('上传视频时出现问题，请稍后重试。');
    } finally {
      elements.uploadInput.value = '';
    }
  });

  elements.exportBtn.addEventListener('click', exportCSV);

  elements.importInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    await importCSV(file);
    elements.importInput.value = '';
  });
}

let store;

async function bootstrap() {
  store = await VideoStore.create();
  initFilters();
  setupSelectionControls();
  setupDashboardControls();
  setupFileControls();
  await hydrateState();
}

document.addEventListener('DOMContentLoaded', bootstrap);

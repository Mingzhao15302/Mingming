import '../../styles/base.css';
import '../../styles/dashboard.css';

const AUTH_KEY = 'hyos-authenticated';
const categoryFieldsCache = {
  fields: [],
  defaults: {},
  defaultProductType: '灌装机',
};

const modalState = {
  video: null,
  fields: [],
  currentType: '灌装机',
  values: {},
  videos: [],
  currentIndex: -1,
};

const importSummaryState = {
  summary: null,
  unmatched: [],
  duplicates: [],
};

function guardAuth() {
  if (localStorage.getItem(AUTH_KEY) !== 'true') {
    window.location.href = '/login';
  }
}

async function fetchCategoryFields() {
  if (categoryFieldsCache.fields.length) return categoryFieldsCache.fields;
  const response = await fetch('/api/config/categories');
  const data = await response.json();
  categoryFieldsCache.fields = data;
  categoryFieldsCache.defaults = buildDefaultCategories(data);
  categoryFieldsCache.defaultProductType = data.find((field) => field.key === 'productType')?.default || '灌装机';
  return data;
}

async function fetchVideos() {
  const response = await fetch('/api/videos');
  return response.json();
}

function buildDefaultCategories(fields) {
  const defaults = {};
  fields.forEach((field) => {
    if (field.type === 'multi') {
      defaults[field.key] = [];
    } else if (field.default) {
      defaults[field.key] = field.default;
    } else if (field.options?.includes('空白')) {
      defaults[field.key] = '空白';
    } else {
      defaults[field.key] = field.options?.[0] ?? '';
    }
  });
  return defaults;
}

function shouldDisplayField(field, productType) {
  if (field.key === 'productType') return true;
  if (!field.contexts || field.contexts.length === 0) return true;
  if (field.contexts.includes('all')) return true;
  return field.contexts.includes(productType);
}

function getFieldOrder(field, productType) {
  if (field.order) {
    if (field.order[productType] !== undefined) return field.order[productType];
    if (field.order.default !== undefined) return field.order.default;
  }
  return 999;
}

function summariseCategories(video, fields) {
  const productType = video.categories?.productType || categoryFieldsCache.defaultProductType;
  const relevantFields = fields
    .filter((field) => field.key !== 'productType' && shouldDisplayField(field, productType))
    .sort((a, b) => getFieldOrder(a, productType) - getFieldOrder(b, productType));

  const entries = relevantFields
    .filter((field) => {
      const value = video.categories?.[field.key];
      if (field.type === 'multi') {
        return Array.isArray(value) && value.length > 0;
      }
      return Boolean(value) && value !== '空白';
    })
    .slice(0, 3)
    .map((field) => {
      const value = video.categories?.[field.key];
      const text = Array.isArray(value) ? value.join(' / ') : value;
      return `${field.label}: ${text}`;
    });

  return entries.join(' · ');
}

function renderTable(videos, fields, highlightId = null) {
  const tbody = document.getElementById('videosTableBody');
  const emptyState = document.getElementById('emptyState');
  tbody.innerHTML = '';

  if (!videos.length) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  videos.forEach((video) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${video.title || video.originalName || '未命名视频'}</td>
      <td>${video.fileName}</td>
      <td>
        <div class="tag-line">
          ${fields
            .map((field) => {
              const value = video.categories?.[field.key];
              if (field.type === 'multi' && Array.isArray(value) && value.length) {
                return value
                  .map((item) => `<span class="tag">${field.label}: ${item}</span>`)
                  .join('');
              }
              if (value && value !== '空白' && field.key !== 'productType') {
                return `<span class="tag">${field.label}: ${value}</span>`;
              }
              return '';
            })
            .join('')}
        </div>
      </td>
      <td><button class="action-btn" data-id="${video.id}">编辑</button></td>
    `;
    if (highlightId && String(video.id) === highlightId) {
      row.classList.add('highlight-row');
    }
    tbody.appendChild(row);
  });
}

function formatSummaryMessage(summary) {
  if (!summary) return '已根据 CSV 更新分类信息。';
  const parts = [`成功匹配 ${summary.matched || 0} 条记录`];
  if (summary.unmatched) {
    parts.push(`未匹配 ${summary.unmatched} 条`);
  }
  if (summary.duplicateOverrides) {
    parts.push(`重复覆盖 ${summary.duplicateOverrides} 条`);
  }

  let guidance = '';
  if (summary.unmatched) {
    guidance += ' 请下载未匹配清单并检查文件名或分类字段。';
  }
  if (summary.duplicateOverrides) {
    guidance += ' 同名条目仅保留最后一次出现，建议核对重复覆盖清单。';
  }

  return `${parts.join('，')}。${guidance.trim()}`.trim();
}

function toggleImportSummary(visible) {
  const card = document.getElementById('importSummary');
  if (!card) return;
  if (visible) {
    card.classList.remove('hidden');
  } else {
    card.classList.add('hidden');
  }
}

function hideImportSummary() {
  importSummaryState.summary = null;
  importSummaryState.unmatched = [];
  importSummaryState.duplicates = [];
  const message = document.getElementById('importSummaryMessage');
  if (message) message.textContent = '';
  const unmatchedBtn = document.getElementById('downloadUnmatchedBtn');
  if (unmatchedBtn) unmatchedBtn.disabled = true;
  const duplicatesBtn = document.getElementById('downloadDuplicatesBtn');
  if (duplicatesBtn) duplicatesBtn.disabled = true;
  toggleImportSummary(false);
}

function showImportSummary(result) {
  if (!result) {
    hideImportSummary();
    return;
  }

  importSummaryState.summary = result.summary || null;
  importSummaryState.unmatched = Array.isArray(result.unmatched) ? result.unmatched : [];
  importSummaryState.duplicates = Array.isArray(result.duplicates) ? result.duplicates : [];

  const summary = importSummaryState.summary;

  const totalEl = document.getElementById('summaryTotal');
  const matchedEl = document.getElementById('summaryMatched');
  const unmatchedEl = document.getElementById('summaryUnmatched');
  const duplicatesEl = document.getElementById('summaryDuplicates');
  const messageEl = document.getElementById('importSummaryMessage');

  if (summary) {
    if (totalEl) totalEl.textContent = summary.totalRows ?? summary.total ?? 0;
    if (matchedEl) matchedEl.textContent = summary.matched ?? 0;
    if (unmatchedEl) unmatchedEl.textContent = summary.unmatched ?? 0;
    if (duplicatesEl) duplicatesEl.textContent = summary.duplicateOverrides ?? 0;
    if (messageEl) messageEl.textContent = formatSummaryMessage(summary);
  } else {
    if (totalEl) totalEl.textContent = '0';
    if (matchedEl) matchedEl.textContent = '0';
    if (unmatchedEl) unmatchedEl.textContent = '0';
    if (duplicatesEl) duplicatesEl.textContent = '0';
    if (messageEl) messageEl.textContent = 'CSV 导入已完成。';
  }

  const unmatchedBtn = document.getElementById('downloadUnmatchedBtn');
  if (unmatchedBtn) {
    unmatchedBtn.disabled = importSummaryState.unmatched.length === 0;
  }

  const duplicatesBtn = document.getElementById('downloadDuplicatesBtn');
  if (duplicatesBtn) {
    duplicatesBtn.disabled = importSummaryState.duplicates.length === 0;
  }

  toggleImportSummary(true);
}

function exportCsv(filename, headers, rows) {
  if (!rows.length) return;
  const lines = [headers.join(',')];
  rows.forEach((row) => {
    const line = row
      .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
      .join(',');
    lines.push(line);
  });
  const csvContent = `\uFEFF${lines.join('\r\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function downloadUnmatchedCsv() {
  if (!importSummaryState.unmatched.length) return;
  const headers = ['行号', 'fileName', 'originalName', '未匹配原因'];
  const rows = importSummaryState.unmatched.map((item) => [
    item.lineNumber ?? '',
    item.fileName ?? '',
    item.originalName ?? '',
    item.reason ?? '',
  ]);
  exportCsv('csv-unmatched-records.csv', headers, rows);
}

function downloadDuplicateCsv() {
  if (!importSummaryState.duplicates.length) return;
  const headers = ['fileName', 'originalName', '行号', '状态'];
  const rows = [];
  importSummaryState.duplicates.forEach((group) => {
    group.rows.forEach((entry) => {
      rows.push([entry.fileName ?? '', entry.originalName ?? '', entry.lineNumber ?? '', entry.status ?? '']);
    });
  });
  exportCsv('csv-duplicate-overrides.csv', headers, rows);
}

function pruneCategoriesForType(values, productType, fields) {
  const defaults = categoryFieldsCache.defaults;
  const allowedKeys = new Set(['productType']);
  fields.forEach((field) => {
    if (shouldDisplayField(field, productType)) {
      allowedKeys.add(field.key);
    }
  });

  Object.keys(values).forEach((key) => {
    if (!allowedKeys.has(key)) {
      const field = fields.find((item) => item.key === key);
      if (field?.type === 'multi') {
        values[key] = [];
      } else {
        values[key] = field?.default ?? defaults[key] ?? '';
      }
    }
  });

  return values;
}

function createToggleOption(option, checked, onChange) {
  const label = document.createElement('label');
  label.className = 'toggle-option';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.value = option;
  input.checked = checked;

  const track = document.createElement('span');
  track.className = 'toggle-track';

  const handle = document.createElement('span');
  handle.className = 'toggle-handle';
  track.appendChild(handle);

  const text = document.createElement('span');
  text.className = 'toggle-text';
  text.textContent = option;

  input.addEventListener('change', () => onChange(input.checked));

  label.append(input, track, text);
  return label;
}

function renderModalForm() {
  const form = document.getElementById('editForm');
  form.innerHTML = '';
  const { fields } = modalState;
  const currentType = modalState.currentType || categoryFieldsCache.defaultProductType;

  const relevantFields = fields
    .filter((field) => shouldDisplayField(field, currentType))
    .sort((a, b) => getFieldOrder(a, currentType) - getFieldOrder(b, currentType));

  relevantFields.forEach((field) => {
    if (field.type === 'multi') {
      const row = document.createElement('div');
      row.className = 'multi-field-row';
      row.dataset.multiKey = field.key;

      const title = document.createElement('span');
      title.className = 'field-title';
      title.textContent = field.label;

      const toggleGroup = document.createElement('div');
      toggleGroup.className = 'toggle-group';

      const selectedValues = Array.isArray(modalState.values[field.key]) ? modalState.values[field.key] : [];

      (field.options || []).forEach((option) => {
        const toggle = createToggleOption(option, selectedValues.includes(option), (isChecked) => {
          const currentValues = Array.isArray(modalState.values[field.key]) ? [...modalState.values[field.key]] : [];
          if (isChecked) {
            if (!currentValues.includes(option)) {
              currentValues.push(option);
            }
          } else {
            const index = currentValues.indexOf(option);
            if (index > -1) {
              currentValues.splice(index, 1);
            }
          }
          modalState.values[field.key] = currentValues;
        });
        toggleGroup.appendChild(toggle);
      });

      row.append(title, toggleGroup);
      form.appendChild(row);
      return;
    }

    const label = document.createElement('label');
    label.innerHTML = `<span>${field.label}</span>`;

    const select = document.createElement('select');
    select.name = field.key;

    const options = field.options || [];
    options.forEach((option) => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;
      if ((modalState.values[field.key] ?? '') === option) {
        optionElement.selected = true;
      }
      select.appendChild(optionElement);
    });

    label.appendChild(select);
    form.appendChild(label);

    select.addEventListener('change', () => {
      modalState.values[field.key] = select.value;
      if (field.key === 'productType') {
        modalState.currentType = select.value || categoryFieldsCache.defaultProductType;
        pruneCategoriesForType(modalState.values, modalState.currentType, fields);
        renderModalForm();
      }
    });
  });
}

function updateModalNavigation() {
  const prevBtn = document.getElementById('prevModalBtn');
  const nextBtn = document.getElementById('nextModalBtn');
  if (!prevBtn || !nextBtn) return;

  const total = Array.isArray(modalState.videos) ? modalState.videos.length : 0;
  const hasVideos = total > 0;

  prevBtn.disabled = !hasVideos || modalState.currentIndex <= 0;
  nextBtn.disabled = !hasVideos || modalState.currentIndex >= total - 1;
}

function openModal(video, fields, videos = modalState.videos, index = null) {
  const modal = document.getElementById('editModal');
  const form = document.getElementById('editForm');
  modalState.video = video;
  modalState.fields = fields;
  modalState.videos = Array.isArray(videos) ? videos : [];
  modalState.values = { ...categoryFieldsCache.defaults, ...video.categories };
  modalState.currentType = modalState.values.productType || categoryFieldsCache.defaultProductType;
  modalState.currentIndex =
    typeof index === 'number' && index >= 0
      ? index
      : modalState.videos.findIndex((item) => String(item.id) === String(video.id));

  if (modalState.currentIndex === -1 && modalState.videos.length) {
    modalState.currentIndex = modalState.videos.findIndex((item) => item.fileName === video.fileName);
  }

  if (modalState.currentIndex === -1) {
    modalState.videos = [...modalState.videos, video];
    modalState.currentIndex = modalState.videos.length - 1;
  }

  pruneCategoriesForType(modalState.values, modalState.currentType, fields);
  renderModalForm();
  form.dataset.id = video.id;
  modal.classList.remove('hidden');
  modal.classList.add('fade-in');
  updateModalNavigation();
}

function closeModal() {
  const modal = document.getElementById('editModal');
  modal.classList.add('hidden');
  modalState.video = null;
  modalState.videos = [];
  modalState.currentIndex = -1;
  updateModalNavigation();
}

function gatherFormData(form) {
  const selects = Array.from(form.querySelectorAll('select'));
  const categories = {};

  selects.forEach((select) => {
    categories[select.name] = select.value;
  });

  const multiGroups = Array.from(form.querySelectorAll('[data-multi-key]'));
  multiGroups.forEach((group) => {
    const key = group.dataset.multiKey;
    const values = Array.from(group.querySelectorAll('input[type="checkbox"]:checked')).map((input) => input.value);
    categories[key] = values;
  });

  return categories;
}

function bindTableActions(getVideos, fields) {
  document.getElementById('videosTableBody').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    const currentVideos = getVideos();
    const video = currentVideos.find((item) => String(item.id) === button.dataset.id);
    if (!video) return;
    openModal(
      video,
      fields,
      currentVideos,
      currentVideos.findIndex((item) => String(item.id) === button.dataset.id)
    );
  });
}

function navigateModal(step) {
  const videos = Array.isArray(modalState.videos) ? modalState.videos : [];
  if (!videos.length) return;
  const nextIndex = Math.min(Math.max(modalState.currentIndex + step, 0), videos.length - 1);
  if (nextIndex === modalState.currentIndex) return;
  const nextVideo = videos[nextIndex];
  if (!nextVideo) return;
  openModal(nextVideo, modalState.fields, videos, nextIndex);
}

function bindModalControls(fields, refresh) {
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelEditBtn').addEventListener('click', closeModal);
  document.getElementById('prevModalBtn').addEventListener('click', (event) => {
    if (event.currentTarget.disabled) return;
    navigateModal(-1);
  });
  document.getElementById('nextModalBtn').addEventListener('click', (event) => {
    if (event.currentTarget.disabled) return;
    navigateModal(1);
  });

  updateModalNavigation();

  document.getElementById('editForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const id = form.dataset.id;
    const categories = gatherFormData(form);
    const productType = categories.productType || categoryFieldsCache.defaultProductType;
    pruneCategoriesForType(categories, productType, fields);

    const response = await fetch(`/api/videos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categories }),
    });
    const result = await response.json();
    if (result.success) {
      refresh(result.videos);
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    const modal = document.getElementById('editModal');
    if (!modal || modal.classList.contains('hidden')) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      navigateModal(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      navigateModal(1);
    }
  });
}

async function init() {
  guardAuth();
  const fields = await fetchCategoryFields();
  let videos = await fetchVideos();

  const urlParams = new URLSearchParams(window.location.search);
  const highlightId = urlParams.get('video');

  const refresh = (updatedVideos) => {
    videos = updatedVideos;
    renderTable(videos, fields);
  };

  renderTable(videos, fields, highlightId);

  document.getElementById('importVideosBtn').addEventListener('click', () => {
    document.getElementById('videoInput').click();
  });

  document.getElementById('importCsvBtn').addEventListener('click', () => {
    document.getElementById('csvInput').click();
  });

  document.getElementById('exportCsvBtn').addEventListener('click', async () => {
    const response = await fetch('/api/videos/export');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'videos-export.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = '/login';
  });

  document.getElementById('videoInput').addEventListener('change', async (event) => {
    const files = event.target.files;
    if (!files.length) return;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('videos', file));
    const response = await fetch('/api/videos/import', {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    if (result.success) {
      videos = result.videos;
      renderTable(videos, fields);
      hideImportSummary();
    } else {
      alert(result.message || '视频导入失败');
    }
    event.target.value = '';
  });

  document.getElementById('csvInput').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('csv', file);
    const response = await fetch('/api/videos/import-csv', {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    if (result.success) {
      videos = result.videos;
      renderTable(videos, fields);
      showImportSummary(result);
    } else {
      alert(result.message || 'CSV 导入失败');
      hideImportSummary();
    }
    event.target.value = '';
  });

  bindTableActions(() => videos, fields);
  bindModalControls(fields, refresh);

  document.getElementById('dismissImportSummary').addEventListener('click', hideImportSummary);
  document.getElementById('downloadUnmatchedBtn').addEventListener('click', downloadUnmatchedCsv);
  document.getElementById('downloadDuplicatesBtn').addEventListener('click', downloadDuplicateCsv);

  if (highlightId) {
    const highlightedVideo = videos.find((video) => String(video.id) === highlightId);
    if (highlightedVideo) {
      openModal(
        highlightedVideo,
        fields,
        videos,
        videos.findIndex((item) => String(item.id) === highlightId)
      );
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
}

document.addEventListener('DOMContentLoaded', init);

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
    if (highlightId && video.id === highlightId) {
      row.classList.add('highlight-row');
    }
    tbody.appendChild(row);
  });
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

function renderModalForm() {
  const form = document.getElementById('editForm');
  form.innerHTML = '';
  const { fields } = modalState;
  const currentType = modalState.currentType || categoryFieldsCache.defaultProductType;

  const relevantFields = fields
    .filter((field) => shouldDisplayField(field, currentType))
    .sort((a, b) => getFieldOrder(a, currentType) - getFieldOrder(b, currentType));

  relevantFields.forEach((field) => {
    const label = document.createElement('label');
    label.innerHTML = `<span>${field.label}</span>`;

    const select = document.createElement('select');
    select.name = field.key;
    if (field.type === 'multi') {
      select.multiple = true;
    }

    const options = field.options || [];
    options.forEach((option) => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;
      if (field.type === 'multi') {
        const selectedValues = Array.isArray(modalState.values[field.key]) ? modalState.values[field.key] : [];
        if (selectedValues.includes(option)) {
          optionElement.selected = true;
        }
      } else if ((modalState.values[field.key] ?? '') === option) {
        optionElement.selected = true;
      }
      select.appendChild(optionElement);
    });

    label.appendChild(select);
    form.appendChild(label);

    select.addEventListener('change', () => {
      if (select.multiple) {
        modalState.values[field.key] = Array.from(select.selectedOptions)
          .map((option) => option.value)
          .filter(Boolean);
      } else {
        modalState.values[field.key] = select.value;
        if (field.key === 'productType') {
          modalState.currentType = select.value || categoryFieldsCache.defaultProductType;
          pruneCategoriesForType(modalState.values, modalState.currentType, fields);
          renderModalForm();
        }
      }
    });
  });
}

function openModal(video, fields) {
  const modal = document.getElementById('editModal');
  const form = document.getElementById('editForm');
  modalState.video = video;
  modalState.fields = fields;
  modalState.values = { ...categoryFieldsCache.defaults, ...video.categories };
  modalState.currentType = modalState.values.productType || categoryFieldsCache.defaultProductType;
  pruneCategoriesForType(modalState.values, modalState.currentType, fields);
  renderModalForm();
  form.dataset.id = video.id;
  modal.classList.remove('hidden');
  modal.classList.add('fade-in');
}

function closeModal() {
  const modal = document.getElementById('editModal');
  modal.classList.add('hidden');
  modalState.video = null;
}

function gatherFormData(form) {
  const selects = Array.from(form.querySelectorAll('select'));
  const categories = {};
  selects.forEach((select) => {
    if (select.multiple) {
      categories[select.name] = Array.from(select.selectedOptions)
        .map((option) => option.value)
        .filter(Boolean);
    } else {
      categories[select.name] = select.value;
    }
  });
  return categories;
}

function bindTableActions(getVideos, fields) {
  document.getElementById('videosTableBody').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    const currentVideos = getVideos();
    const video = currentVideos.find((item) => item.id === button.dataset.id);
    if (!video) return;
    openModal(video, fields);
  });
}

function bindModalControls(videos, fields, refresh) {
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelEditBtn').addEventListener('click', closeModal);

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
    } else {
      alert(result.message || 'CSV 导入失败');
    }
    event.target.value = '';
  });

  bindTableActions(() => videos, fields);
  bindModalControls(videos, fields, refresh);

  if (highlightId) {
    const highlightedVideo = videos.find((video) => video.id === highlightId);
    if (highlightedVideo) {
      openModal(highlightedVideo, fields);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
}

document.addEventListener('DOMContentLoaded', init);

const AUTH_KEY = 'hyos-authenticated';
const categoryFieldsCache = {
  fields: [],
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
  return data;
}

async function fetchVideos() {
  const response = await fetch('/api/videos');
  return response.json();
}

function summariseCategories(video, fields) {
  const entries = fields
    .filter((field) => {
      const value = video.categories?.[field.key];
      if (field.type === 'multi') {
        return Array.isArray(value) && value.length;
      }
      return Boolean(value);
    })
    .slice(0, 3)
    .map((field) => {
      const value = video.categories?.[field.key];
      const text = Array.isArray(value) ? value.join(' / ') : value;
      return `${field.label}: ${text}`;
    });
  return entries.join(' · ');
}

function renderTable(videos, fields) {
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
      <td>${video.title || video.originalName}</td>
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
              if (value && value !== '空白') {
                return `<span class="tag">${field.label}: ${value}</span>`;
              }
              return '';
            })
            .join('')}
        </div>
      </td>
      <td><button class="action-btn" data-id="${video.id}">编辑</button></td>
    `;
    tbody.appendChild(row);
  });
}

function openModal(video, fields) {
  const modal = document.getElementById('editModal');
  const form = document.getElementById('editForm');
  modal.classList.remove('hidden');
  modal.classList.add('fade-in');
  form.dataset.id = video.id;

  form.innerHTML = fields
    .map((field) => {
      const value = video.categories?.[field.key] ?? (field.type === 'multi' ? [] : '');
      const optionsHtml = field.options
        .map((option) => {
          if (field.type === 'multi') {
            const selected = Array.isArray(value) && value.includes(option) ? 'selected' : '';
            return `<option value="${option}" ${selected}>${option}</option>`;
          }
          const selected = value === option ? 'selected' : '';
          return `<option value="${option}" ${selected}>${option}</option>`;
        })
        .join('');

      return `
        <label>
          <span>${field.label}</span>
          <select name="${field.key}" ${field.type === 'multi' ? 'multiple' : ''}>${optionsHtml}</select>
        </label>
      `;
    })
    .join('');
}

function closeModal() {
  const modal = document.getElementById('editModal');
  modal.classList.add('hidden');
}

function gatherFormData(form, fields) {
  const categories = {};
  fields.forEach((field) => {
    const select = form.querySelector(`[name="${field.key}"]`);
    if (!select) return;
    if (field.type === 'multi') {
      categories[field.key] = Array.from(select.selectedOptions).map((option) => option.value);
    } else {
      categories[field.key] = select.value;
    }
  });
  return categories;
}

async function init() {
  guardAuth();
  const fields = await fetchCategoryFields();
  let videos = await fetchVideos();
  renderTable(videos, fields);

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

  document.getElementById('videosTableBody').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    const video = videos.find((item) => item.id === button.dataset.id);
    if (!video) return;
    openModal(video, fields);
  });

  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelEditBtn').addEventListener('click', closeModal);

  document.getElementById('editForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const id = form.dataset.id;
    const categories = gatherFormData(form, fields);

    const response = await fetch(`/api/videos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categories }),
    });
    const result = await response.json();
    if (result.success) {
      videos = result.videos;
      renderTable(videos, fields);
      closeModal();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);

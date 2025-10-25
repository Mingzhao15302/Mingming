const LOGIN_STATE_KEY = 'huiyun_login_state';
const videoTable = document.getElementById('videoTable');
const videoTotal = document.getElementById('videoTotal');
const videoUploader = document.getElementById('videoUploader');
const csvUploader = document.getElementById('csvUploader');
const exportCsvBtn = document.getElementById('exportCsv');
const logoutBtn = document.getElementById('logoutBtn');
const editModal = document.getElementById('editModal');
const closeModalBtn = document.getElementById('closeModal');
const cancelEditBtn = document.getElementById('cancelEdit');
const editForm = document.getElementById('editForm');
const editCategory = document.getElementById('editCategory');
const editModule = document.getElementById('editModule');
const editBucket = document.getElementById('editBucket');
const editTags = document.getElementById('editTags');

let currentVideoId = null;
let videoData = [];

function ensureLogin() {
  const loggedIn = localStorage.getItem(LOGIN_STATE_KEY);
  if (loggedIn !== 'true' && loggedIn !== '"true"') {
    window.location.href = 'login.html';
  }
}

function openModal(video) {
  currentVideoId = video.id;
  editCategory.value = video.category || '';
  editModule.value = video.module || '';
  editBucket.value = video.bucket || '';
  editTags.value = Array.isArray(video.tags) ? video.tags.join(', ') : video.tags || '';
  editModal.classList.remove('hidden');
}

function closeModal() {
  currentVideoId = null;
  editForm.reset();
  editModal.classList.add('hidden');
}

function createRow(video) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td title="${video.originalName}">${video.originalName}</td>
    <td>${video.category || '<span class="placeholder">未分类</span>'}</td>
    <td>${video.module || '<span class="placeholder">未定义</span>'}</td>
    <td>${video.bucket || '<span class="placeholder">未设置</span>'}</td>
    <td>${Array.isArray(video.tags) && video.tags.length ? video.tags.map((tag) => `<span class=\"tag\">${tag}</span>`).join(' ') : '<span class="placeholder">暂无标签</span>'}</td>
    <td>
      <div class="table-actions">
        <button data-action="edit" data-id="${video.id}">编辑</button>
        <a class="preview-link" href="${video.url}" target="_blank" rel="noopener">预览</a>
      </div>
    </td>
  `;
  return tr;
}

function renderTable() {
  videoTable.innerHTML = '';
  videoData.forEach((video) => {
    videoTable.appendChild(createRow(video));
  });
  videoTotal.textContent = videoData.length;
}

async function fetchVideos() {
  const response = await fetch('/api/videos');
  const data = await response.json();
  videoData = Array.isArray(data.videos) ? data.videos : [];
  renderTable();
}

async function uploadVideos(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('videos', file);
  }
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: '上传失败' }));
    throw new Error(data.message || '上传失败');
  }
  await fetchVideos();
}

async function importCsv(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('/api/import-csv', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: '导入失败' }));
    throw new Error(data.message || '导入失败');
  }
  await fetchVideos();
}

async function exportCsv() {
  const response = await fetch('/api/export-csv');
  if (!response.ok) {
    throw new Error('导出失败');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'videos.csv';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function saveVideoEdits(id, payload) {
  const response = await fetch(`/api/videos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: '保存失败' }));
    throw new Error(data.message || '保存失败');
  }
  return response.json();
}

function bindEvents() {
  videoTable.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action="edit"]');
    if (!button) return;
    const id = button.dataset.id;
    const video = videoData.find((item) => item.id === id);
    if (video) {
      openModal(video);
    }
  });

  videoUploader.addEventListener('change', async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    try {
      await uploadVideos(files);
    } catch (error) {
      alert(error.message || '上传失败');
    } finally {
      event.target.value = '';
    }
  });

  csvUploader.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await importCsv(file);
    } catch (error) {
      alert(error.message || '导入失败');
    } finally {
      event.target.value = '';
    }
  });

  exportCsvBtn.addEventListener('click', async () => {
    try {
      await exportCsv();
    } catch (error) {
      alert(error.message || '导出失败');
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(LOGIN_STATE_KEY);
    window.location.href = 'login.html';
  });

  closeModalBtn.addEventListener('click', closeModal);
  cancelEditBtn.addEventListener('click', closeModal);

  editForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentVideoId) return;
    try {
      await saveVideoEdits(currentVideoId, {
        category: editCategory.value.trim(),
        module: editModule.value.trim(),
        bucket: editBucket.value.trim(),
        tags: editTags.value
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      await fetchVideos();
      closeModal();
    } catch (error) {
      alert(error.message || '保存失败');
    }
  });

  editModal.addEventListener('click', (event) => {
    if (event.target === editModal) {
      closeModal();
    }
  });
}

async function init() {
  ensureLogin();
  bindEvents();
  await fetchVideos();
}

document.addEventListener('DOMContentLoaded', init);

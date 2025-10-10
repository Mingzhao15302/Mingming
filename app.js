const classificationOptions = {
  modelSeries: ['30A', '30B', '30BG-', '30G', '30GY', 'ZSQ', 'HX200', '2T'],
  fillWeight: ['0.5~5kg', '10~20kg', '50~200kg', '1000kg'],
  cappingMethod: ['5L平板压盖', '20L平板压盖', '花篮压盖', '辊压', '助力臂拧盖'],
  conveyingMethod: ['滚筒', '板链'],
  bufferMethod: ['不锈钢面板', '无动力滚筒', '无动力滚筒延长架'],
  vocRequirement: ['有', '无'],
  explosionProof: ['防爆', '不防爆']
};

const classificationLabels = {
  modelSeries: '型号系列',
  fillWeight: '灌装重量',
  cappingMethod: '压盖方式',
  conveyingMethod: '输送方式',
  bufferMethod: '缓存方式',
  vocRequirement: 'VOC要求',
  explosionProof: '防爆要求'
};

const navButtons = document.querySelectorAll('.nav-btn');
const panels = document.querySelectorAll('.panel');
const fileInput = document.getElementById('video-input');
const dropzone = document.getElementById('upload-dropzone');
const tableBody = document.getElementById('video-table');
const emptyState = document.getElementById('empty-state');
const exportBtn = document.getElementById('export-btn');
const filterForm = document.getElementById('filter-form');
const previewList = document.getElementById('preview-list');
const previewCount = document.getElementById('preview-count');
const chartToggleButtons = document.querySelectorAll('.toggle-btn');
const chartUnavailableMessage = document.getElementById('chart-unavailable');
const editDialog = document.getElementById('edit-dialog');
const previewDialog = document.getElementById('preview-dialog');
const editForm = document.getElementById('edit-form');
const videoRowTemplate = document.getElementById('video-row-template');
const previewCardTemplate = document.getElementById('preview-card-template');

const videos = [];
let currentEditId = null;
let distributionChart = null;
let activeChartType = 'radar';

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : `vid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function populateSelectOptions() {
  Object.entries(classificationOptions).forEach(([key, values]) => {
    const filterSelect = filterForm.elements.namedItem(key);
    const modalSelect = editForm.elements.namedItem(key);

    if (filterSelect) {
      values.forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        filterSelect.append(option);
      });
    }

    if (modalSelect && modalSelect.children.length === 0) {
      const blankOption = document.createElement('option');
      blankOption.value = '';
      blankOption.textContent = '未设置';
      modalSelect.append(blankOption);
    }

    if (modalSelect) {
      values.forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        modalSelect.append(option);
      });
    }
  });
}

function switchPanel(targetId) {
  panels.forEach((panel) => {
    panel.classList.toggle('is-active', panel.id === targetId);
  });
}

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    navButtons.forEach((btn) => btn.classList.remove('is-active'));
    button.classList.add('is-active');
    switchPanel(button.dataset.target);
  });
});

function handleFiles(fileList) {
  const files = Array.from(fileList).filter((file) => file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4'));

  files.forEach((file) => {
    const id = generateId();
    const objectUrl = URL.createObjectURL(file);

    const videoData = {
      id,
      file,
      url: objectUrl,
      fileName: file.name,
      customerName: '',
      materialInfo: '',
      modelSeries: '',
      fillWeight: '',
      cappingMethod: '',
      conveyingMethod: '',
      bufferMethod: '',
      vocRequirement: '',
      explosionProof: '',
      createdAt: new Date()
    };

    videos.push(videoData);
  });

  renderTable();
  updateDashboard();
  updateEmptyState();
}

fileInput.addEventListener('change', (event) => {
  handleFiles(event.target.files);
  fileInput.value = '';
});

dropzone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropzone.classList.add('is-dragover');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('is-dragover');
});

dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('is-dragover');
  handleFiles(event.dataTransfer.files);
});

dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});

function updateEmptyState() {
  const hasVideos = videos.length > 0;
  emptyState.style.display = hasVideos ? 'none' : 'block';
}

function formatClassification(video) {
  const segments = [];
  Object.keys(classificationOptions).forEach((key) => {
    if (video[key]) {
      segments.push(`${classificationLabels[key]}：${video[key]}`);
    }
  });
  return segments.length > 0 ? segments.join(' / ') : '未设置';
}

function renderTable() {
  tableBody.innerHTML = '';

  videos.forEach((video) => {
    const row = videoRowTemplate.content.firstElementChild.cloneNode(true);
    row.querySelector('[data-field="fileName"]').textContent = video.fileName;
    row.querySelector('[data-field="customerName"]').textContent = video.customerName || '—';
    row.querySelector('[data-field="materialInfo"]').textContent = video.materialInfo || '—';
    row.querySelector('[data-field="classification"]').textContent = formatClassification(video);

    row.querySelector('[data-action="edit"]').addEventListener('click', () => openEditDialog(video.id));
    row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteVideo(video.id));
    row.querySelector('[data-action="preview"]').addEventListener('click', () => openPreviewDialog(video.id));

    tableBody.append(row);
  });
}

function findVideoById(id) {
  return videos.find((video) => video.id === id);
}

function openEditDialog(id) {
  const video = findVideoById(id);
  if (!video) return;

  currentEditId = id;
  editForm.elements.fileName.value = video.fileName;
  editForm.elements.customerName.value = video.customerName;
  editForm.elements.materialInfo.value = video.materialInfo;

  Object.keys(classificationOptions).forEach((key) => {
    if (editForm.elements[key]) {
      editForm.elements[key].value = video[key] || '';
    }
  });

  editDialog.showModal();
}

editForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!currentEditId) return;

  const formData = new FormData(editForm);
  const video = findVideoById(currentEditId);
  if (!video) return;

  video.fileName = formData.get('fileName') || video.fileName;
  video.customerName = formData.get('customerName') || '';
  video.materialInfo = formData.get('materialInfo') || '';

  Object.keys(classificationOptions).forEach((key) => {
    video[key] = formData.get(key) || '';
  });

  renderTable();
  updateDashboard();
  editDialog.close();
});

editForm.querySelector('[data-action="cancel"]').addEventListener('click', () => {
  editDialog.close();
});

editDialog.addEventListener('close', () => {
  editForm.reset();
  currentEditId = null;
});

function deleteVideo(id) {
  const index = videos.findIndex((video) => video.id === id);
  if (index === -1) return;

  const [removed] = videos.splice(index, 1);
  if (removed && removed.url) {
    URL.revokeObjectURL(removed.url);
  }

  renderTable();
  updateDashboard();
  updateEmptyState();
}

function openPreviewDialog(id) {
  const video = findVideoById(id);
  if (!video) return;

  const videoElement = previewDialog.querySelector('video');
  videoElement.src = video.url;
  videoElement.currentTime = 0;
  previewDialog.showModal();
}

if (previewDialog) {
  previewDialog.querySelector('[data-preview-close]').addEventListener('click', () => {
    previewDialog.close();
  });

  previewDialog.addEventListener('close', () => {
    const videoElement = previewDialog.querySelector('video');
    videoElement.pause();
    videoElement.removeAttribute('src');
  });
}

function exportCSV() {
  if (videos.length === 0) {
    alert('暂无视频可导出');
    return;
  }

  const headers = [
    '文件名',
    '客户名称',
    '物料信息',
    '型号系列',
    '灌装重量',
    '压盖方式',
    '输送方式',
    '缓存方式',
    'VOC要求',
    '防爆要求'
  ];

  const rows = videos.map((video) => [
    video.fileName,
    video.customerName,
    video.materialInfo,
    video.modelSeries,
    video.fillWeight,
    video.cappingMethod,
    video.conveyingMethod,
    video.bufferMethod,
    video.vocRequirement,
    video.explosionProof
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `视频信息-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

exportBtn.addEventListener('click', exportCSV);

function collectFilters() {
  const formData = new FormData(filterForm);
  return Object.fromEntries(formData.entries());
}

function applyFilters() {
  const filters = collectFilters();
  return videos.filter((video) =>
    Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      return video[key] === value;
    })
  );
}

function renderPreview(filtered) {
  previewList.innerHTML = '';
  previewCount.textContent = filtered.length;

  filtered.forEach((video) => {
    const card = previewCardTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector('[data-field="title"]').textContent = video.fileName;
    card.querySelector('[data-field="meta"]').textContent = formatClassification(video);
    const videoElement = card.querySelector('video');
    videoElement.src = video.url;
    previewList.append(card);
  });

  if (filtered.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = '暂无符合条件的视频';
    emptyMessage.className = 'empty-state';
    previewList.append(emptyMessage);
  }
}

function buildChartData(filtered) {
  const labels = [];
  const data = [];

  Object.entries(classificationOptions).forEach(([key, values]) => {
    values.forEach((value) => {
      const count = filtered.filter((video) => video[key] === value).length;
      if (count > 0) {
        labels.push(`${classificationLabels[key]}-${value}`);
        data.push(count);
      }
    });
  });

  if (labels.length === 0) {
    labels.push('暂无数据');
    data.push(0);
  }

  return { labels, data };
}

function createChartConfig(type, labels, data) {
  return {
    type,
    data: {
      labels,
      datasets: [
        {
          label: '视频数量',
          data,
          backgroundColor: type === 'radar' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.65)',
          borderColor: 'rgba(37, 99, 235, 0.8)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(37, 99, 235, 0.8)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: type === 'bar'
        ? {
            x: {
              ticks: { color: '#334155' },
              grid: { color: 'rgba(226, 232, 240, 0.6)' }
            },
            y: {
              beginAtZero: true,
              ticks: { color: '#334155', precision: 0 },
              grid: { color: 'rgba(226, 232, 240, 0.6)' }
            }
          }
        : {},
      plugins: {
        legend: {
          display: type !== 'bar',
          labels: {
            color: '#334155'
          }
        }
      }
    }
  };
}

function updateChart(filtered) {
  if (typeof Chart === 'undefined') {
    if (chartUnavailableMessage) {
      chartUnavailableMessage.hidden = false;
    }

    if (distributionChart) {
      distributionChart.destroy();
      distributionChart = null;
    }

    return;
  }

  if (chartUnavailableMessage) {
    chartUnavailableMessage.hidden = true;
  }

  const { labels, data } = buildChartData(filtered);
  const ctx = document.getElementById('distribution-chart').getContext('2d');
  const config = createChartConfig(activeChartType, labels, data);

  if (distributionChart && distributionChart.config.type !== activeChartType) {
    distributionChart.destroy();
    distributionChart = null;
  }

  if (distributionChart) {
    distributionChart.data.labels = labels;
    distributionChart.data.datasets[0].data = data;
    distributionChart.data.datasets[0].backgroundColor =
      activeChartType === 'radar' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.65)';
    distributionChart.options = config.options;
    distributionChart.update();
  } else {
    distributionChart = new Chart(ctx, config);
  }
}

function updateDashboard() {
  const filtered = applyFilters();
  renderPreview(filtered);
  updateChart(filtered);
}

filterForm.addEventListener('change', updateDashboard);

chartToggleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    chartToggleButtons.forEach((btn) => btn.classList.remove('is-active'));
    button.classList.add('is-active');
    activeChartType = button.dataset.chart === 'bar' ? 'bar' : 'radar';
    updateDashboard();
  });
});

window.addEventListener('beforeunload', () => {
  videos.forEach((video) => {
    if (video.url) {
      URL.revokeObjectURL(video.url);
    }
  });
});

populateSelectOptions();
updateEmptyState();
updateDashboard();

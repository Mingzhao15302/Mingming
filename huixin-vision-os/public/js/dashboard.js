const LOGIN_KEY = 'hxos-authenticated';
const MULTI_VALUE_FIELDS = ['weighingMethod', 'labelingMethod', 'palletMethod', 'boxingMethod', 'otherFunctions'];

const FIELD_DEFINITIONS = {
  productType: {
    label: '产品类型',
    options: ['', '灌装机', '自动线', '码垛机']
  },
  autoFillingMachine: {
    label: '自动灌装机',
    options: ['', '30A', '30B/BG', '30G/GY', 'ZSQ', 'HX200', '2T']
  },
  autoFillingLine: {
    label: '自动灌装线',
    options: [
      '',
      '1~5L方桶灌装自动线',
      '1~5L圆桶灌装自动线',
      '15~25L铁桶灌装自动线',
      '15~25L塑料桶灌装自动线',
      '15~25L偏心口桶灌装自动线',
      '50~200L桶灌装自动线',
      'IBC桶灌装自动线',
      '袋式灌装机'
    ]
  },
  capType: {
    label: '桶盖',
    options: ['', '塑料盖', '花篮盖', '小口桶盖', '圆形铁盖', '内外盖', '偏心口桶盖']
  },
  capacity: {
    label: '容量',
    options: ['', '0.5~5L', '15~25L', '50L', '200L', '1000L']
  },
  feedingMethod: {
    label: '来料方式',
    options: ['', '直接供料', '泵送', '过滤', '螺杆增压', '压料机', '拉缸', '角座阀', '手阀控制']
  },
  explosionProof: {
    label: '防爆要求',
    options: ['', '防爆', '不防爆']
  },
  fillingMethod: {
    label: '灌装方式',
    options: ['', '单头', '双头', '三头', '四头', '五头', '六头', '八头']
  },
  cappingMethod: {
    label: '压盖方式',
    options: [
      '',
      '5L平板压',
      '20L平板压',
      '花篮压盖',
      '自动辊压',
      '自动拧盖',
      '助力拧盖',
      '自动封盖',
      '自动捶盖',
      '自动封袋',
      '人工压盖',
      '空白'
    ]
  },
  conveyorMethod: {
    label: '输送方式',
    options: ['', '滚筒', '板链', '步进', '空白']
  },
  bufferMethod: {
    label: '缓存方式',
    options: ['', '不锈钢面板', '无动力滚筒', '无动力滚筒延长架', '重托盘缓存输送', '空白']
  },
  vocRequirement: {
    label: 'VOC要求',
    options: ['', '一体式集气', '灌装阀集气', '空白']
  },
  barrelSeparation: {
    label: '分桶方式',
    options: ['', '卧式分桶', '立式分桶', '抽底式分桶', '理桶平台', '自动卸桶', '人工上空桶', '空白']
  },
  weighingMethod: {
    label: '检重方式',
    options: ['', '动态检重', '静态检重', '检重剔除', '空白']
  },
  capSorting: {
    label: '理盖方式',
    options: ['', '自动补盖', '转盘式理盖', '振动盘理盖', '空白']
  },
  capPlacing: {
    label: '放盖方式',
    options: ['', '单吸盘', '双吸盘', '自动落盖', '自动追踪放盖', '人工放盖', '空白']
  },
  labelingMethod: {
    label: '贴标方式',
    options: ['', '空桶贴标', '重桶贴标', '顶部贴标', '在线打印贴标', '空白']
  },
  palletizingMethod: {
    label: '码垛方式',
    options: ['', '机器人码垛', '悬臂式码垛', '龙门式码垛', '空白']
  },
  palletMethod: {
    label: '托盘方式',
    options: ['', '托盘库', '托盘分离', '空托盘换线输送', '重托盘换线输送', '空白']
  },
  boxingMethod: {
    label: '装箱方式',
    options: ['', '自动开箱', '自动装箱', '自动封箱', '自动码箱', '空白']
  },
  otherFunctions: {
    label: '其他功能',
    options: ['', '自动充氮', '自动套内袋', '皮带输盖', '自动喷码', '自动缠绕', '自动捆扎', '180°翻桶', '空白']
  }
};

if (localStorage.getItem(LOGIN_KEY) !== 'true') {
  window.location.href = 'login.html';
}

const videoTableBody = document.getElementById('videoTableBody');
const emptyMessage = document.getElementById('emptyMessage');
const uploadTrigger = document.getElementById('uploadTrigger');
const videoInput = document.getElementById('videoInput');
const csvImportTrigger = document.getElementById('csvImportTrigger');
const csvInput = document.getElementById('csvInput');
const csvExportBtn = document.getElementById('csvExport');
const logoutBtn = document.getElementById('logout');

const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const modalClose = document.getElementById('modalClose');
const cancelEdit = document.getElementById('cancelEdit');
const saveEdit = document.getElementById('saveEdit');

let videos = [];
let editingVideoId = null;

function openModal(video) {
  editingVideoId = video.id;
  editForm.innerHTML = '';

  Object.entries(FIELD_DEFINITIONS).forEach(([field, config]) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-item';

    const label = document.createElement('label');
    label.textContent = config.label;
    label.htmlFor = `field-${field}`;

    let input;
    if (MULTI_VALUE_FIELDS.includes(field)) {
      input = document.createElement('select');
      input.multiple = true;
      input.size = Math.min(config.options.length, 6);
    } else {
      input = document.createElement('select');
    }
    input.id = `field-${field}`;

    config.options.forEach((optionValue) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue === '' ? '未选择' : optionValue;
      input.appendChild(option);
    });

    const existingValue = video.metadata?.[field] || '';
    if (MULTI_VALUE_FIELDS.includes(field)) {
      const values = Array.isArray(existingValue)
        ? existingValue
        : existingValue
            .split(/[，,;；\s]+/)
            .map((v) => v.trim())
            .filter(Boolean);
      Array.from(input.options).forEach((opt) => {
        opt.selected = values.includes(opt.value);
      });
    } else {
      input.value = existingValue;
    }

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    editForm.appendChild(wrapper);
  });

  editModal.classList.remove('hidden');
  editModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  editModal.classList.add('hidden');
  editModal.setAttribute('aria-hidden', 'true');
  editingVideoId = null;
}

async function fetchVideos() {
  try {
    const response = await fetch('/api/videos');
    videos = await response.json();
    renderTable();
  } catch (error) {
    console.error('加载视频失败', error);
  }
}

function renderTable() {
  videoTableBody.innerHTML = '';
  if (!videos.length) {
    emptyMessage.style.display = 'block';
    return;
  }
  emptyMessage.style.display = 'none';

  videos.forEach((video) => {
    const tr = document.createElement('tr');

    const previewTd = document.createElement('td');
    const previewWrapper = document.createElement('div');
    previewWrapper.className = 'preview-video';
    const videoEl = document.createElement('video');
    videoEl.src = video.path;
    videoEl.controls = true;
    previewWrapper.appendChild(videoEl);
    previewTd.appendChild(previewWrapper);

    const nameTd = document.createElement('td');
    nameTd.textContent = video.originalName || video.filename;

    const productTd = document.createElement('td');
    productTd.textContent = video.metadata?.productType || '—';

    const machineTd = document.createElement('td');
    machineTd.textContent = video.metadata?.autoFillingMachine || '—';

    const lineTd = document.createElement('td');
    lineTd.textContent = video.metadata?.autoFillingLine || '—';

    const capTd = document.createElement('td');
    capTd.textContent = video.metadata?.capType || '—';

    const capacityTd = document.createElement('td');
    capacityTd.textContent = video.metadata?.capacity || '—';

    const actionTd = document.createElement('td');
    actionTd.className = 'table-actions';
    const editButton = document.createElement('button');
    editButton.textContent = '编辑分类';
    editButton.className = 'secondary-btn';
    editButton.addEventListener('click', () => openModal(video));
    actionTd.appendChild(editButton);

    tr.append(previewTd, nameTd, productTd, machineTd, lineTd, capTd, capacityTd, actionTd);
    videoTableBody.appendChild(tr);
  });
}

uploadTrigger.addEventListener('click', () => videoInput.click());
videoInput.addEventListener('change', async () => {
  if (!videoInput.files.length) return;
  const formData = new FormData();
  Array.from(videoInput.files).forEach((file) => formData.append('videos', file));

  try {
    const response = await fetch('/api/videos/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('上传失败');
    }

    const result = await response.json();
    videos = videos.concat(result.videos);
    renderTable();
    videoInput.value = '';
  } catch (error) {
    alert('上传视频时出现问题，请重试');
    console.error(error);
  }
});

csvImportTrigger.addEventListener('click', () => csvInput.click());
csvInput.addEventListener('change', async () => {
  if (!csvInput.files.length) return;
  const formData = new FormData();
  formData.append('file', csvInput.files[0]);

  try {
    const response = await fetch('/api/videos/import-csv', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('导入失败');
    }

    await fetchVideos();
    alert('CSV 导入完成');
  } catch (error) {
    alert('导入 CSV 时出现问题');
    console.error(error);
  } finally {
    csvInput.value = '';
  }
});

csvExportBtn.addEventListener('click', async () => {
  try {
    const response = await fetch('/api/videos/export-csv');
    if (!response.ok) {
      throw new Error('导出失败');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'videos.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert('导出 CSV 时出现问题');
    console.error(error);
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(LOGIN_KEY);
  localStorage.removeItem('hxos-username');
  window.location.href = 'login.html';
});

modalClose.addEventListener('click', closeModal);
cancelEdit.addEventListener('click', closeModal);

saveEdit.addEventListener('click', async () => {
  if (!editingVideoId) return;
  const payload = {};

  Object.keys(FIELD_DEFINITIONS).forEach((field) => {
    const input = document.getElementById(`field-${field}`);
    if (!input) return;
    if (MULTI_VALUE_FIELDS.includes(field)) {
      const selected = Array.from(input.selectedOptions)
        .map((option) => option.value)
        .filter(Boolean);
      payload[field] = selected.join('、');
    } else {
      payload[field] = input.value;
    }
  });

  try {
    const response = await fetch(`/api/videos/${editingVideoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('更新失败');
    }

    const result = await response.json();
    videos = videos.map((video) => (video.id === editingVideoId ? result.video : video));
    renderTable();
    closeModal();
    alert('分类信息已更新');
  } catch (error) {
    alert('保存信息时出现问题');
    console.error(error);
  }
});

editModal.addEventListener('click', (event) => {
  if (event.target === editModal) {
    closeModal();
  }
});

fetchVideos();

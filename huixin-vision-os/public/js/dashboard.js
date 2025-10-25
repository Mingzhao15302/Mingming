// 控制台脚本：处理上传、CSV 导入导出和分类编辑
const auth = localStorage.getItem('huixin-auth');
if (auth !== 'active') {
  window.location.href = '/login';
}

const categoryOptions = {
  productType: ['灌装机', '自动线', '码垛机'],
  fillingMachine: ['30A', '30B/BG', '30G/GY', 'ZSQ', 'HX200', '2T'],
  fillingLine: ['1~5L方桶灌装自动线', '1~5L圆桶灌装自动线', '15~25L铁桶灌装自动线', '15~25L塑料桶灌装自动线', '15~25L偏心口桶灌装自动线', '50~200L桶灌装自动线', 'IBC桶灌装自动线', '袋式灌装机'],
  capType: ['塑料盖', '花篮盖', '小口桶盖', '圆形铁盖', '内外盖', '偏心口桶盖'],
  capacity: ['0.5~5L', '15~25L', '50L', '200L', '1000L'],
  materialIn: ['直接供料', '泵送', '过滤', '螺杆增压', '压料机', '拉缸', '角座阀', '手阀控制'],
  explosionProof: ['防爆', '不防爆'],
  fillingHeads: ['单头', '双头', '三头', '四头', '五头', '六头', '八头'],
  capping: ['5L平板压', '20L平板压', '花篮压盖', '自动辊压', '自动拧盖', '助力拧盖', '自动封盖', '自动捶盖', '自动封袋', '人工压盖', '空白'],
  conveyor: ['滚筒', '板链', '步进', '空白'],
  buffer: ['不锈钢面板', '无动力滚筒', '无动力滚筒延长架', '重托盘缓存输送', '空白'],
  voc: ['一体式集气', '灌装阀集气', '空白'],
  bucketSeparation: ['卧式分桶', '立式分桶', '抽底式分桶', '理桶平台', '自动卸桶', '人工上空桶', '空白'],
  weighing: ['动态检重', '静态检重', '检重剔除', '空白'],
  capArrangement: ['自动补盖', '转盘式理盖', '振动盘理盖', '空白'],
  capPlacement: ['单吸盘', '双吸盘', '自动落盖', '自动追踪放盖', '人工放盖', '空白'],
  labeling: ['空桶贴标', '重桶贴标', '顶部贴标', '在线打印贴标', '空白'],
  palletizing: ['机器人码垛', '悬臂式码垛', '龙门式码垛', '空白'],
  palletHandling: ['托盘库', '托盘分离', '空托盘换线输送', '重托盘换线输送', '空白'],
  boxing: ['自动开箱', '自动装箱', '自动封箱', '自动码箱', '空白'],
  extraFeatures: ['自动充氮', '自动套内袋', '皮带输盖', '自动喷码', '自动缠绕', '自动捆扎', '180°翻桶', '空白']
};

const multiValueKeys = new Set(['weighing', 'labeling', 'palletHandling', 'boxing', 'extraFeatures']);

const tableBody = document.getElementById('videoTableBody');
const videoUploader = document.getElementById('videoUploader');
const csvUploader = document.getElementById('csvUploader');
const exportBtn = document.getElementById('exportCsvBtn');
const modal = document.getElementById('editorModal');
const closeModalBtn = document.getElementById('closeModal');
const cancelEditBtn = document.getElementById('cancelEdit');
const saveBtn = document.getElementById('saveEdit');
const editForm = document.getElementById('editForm');
const toast = document.getElementById('toast');
const logoutBtn = document.getElementById('logoutBtn');

let videos = [];
let currentVideo = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 2600);
}

function formatCategoryValue(value) {
  if (!value) return '';
  if (Array.isArray(value)) return value.filter(Boolean).join('、');
  return value;
}

function renderTable() {
  tableBody.innerHTML = '';
  if (videos.length === 0) {
    const emptyRow = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.textContent = '暂未上传视频，请先导入文件或 CSV 数据';
    emptyRow.appendChild(cell);
    tableBody.appendChild(emptyRow);
    return;
  }

  videos.forEach((video) => {
    const row = document.createElement('tr');

    const thumbCell = document.createElement('td');
    const thumb = document.createElement('video');
    thumb.src = video.path;
    thumb.className = 'thumb';
    thumb.muted = true;
    thumb.preload = 'metadata';
    thumbCell.appendChild(thumb);

    const fileCell = document.createElement('td');
    fileCell.textContent = video.fileName;

    const displayCell = document.createElement('td');
    displayCell.textContent = video.displayName || '';

    const productCell = document.createElement('td');
    productCell.textContent = video.categories?.productType || '';

    const categoryCell = document.createElement('td');
    const tagList = document.createElement('div');
    tagList.className = 'tag-list';
    const summaryFields = ['fillingMachine', 'fillingLine', 'labeling', 'extraFeatures'];
    summaryFields.forEach((key) => {
      const value = video.categories?.[key];
      const formatted = formatCategoryValue(value);
      if (formatted) {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = formatted;
        tagList.appendChild(tag);
      }
    });
    if (!tagList.childElementCount) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = '暂无分类';
      tagList.appendChild(tag);
    }
    categoryCell.appendChild(tagList);

    const actionCell = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.textContent = '编辑分类';
    editBtn.className = 'secondary-btn';
    editBtn.addEventListener('click', () => openEditor(video));
    actionCell.appendChild(editBtn);

    row.appendChild(thumbCell);
    row.appendChild(fileCell);
    row.appendChild(displayCell);
    row.appendChild(productCell);
    row.appendChild(categoryCell);
    row.appendChild(actionCell);
    tableBody.appendChild(row);
  });
}

function createField(key, value) {
  const field = document.createElement('div');
  field.className = 'field';

  const label = document.createElement('label');
  label.textContent = key === 'displayName' ? '展示名称' : categoryLabels[key];

  if (key === 'displayName') {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'displayName';
    input.value = value || '';
    field.appendChild(label);
    field.appendChild(input);
    return field;
  }

  field.appendChild(label);

  if (multiValueKeys.has(key)) {
    const chipGroup = document.createElement('div');
    chipGroup.className = 'chip-group';
    (categoryOptions[key] || []).forEach((option, index) => {
      const chipLabel = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = option;
      checkbox.name = `${key}-${index}`;
      checkbox.checked = Array.isArray(value) && value.includes(option);

      const span = document.createElement('span');
      span.textContent = option;

      chipLabel.appendChild(checkbox);
      chipLabel.appendChild(span);
      chipGroup.appendChild(chipLabel);
    });
    field.appendChild(chipGroup);
  } else {
    const select = document.createElement('select');
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '未选择';
    select.appendChild(empty);

    (categoryOptions[key] || []).forEach((option) => {
      const opt = document.createElement('option');
      opt.value = option;
      opt.textContent = option;
      if (value === option) opt.selected = true;
      select.appendChild(opt);
    });
    select.name = key;
    field.appendChild(select);
  }

  return field;
}

const categoryLabels = {
  displayName: '展示名称',
  productType: '产品类型',
  fillingMachine: '自动灌装机',
  fillingLine: '自动灌装线',
  capType: '桶盖',
  capacity: '容量',
  materialIn: '来料方式',
  explosionProof: '防爆要求',
  fillingHeads: '灌装方式',
  capping: '压盖方式',
  conveyor: '输送方式',
  buffer: '缓存方式',
  voc: 'VOC要求',
  bucketSeparation: '分桶方式',
  weighing: '检重方式',
  capArrangement: '理盖方式',
  capPlacement: '放盖方式',
  labeling: '贴标方式',
  palletizing: '码垛方式',
  palletHandling: '托盘方式',
  boxing: '装箱方式',
  extraFeatures: '其他功能'
};

const editOrder = ['displayName', ...Object.keys(categoryOptions)];

function openEditor(video) {
  currentVideo = video;
  modal.classList.remove('hidden');
  editForm.innerHTML = '';

  editOrder.forEach((key) => {
    const value = key === 'displayName' ? video.displayName : video.categories?.[key];
    editForm.appendChild(createField(key, value));
  });
}

function closeModal() {
  modal.classList.add('hidden');
  currentVideo = null;
}

function collectFormData() {
  const categories = {};
  let displayName = '';

  editOrder.forEach((key) => {
    if (key === 'displayName') {
      const input = editForm.querySelector('input[name="displayName"]');
      displayName = input?.value.trim() || '';
    } else if (multiValueKeys.has(key)) {
      const values = Array.from(editForm.querySelectorAll(`.chip-group input[name^="${key}-"]:checked`)).map((input) => input.value);
      categories[key] = values;
    } else {
      const select = editForm.querySelector(`select[name="${key}"]`);
      categories[key] = select ? select.value : '';
    }
  });

  return { categories, displayName };
}

async function saveChanges() {
  if (!currentVideo) return;
  const payload = collectFormData();

  try {
    const response = await fetch(`/api/videos/${currentVideo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('保存失败');
    }

    const updated = await response.json();
    videos = videos.map((video) => (video.id === updated.id ? updated : video));
    renderTable();
    showToast('分类信息已保存');
    closeModal();
  } catch (error) {
    console.error(error);
    showToast('保存失败，请重试');
  }
}

async function fetchVideos() {
  try {
    const response = await fetch('/api/videos');
    videos = await response.json();
    renderTable();
  } catch (error) {
    console.error('加载视频列表失败', error);
    showToast('加载视频数据失败');
  }
}

async function uploadVideos(files) {
  if (!files.length) return;
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append('videos', file));

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('上传失败');

    await fetchVideos();
    showToast('视频上传成功');
  } catch (error) {
    console.error(error);
    showToast('视频上传失败，请检查网络');
  }
}

async function importCsv(file) {
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/import-csv', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || '导入失败');

    await fetchVideos();
    showToast(result.message || 'CSV 导入成功');
  } catch (error) {
    console.error(error);
    showToast(error.message || 'CSV 导入失败');
  }
}

async function exportCsv() {
  try {
    const response = await fetch('/api/export-csv');
    if (!response.ok) throw new Error('导出失败');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'videos.csv';
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
    showToast('导出失败');
  }
}

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('huixin-auth');
  window.location.href = '/login';
});

videoUploader.addEventListener('change', (event) => {
  uploadVideos(event.target.files);
  event.target.value = '';
});

csvUploader.addEventListener('change', (event) => {
  importCsv(event.target.files[0]);
  event.target.value = '';
});

exportBtn.addEventListener('click', exportCsv);
closeModalBtn.addEventListener('click', closeModal);
cancelEditBtn.addEventListener('click', (event) => {
  event.preventDefault();
  closeModal();
});
saveBtn.addEventListener('click', (event) => {
  event.preventDefault();
  saveChanges();
});

modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

fetchVideos();

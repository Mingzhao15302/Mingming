// 主页面脚本：负责筛选栏与视频预览交互
const filterConfig = [
  { key: 'productType', label: '产品类型', options: ['灌装机', '自动线', '码垛机'] },
  { key: 'capType', label: '桶盖', options: ['塑料盖', '花篮盖', '小口桶盖', '圆形铁盖', '内外盖', '偏心口桶盖'] },
  { key: 'capacity', label: '容量', options: ['0.5~5L', '15~25L', '50L', '200L', '1000L'] },
  { key: 'materialIn', label: '来料方式', options: ['直接供料', '泵送', '过滤', '螺杆增压', '压料机', '拉缸', '角座阀', '手阀控制'] },
  { key: 'explosionProof', label: '防爆要求', options: ['防爆', '不防爆'] },
  { key: 'fillingHeads', label: '灌装方式', options: ['单头', '双头', '三头', '四头', '五头', '六头', '八头'] },
  { key: 'capping', label: '压盖方式', options: ['5L平板压', '20L平板压', '花篮压盖', '自动辊压', '自动拧盖', '助力拧盖', '自动封盖', '自动捶盖', '自动封袋', '人工压盖', '空白'] },
  { key: 'conveyor', label: '输送方式', options: ['滚筒', '板链', '步进', '空白'] },
  { key: 'fillingMachine', label: '自动灌装机', options: ['30A', '30B/BG', '30G/GY', 'ZSQ', 'HX200', '2T'] },
  { key: 'fillingLine', label: '自动灌装线', options: ['1~5L方桶灌装自动线', '1~5L圆桶灌装自动线', '15~25L铁桶灌装自动线', '15~25L塑料桶灌装自动线', '15~25L偏心口桶灌装自动线', '50~200L桶灌装自动线', 'IBC桶灌装自动线', '袋式灌装机'] },
  { key: 'buffer', label: '缓存方式', options: ['不锈钢面板', '无动力滚筒', '无动力滚筒延长架', '重托盘缓存输送', '空白'] },
  { key: 'voc', label: 'VOC要求', options: ['一体式集气', '灌装阀集气', '空白'] },
  { key: 'bucketSeparation', label: '分桶方式', options: ['卧式分桶', '立式分桶', '抽底式分桶', '理桶平台', '自动卸桶', '人工上空桶', '空白'] },
  { key: 'weighing', label: '检重方式', options: ['动态检重', '静态检重', '检重剔除', '空白'], multiple: true },
  { key: 'capArrangement', label: '理盖方式', options: ['自动补盖', '转盘式理盖', '振动盘理盖', '空白'] },
  { key: 'capPlacement', label: '放盖方式', options: ['单吸盘', '双吸盘', '自动落盖', '自动追踪放盖', '人工放盖', '空白'] },
  { key: 'labeling', label: '贴标方式', options: ['空桶贴标', '重桶贴标', '顶部贴标', '在线打印贴标', '空白'], multiple: true },
  { key: 'palletizing', label: '码垛方式', options: ['机器人码垛', '悬臂式码垛', '龙门式码垛', '空白'] },
  { key: 'palletHandling', label: '托盘方式', options: ['托盘库', '托盘分离', '空托盘换线输送', '重托盘换线输送', '空白'], multiple: true },
  { key: 'boxing', label: '装箱方式', options: ['自动开箱', '自动装箱', '自动封箱', '自动码箱', '空白'], multiple: true },
  { key: 'extraFeatures', label: '其他功能', options: ['自动充氮', '自动套内袋', '皮带输盖', '自动喷码', '自动缠绕', '自动捆扎', '180°翻桶', '空白'], multiple: true }
];

const primaryKeys = ['productType', 'capType', 'capacity', 'materialIn'];
const secondaryKeys = ['explosionProof', 'fillingHeads', 'capping', 'conveyor'];

const primaryContainer = document.getElementById('primaryFilters');
const secondaryContainer = document.getElementById('secondaryFilters');
const extraContainer = document.getElementById('extraFilters');
const toggleFilters = document.getElementById('toggleFilters');
const resetButton = document.getElementById('resetFilters');
const grid = document.getElementById('videoGrid');
const template = document.getElementById('videoCardTemplate');

let videoData = [];
let filterState = {};

function createSelect(config) {
  const wrapper = document.createElement('div');
  wrapper.className = 'field';

  const label = document.createElement('label');
  label.textContent = config.label;

  const select = document.createElement('select');
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = '全部';
  select.appendChild(emptyOption);

  config.options.forEach((option) => {
    const opt = document.createElement('option');
    opt.value = option;
    opt.textContent = option;
    select.appendChild(opt);
  });

  select.addEventListener('change', () => {
    filterState[config.key] = select.value;
    renderVideos();
  });

  wrapper.appendChild(label);
  wrapper.appendChild(select);
  return wrapper;
}

function createChips(config) {
  const wrapper = document.createElement('div');
  wrapper.className = 'field';

  const label = document.createElement('label');
  label.textContent = config.label;

  const chipGroup = document.createElement('div');
  chipGroup.className = 'chip-group';

  config.options.forEach((option, index) => {
    const chipLabel = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = option;
    checkbox.name = `${config.key}-${index}`;

    checkbox.addEventListener('change', () => {
      const selected = Array.from(chipGroup.querySelectorAll('input:checked')).map((input) => input.value);
      filterState[config.key] = selected;
      renderVideos();
    });

    const text = document.createElement('span');
    text.textContent = option;

    chipLabel.appendChild(checkbox);
    chipLabel.appendChild(text);
    chipGroup.appendChild(chipLabel);
  });

  wrapper.appendChild(label);
  wrapper.appendChild(chipGroup);
  return wrapper;
}

function buildFilters() {
  filterConfig.forEach((config) => {
    const element = config.multiple ? createChips(config) : createSelect(config);

    if (primaryKeys.includes(config.key)) {
      primaryContainer.appendChild(element);
    } else if (secondaryKeys.includes(config.key)) {
      secondaryContainer.appendChild(element);
    } else {
      extraContainer.appendChild(element);
    }
  });
}

function getFilterValue(video, key) {
  const value = video.categories?.[key];
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function videoMatchesFilters(video) {
  return Object.entries(filterState).every(([key, selected]) => {
    if (!selected || (Array.isArray(selected) && selected.length === 0)) {
      return true;
    }

    const values = getFilterValue(video, key);

    if (Array.isArray(selected)) {
      return selected.every((item) => values.includes(item));
    }

    return values.includes(selected);
  });
}

function renderVideos() {
  grid.innerHTML = '';
  const filtered = videoData.filter(videoMatchesFilters);

  if (filtered.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'glass-card';
    emptyState.style.gridColumn = '1 / -1';
    emptyState.innerHTML = '<h2>未找到匹配的视频</h2><p>尝试调整筛选条件或导入新的视频数据。</p>';
    grid.appendChild(emptyState);
    return;
  }

  filtered.forEach((video) => {
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.video-card');
    const videoEl = node.querySelector('video');
    const title = node.querySelector('h3');
    const meta = node.querySelector('.meta');
    const playBtn = node.querySelector('.play-btn');
    const fullscreenBtn = node.querySelector('.fullscreen-btn');

    videoEl.src = video.path;
    videoEl.setAttribute('playsinline', '');
    title.textContent = video.displayName || video.fileName;

    const metaInfo = [
      video.categories?.productType,
      video.categories?.fillingMachine,
      video.categories?.fillingLine,
      [].concat(video.categories?.labeling || []).join('、'),
      [].concat(video.categories?.extraFeatures || []).join('、')
    ]
      .filter(Boolean)
      .join(' ｜ ');

    meta.textContent = metaInfo || '暂无分类信息';

    playBtn.addEventListener('click', () => {
      if (videoEl.paused) {
        videoEl.play();
        playBtn.textContent = '⏸';
      } else {
        videoEl.pause();
        playBtn.textContent = '▶';
      }
    });

    videoEl.addEventListener('pause', () => {
      playBtn.textContent = '▶';
    });

    fullscreenBtn.addEventListener('click', () => {
      if (videoEl.requestFullscreen) {
        videoEl.requestFullscreen();
      } else if (videoEl.webkitRequestFullscreen) {
        videoEl.webkitRequestFullscreen();
      }
    });

    grid.appendChild(node);
  });
}

async function fetchVideos() {
  try {
    const response = await fetch('/api/videos');
    const data = await response.json();
    videoData = data;
    renderVideos();
  } catch (error) {
    console.error('加载视频列表失败', error);
  }
}

function resetFiltersState() {
  filterState = {};
  document.querySelectorAll('.filter-panel select').forEach((select) => {
    select.value = '';
  });
  document.querySelectorAll('.chip-group input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = false;
  });
  renderVideos();
}

function setupToggle() {
  toggleFilters.addEventListener('click', () => {
    const collapseRow = extraContainer;
    const isActive = collapseRow.classList.toggle('active');
    toggleFilters.textContent = isActive ? '收起高级筛选' : '展开更多筛选';
  });
}

function init() {
  buildFilters();
  setupToggle();
  resetButton.addEventListener('click', resetFiltersState);
  fetchVideos();
}

init();

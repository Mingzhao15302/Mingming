const FIELD_CONFIG = {
  productType: {
    label: '产品类型',
    options: ['全部', '灌装机', '自动线', '码垛机']
  },
  capType: {
    label: '桶盖',
    options: ['全部', '塑料盖', '花篮盖', '小口桶盖', '圆形铁盖', '内外盖', '偏心口桶盖']
  },
  capacity: {
    label: '容量',
    options: ['全部', '0.5~5L', '15~25L', '50L', '200L', '1000L']
  },
  feedingMethod: {
    label: '来料方式',
    options: ['全部', '直接供料', '泵送', '过滤', '螺杆增压', '压料机', '拉缸', '角座阀', '手阀控制']
  },
  explosionProof: {
    label: '防爆要求',
    options: ['全部', '防爆', '不防爆']
  },
  fillingMethod: {
    label: '灌装方式',
    options: ['全部', '单头', '双头', '三头', '四头', '五头', '六头', '八头']
  },
  cappingMethod: {
    label: '压盖方式',
    options: ['全部', '5L平板压', '20L平板压', '花篮压盖', '自动辊压', '自动拧盖', '助力拧盖', '自动封盖', '自动捶盖', '自动封袋', '人工压盖', '空白']
  },
  conveyorMethod: {
    label: '输送方式',
    options: ['全部', '滚筒', '板链', '步进', '空白']
  },
  autoFillingMachine: {
    label: '自动灌装机',
    options: ['全部', '30A', '30B/BG', '30G/GY', 'ZSQ', 'HX200', '2T']
  },
  autoFillingLine: {
    label: '自动灌装线',
    options: [
      '全部',
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
  bufferMethod: {
    label: '缓存方式',
    options: ['全部', '不锈钢面板', '无动力滚筒', '无动力滚筒延长架', '重托盘缓存输送', '空白']
  },
  vocRequirement: {
    label: 'VOC要求',
    options: ['全部', '一体式集气', '灌装阀集气', '空白']
  },
  barrelSeparation: {
    label: '分桶方式',
    options: ['全部', '卧式分桶', '立式分桶', '抽底式分桶', '理桶平台', '自动卸桶', '人工上空桶', '空白']
  },
  weighingMethod: {
    label: '检重方式',
    options: ['动态检重', '静态检重', '检重剔除'],
    multi: true
  },
  capSorting: {
    label: '理盖方式',
    options: ['全部', '自动补盖', '转盘式理盖', '振动盘理盖', '空白']
  },
  capPlacing: {
    label: '放盖方式',
    options: ['全部', '单吸盘', '双吸盘', '自动落盖', '自动追踪放盖', '人工放盖', '空白']
  },
  labelingMethod: {
    label: '贴标方式',
    options: ['空桶贴标', '重桶贴标', '顶部贴标', '在线打印贴标'],
    multi: true
  },
  palletizingMethod: {
    label: '码垛方式',
    options: ['全部', '机器人码垛', '悬臂式码垛', '龙门式码垛', '空白']
  },
  palletMethod: {
    label: '托盘方式',
    options: ['托盘库', '托盘分离', '空托盘换线输送', '重托盘换线输送'],
    multi: true
  },
  boxingMethod: {
    label: '装箱方式',
    options: ['自动开箱', '自动装箱', '自动封箱', '自动码箱'],
    multi: true
  },
  otherFunctions: {
    label: '其他功能',
    options: ['自动充氮', '自动套内袋', '皮带输盖', '自动喷码', '自动缠绕', '自动捆扎', '180°翻桶'],
    multi: true
  }
};

const galleryEl = document.getElementById('gallery');
const toggleFiltersBtn = document.getElementById('toggleFilters');
const moreFiltersEl = document.getElementById('moreFilters');

let videos = [];
const selectedFilters = {};

function initFilters() {
  document.querySelectorAll('.filter').forEach((container) => {
    const field = container.dataset.field;
    const config = FIELD_CONFIG[field];
    if (!config) return;

    const labelEl = document.createElement('label');
    labelEl.textContent = config.label;
    container.appendChild(labelEl);

    if (config.multi) {
      const dropdown = document.createElement('details');
      dropdown.className = 'dropdown';

      const summary = document.createElement('summary');
      summary.className = 'dropdown-trigger';
      summary.textContent = '全部';
      dropdown.appendChild(summary);

      const list = document.createElement('div');
      list.className = 'dropdown-menu';

      config.options.forEach((option) => {
        const optionLabel = document.createElement('label');
        optionLabel.className = 'dropdown-option';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = option;
        checkbox.addEventListener('change', () => handleFilterChange(field));

        const text = document.createElement('span');
        text.textContent = option;

        optionLabel.append(checkbox, text);
        list.appendChild(optionLabel);
      });

      dropdown.appendChild(list);
      dropdown.addEventListener('toggle', () => {
        if (!dropdown.open) return;
        document.querySelectorAll('.filter details[open]').forEach((activeDropdown) => {
          if (activeDropdown !== dropdown) {
            activeDropdown.open = false;
          }
        });
      });
      container.appendChild(dropdown);
      updateMultiSummary(field, []);
    } else {
      const select = document.createElement('select');
      config.options.forEach((option) => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
      });
      select.addEventListener('change', () => handleFilterChange(field));
      container.appendChild(select);
    }
  });
}

function handleFilterChange(field) {
  const config = FIELD_CONFIG[field];
  if (!config) return;

  if (config.multi) {
    const dropdown = document.querySelector(`.filter[data-field="${field}"] details`);
    if (!dropdown) return;
    const selected = Array.from(dropdown.querySelectorAll('input[type="checkbox"]:checked')).map((input) => input.value);
    selectedFilters[field] = selected;
    updateMultiSummary(field, selected);
  } else {
    const select = document.querySelector(`.filter[data-field="${field}"] select`);
    selectedFilters[field] = select.value;
  }

  renderGallery();
}

function updateMultiSummary(field, selected) {
  const summary = document.querySelector(`.filter[data-field="${field}"] summary`);
  if (!summary) return;

  if (!selected || selected.length === 0) {
    summary.textContent = '全部';
    summary.title = '全部';
    return;
  }

  if (selected.length <= 2) {
    summary.textContent = selected.join('、');
    summary.title = selected.join('、');
    return;
  }

  summary.textContent = `${selected.slice(0, 2).join('、')} 等${selected.length}项`;
  summary.title = selected.join('、');
}

function matchesFilter(video, field, value) {
  if (!value || value === '全部') return true;
  const raw = video.metadata?.[field] || '';
  if (!raw) return false;

  const normalizedValues = Array.isArray(raw)
    ? raw
    : raw
        .split(/[，,;；\s]+/)
        .map((v) => v.trim())
        .filter(Boolean);

  return normalizedValues.includes(value);
}

function matchesMultiFilter(video, field, values) {
  if (!values || values.length === 0) return true;
  const raw = video.metadata?.[field] || '';
  if (!raw) return false;

  const normalizedValues = Array.isArray(raw)
    ? raw
    : raw
        .split(/[，,;；\s]+/)
        .map((v) => v.trim())
        .filter(Boolean);

  return values.every((value) => normalizedValues.includes(value));
}

function renderGallery() {
  galleryEl.innerHTML = '';

  const filteredVideos = videos.filter((video) => {
    return Object.entries(selectedFilters).every(([field, value]) => {
      const config = FIELD_CONFIG[field];
      if (!config) return true;
      if (config.multi) {
        return matchesMultiFilter(video, field, value);
      }
      return matchesFilter(video, field, value);
    });
  });

  if (!filteredVideos.length) {
    const empty = document.createElement('p');
    empty.textContent = '暂无符合筛选条件的视频，请调整筛选项。';
    empty.className = 'empty';
    galleryEl.appendChild(empty);
    return;
  }

  filteredVideos.forEach((video) => {
    const card = document.createElement('article');
    card.className = 'card';

    const videoEl = document.createElement('video');
    videoEl.src = video.path;
    videoEl.controls = true;
    videoEl.preload = 'metadata';
    videoEl.addEventListener('dblclick', () => {
      if (videoEl.requestFullscreen) {
        videoEl.requestFullscreen();
      }
    });

    const title = document.createElement('h3');
    title.textContent = video.originalName || video.filename;

    const meta = document.createElement('div');
    meta.className = 'meta';

    const majorTags = [
      ['产品类型', video.metadata?.productType],
      ['灌装机', video.metadata?.autoFillingMachine],
      ['灌装线', video.metadata?.autoFillingLine],
      ['桶盖', video.metadata?.capType],
      ['容量', video.metadata?.capacity]
    ];

    majorTags.forEach(([label, content]) => {
      if (!content) return;
      const row = document.createElement('div');
      row.innerHTML = `<span class="tag">${label}</span>${content}`;
      meta.appendChild(row);
    });

    card.append(videoEl, title, meta);
    galleryEl.appendChild(card);
  });
}

async function fetchVideos() {
  try {
    const response = await fetch('/api/videos');
    videos = await response.json();
    renderGallery();
  } catch (error) {
    console.error('加载视频失败', error);
  }
}

initFilters();
Object.keys(FIELD_CONFIG).forEach((field) => {
  const config = FIELD_CONFIG[field];
  selectedFilters[field] = config.multi ? [] : '全部';
});

document.addEventListener('click', (event) => {
  document.querySelectorAll('.filter details[open]').forEach((dropdown) => {
    if (!dropdown.contains(event.target)) {
      dropdown.open = false;
    }
  });
});

toggleFiltersBtn.addEventListener('click', () => {
  const collapsed = moreFiltersEl.classList.toggle('collapsed');
  toggleFiltersBtn.textContent = collapsed ? '展开更多' : '收起筛选';
});

fetchVideos();

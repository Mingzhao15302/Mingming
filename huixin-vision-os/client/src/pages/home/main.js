import '../../styles/base.css';
import '../../styles/style.css';

const AUTH_KEY = 'hyos-authenticated';

const categoryState = {
  fields: [],
  videos: [],
  filters: {},
  defaults: {},
  defaultProductType: '灌装机',
  expandedFilters: false,
};

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`请求失败：${response.status}`);
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

function pruneFilters(productType) {
  const allowed = new Set(['productType']);
  categoryState.fields.forEach((field) => {
    if (shouldDisplayField(field, productType)) {
      allowed.add(field.key);
    }
  });
  Object.keys(categoryState.filters).forEach((key) => {
    if (!allowed.has(key)) {
      delete categoryState.filters[key];
    }
  });
}

function createSelectField(field, container) {
  const wrapper = document.createElement('div');
  wrapper.className = 'filter-field';

  const label = document.createElement('label');
  label.textContent = field.label;

  const select = document.createElement('select');
  select.name = field.key;

  if (field.type === 'multi') {
    select.multiple = true;
  } else if (field.key !== 'productType') {
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '全部';
    select.appendChild(emptyOption);
  }

  (field.options || []).forEach((option) => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    select.appendChild(optionElement);
  });

  const currentValue = categoryState.filters[field.key];
  if (select.multiple) {
    const selectedValues = Array.isArray(currentValue) ? currentValue : [];
    Array.from(select.options).forEach((option) => {
      if (selectedValues.includes(option.value)) {
        option.selected = true;
      }
    });
  } else if (currentValue !== undefined) {
    select.value = currentValue;
  } else if (field.key === 'productType') {
    select.value = categoryState.filters.productType || categoryState.defaultProductType;
  }

  select.addEventListener('change', () => handleFilterChange(field, select));

  wrapper.appendChild(label);
  wrapper.appendChild(select);
  container.appendChild(wrapper);
}

function renderFilters() {
  const productType = categoryState.filters.productType || categoryState.defaultProductType;
  pruneFilters(productType);

  const primaryDropdown = document.getElementById('primaryDropdown');
  const extendedDropdown = document.getElementById('extendedDropdown');
  const multiFilters = document.getElementById('multiFilters');

  primaryDropdown.innerHTML = '';
  extendedDropdown.innerHTML = '';
  multiFilters.innerHTML = '';

  const dropdownFields = categoryState.fields
    .filter((field) => field.type !== 'multi' && shouldDisplayField(field, productType))
    .sort((a, b) => getFieldOrder(a, productType) - getFieldOrder(b, productType));

  dropdownFields.forEach((field, index) => {
    if (index < 8) {
      createSelectField(field, primaryDropdown);
    } else {
      createSelectField(field, extendedDropdown);
    }
  });

  const multiFields = categoryState.fields
    .filter((field) => field.type === 'multi' && shouldDisplayField(field, productType))
    .sort((a, b) => getFieldOrder(a, productType) - getFieldOrder(b, productType));

  if (multiFields.length) {
    multiFields.forEach((field) => createSelectField(field, multiFilters));
  }

  const toggleBtn = document.getElementById('toggleFilters');
  if (categoryState.expandedFilters) {
    toggleBtn.classList.add('expanded');
    toggleBtn.querySelector('.icon').textContent = '▲';
    toggleBtn.querySelector('.label').textContent = '收起扩展分类';
    extendedDropdown.classList.remove('hidden');
    if (multiFields.length) {
      multiFilters.classList.remove('hidden');
    }
  } else {
    toggleBtn.classList.remove('expanded');
    toggleBtn.querySelector('.icon').textContent = '▼';
    toggleBtn.querySelector('.label').textContent = '展开更多分类';
    extendedDropdown.classList.add('hidden');
    if (multiFields.length) {
      multiFilters.classList.add('hidden');
    } else {
      multiFilters.classList.add('hidden');
    }
  }

  if (!multiFields.length) {
    multiFilters.classList.add('hidden');
  }
}

function handleFilterChange(field, select) {
  if (select.multiple) {
    const values = Array.from(select.selectedOptions)
      .map((option) => option.value)
      .filter(Boolean);
    if (values.length) {
      categoryState.filters[field.key] = values;
    } else {
      delete categoryState.filters[field.key];
    }
  } else {
    const value = select.value;
    if (field.key === 'productType') {
      categoryState.filters.productType = value || categoryState.defaultProductType;
      pruneFilters(categoryState.filters.productType);
      categoryState.expandedFilters = false;
      renderFilters();
    } else if (value) {
      categoryState.filters[field.key] = value;
    } else {
      delete categoryState.filters[field.key];
    }
  }

  renderVideos();
}

function resetFilters() {
  categoryState.filters = { productType: categoryState.defaultProductType };
  categoryState.expandedFilters = false;
  renderFilters();
  renderVideos();
}

function filterVideos(videos) {
  return videos.filter((video) => {
    return Object.entries(categoryState.filters).every(([key, value]) => {
      if (key === 'productType' && !value) return true;
      const categoryValue = video.categories?.[key];

      if (Array.isArray(value)) {
        if (!Array.isArray(categoryValue)) return false;
        return value.every((item) => categoryValue.includes(item));
      }

      if (!value) return true;
      if (value === '空白') {
        return !categoryValue || categoryValue === '空白' || categoryValue === '';
      }
      return categoryValue === value;
    });
  });
}

function createVideoCard(video) {
  const card = document.createElement('article');
  card.className = 'video-card fade-in';

  const videoWrapper = document.createElement('div');
  videoWrapper.className = 'video-wrapper';

  const videoElement = document.createElement('video');
  videoElement.src = `/videos/${video.fileName}`;
  videoElement.preload = 'metadata';
  videoElement.controls = false;

  const overlay = document.createElement('div');
  overlay.className = 'video-overlay';

  const playButton = document.createElement('button');
  playButton.textContent = videoElement.paused ? '播放' : '暂停';
  playButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (videoElement.paused) {
      videoElement.play();
      playButton.textContent = '暂停';
    } else {
      videoElement.pause();
      playButton.textContent = '播放';
    }
  });

  const fullscreenButton = document.createElement('button');
  fullscreenButton.textContent = '全屏';
  fullscreenButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (videoElement.requestFullscreen) {
      videoElement.requestFullscreen();
    } else if (videoElement.webkitRequestFullscreen) {
      videoElement.webkitRequestFullscreen();
    }
  });

  const editButton = document.createElement('button');
  editButton.textContent = '编辑';
  editButton.addEventListener('click', (event) => {
    event.stopPropagation();
    handleEdit(video);
  });

  const deleteButton = document.createElement('button');
  deleteButton.textContent = '删除';
  deleteButton.addEventListener('click', async (event) => {
    event.stopPropagation();
    await handleDelete(video);
  });

  overlay.append(playButton, fullscreenButton, editButton, deleteButton);
  videoWrapper.appendChild(videoElement);
  videoWrapper.appendChild(overlay);

  const info = document.createElement('div');
  info.className = 'video-info';

  const title = document.createElement('h3');
  title.textContent = video.title || video.originalName || '未命名视频';

  const meta = document.createElement('div');
  meta.className = 'meta';

  const productTypeValue = video.categories?.productType;
  if (productTypeValue) {
    meta.appendChild(document.createElement('span')).textContent = `产品类型: ${productTypeValue}`;
  }

  const productType = productTypeValue || categoryState.defaultProductType;
  const metaFields = categoryState.fields
    .filter((field) => field.key !== 'productType' && shouldDisplayField(field, productType))
    .sort((a, b) => getFieldOrder(a, productType) - getFieldOrder(b, productType));

  metaFields.forEach((field) => {
    const value = video.categories?.[field.key];
    if (field.type === 'multi') {
      if (Array.isArray(value) && value.length) {
        const span = document.createElement('span');
        span.textContent = `${field.label}: ${value.join('、')}`;
        meta.appendChild(span);
      }
    } else if (value && value !== '空白') {
      const span = document.createElement('span');
      span.textContent = `${field.label}: ${value}`;
      meta.appendChild(span);
    }
  });

  info.appendChild(title);
  info.appendChild(meta);

  card.appendChild(videoWrapper);
  card.appendChild(info);

  card.addEventListener('mouseleave', () => {
    videoElement.pause();
    playButton.textContent = '播放';
  });

  return card;
}

function renderVideos() {
  const grid = document.getElementById('videoGrid');
  const noResult = document.getElementById('noResult');
  grid.innerHTML = '';

  const filtered = filterVideos(categoryState.videos);
  if (!filtered.length) {
    noResult.classList.remove('hidden');
    return;
  }
  noResult.classList.add('hidden');

  filtered.forEach((video) => {
    grid.appendChild(createVideoCard(video));
  });
}

function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

function handleEdit(video) {
  if (isAuthenticated()) {
    window.location.href = `/dashboard?video=${video.id}`;
  } else if (window.confirm('需要登录控制台进行编辑，是否前往登录？')) {
    window.location.href = '/login';
  }
}

async function handleDelete(video) {
  if (!isAuthenticated()) {
    if (window.confirm('需要登录控制台进行删除，是否前往登录？')) {
      window.location.href = '/login';
    }
    return;
  }

  if (!window.confirm('删除后无法恢复，确认要删除该视频吗？')) {
    return;
  }

  const response = await fetch(`/api/videos/${video.id}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (result.success) {
    categoryState.videos = result.videos;
    renderVideos();
  } else {
    alert(result.message || '删除失败，请重试');
  }
}

async function init() {
  const [fields, videos] = await Promise.all([
    fetchJSON('/api/config/categories'),
    fetchJSON('/api/videos'),
  ]);

  categoryState.fields = fields;
  categoryState.videos = videos;
  categoryState.defaults = buildDefaultCategories(fields);
  categoryState.defaultProductType = fields.find((field) => field.key === 'productType')?.default || '灌装机';
  categoryState.filters.productType = categoryState.defaultProductType;

  renderFilters();
  renderVideos();

  document.getElementById('toggleFilters').addEventListener('click', () => {
    categoryState.expandedFilters = !categoryState.expandedFilters;
    renderFilters();
  });

  document.getElementById('resetFilters').addEventListener('click', resetFilters);
}

document.addEventListener('DOMContentLoaded', init);

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

  if (field.key !== 'productType') {
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
  if (currentValue !== undefined) {
    select.value = currentValue;
  } else if (field.key === 'productType') {
    select.value = categoryState.filters.productType || categoryState.defaultProductType;
  }

  select.addEventListener('change', () => handleFilterChange(field, select));

  wrapper.appendChild(label);
  wrapper.appendChild(select);
  container.appendChild(wrapper);
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

function createMultiField(field, container) {
  const wrapper = document.createElement('div');
  wrapper.className = 'multi-field-row';
  wrapper.dataset.multiKey = field.key;

  const title = document.createElement('span');
  title.className = 'field-title';
  title.textContent = field.label;

  const toggleGroup = document.createElement('div');
  toggleGroup.className = 'toggle-group';

  const selectedValues = Array.isArray(categoryState.filters[field.key]) ? categoryState.filters[field.key] : [];

  (field.options || []).forEach((option) => {
    const toggle = createToggleOption(option, selectedValues.includes(option), (isChecked) => {
      const currentValues = new Set(Array.isArray(categoryState.filters[field.key]) ? categoryState.filters[field.key] : []);
      if (isChecked) {
        currentValues.add(option);
      } else {
        currentValues.delete(option);
      }

      if (currentValues.size) {
        categoryState.filters[field.key] = Array.from(currentValues);
      } else {
        delete categoryState.filters[field.key];
      }

      renderVideos();
    });
    toggleGroup.appendChild(toggle);
  });

  wrapper.append(title, toggleGroup);
  container.appendChild(wrapper);
}

const ICONS = {
  play: `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" fill="currentColor">
      <polygon points="18,12 38,24 18,36" />
    </svg>
  `,
  pause: `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" fill="currentColor">
      <rect x="14" y="12" width="8" height="24" rx="1.5" />
      <rect x="26" y="12" width="8" height="24" rx="1.5" />
    </svg>
  `,
  stop: `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" fill="currentColor">
      <rect x="14" y="14" width="20" height="20" rx="3" />
    </svg>
  `,
  volumeUp: `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" fill="currentColor">
      <path d="M9 20h7.5L26 14v20l-9.5-6H9z" />
      <path d="M30.5 16.8v14.4c3.04-1.1 5.1-4.02 5.1-7.2s-2.06-6.1-5.1-7.2z" />
      <path d="M35.6 11.7v4.7c3.87 1.64 6.4 5.2 6.4 8.6s-2.53 6.96-6.4 8.6v4.7C41.87 36.2 46 30.6 46 25s-4.13-11.2-10.4-13.3z" />
    </svg>
  `,
  volumeOff: `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" fill="currentColor">
      <path d="M9 20h7.5L26 14v20l-9.5-6H9z" />
      <path d="M30.6 17.1v6.26L26 18.76V14l4.6 3.1z" />
      <path d="M34.4 18 31 21.4l-3.4-3.4-3 3 3.4 3.4L24.6 28l3 3 3.4-3.4L34.4 31l3-3-3.4-3.4L37.4 21z" />
    </svg>
  `,
  fullscreen: `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" fill="currentColor">
      <path d="M8 18v-12h16v6h-10v6H8z" />
      <path d="M40 18h-6v-6h-10V6h16v12z" />
      <path d="M24 36v6H8V30h6v6h10z" />
      <path d="M40 30v12H24v-6h10v-6h6z" />
    </svg>
  `,
  fullscreenExit: `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" fill="currentColor">
      <path d="M18 18h-6v6H8V12h16v6h-6z" />
      <path d="M30 18v-6h-6V12h16v12h-4v-6h-6z" />
      <path d="M18 30h6v6H24v-12H8v12h4v-6h6z" />
      <path d="M30 30h6v6h4V24H24v12h6v-6z" />
    </svg>
  `,
  download: `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" fill="currentColor">
      <path d="M10 34h28v6H10z" />
      <path d="M24 8v18.34l-5.66-5.66-4.24 4.24L24 38l9.9-9.08-4.24-4.24L24 26.34V8z" />
    </svg>
  `,
  rewind10: `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd">
      <polygon points="30,16 30,32 18,24" />
      <polygon points="40,16 40,32 28,24" />
      <path d="M11 16h4v16h-4z" />
      <path d="M19 16h9v16h-9V16zm3 3v10h3V19h-3z" />
    </svg>
  `,
  forward10: `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd">
      <polygon points="8,16 20,24 8,32" />
      <polygon points="18,16 30,24 18,32" />
      <path d="M32 16h4v16h-4z" />
      <path d="M36 16h9v16h-9V16zm3 3v10h3V19h-3z" />
    </svg>
  `,
};

function applyIcon(button, iconName) {
  const svg = ICONS[iconName];
  if (!svg) return;
  if (button.dataset.iconName === iconName) return;
  button.dataset.iconName = iconName;
  button.innerHTML = svg;
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
    multiFields.forEach((field) => createMultiField(field, multiFilters));
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

  const previewControls = document.createElement('div');
  previewControls.className = 'preview-controls controls-row';

  const fullscreenControls = document.createElement('div');
  fullscreenControls.className = 'fullscreen-controls controls-hidden';

  const fullscreenPrimary = document.createElement('div');
  fullscreenPrimary.className = 'controls-row fullscreen-primary';

  const fullscreenSecondary = document.createElement('div');
  fullscreenSecondary.className = 'controls-row fullscreen-secondary';

  fullscreenControls.append(fullscreenPrimary, fullscreenSecondary);

  const isWrapperInFullscreen = () =>
    document.fullscreenElement === videoWrapper || document.webkitFullscreenElement === videoWrapper;

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  };

  const HIDE_DELAY = 2500;
  let hideControlsTimer;

  const showFullscreenControls = () => {
    if (!isWrapperInFullscreen()) return;
    fullscreenControls.classList.remove('controls-hidden');
    clearTimeout(hideControlsTimer);
    hideControlsTimer = window.setTimeout(() => {
      fullscreenControls.classList.add('controls-hidden');
    }, HIDE_DELAY);
  };

  const handlePointerActivity = () => {
    if (isWrapperInFullscreen()) {
      showFullscreenControls();
    }
  };

  const attachFullscreenInteractions = () => {
    videoWrapper.addEventListener('mousemove', handlePointerActivity);
    videoWrapper.addEventListener('touchstart', handlePointerActivity, { passive: true });
  };

  const detachFullscreenInteractions = () => {
    videoWrapper.removeEventListener('mousemove', handlePointerActivity);
    videoWrapper.removeEventListener('touchstart', handlePointerActivity);
    clearTimeout(hideControlsTimer);
    fullscreenControls.classList.remove('controls-hidden');
  };

  const toggleFullscreen = () => {
    if (isWrapperInFullscreen()) {
      exitFullscreen();
    } else if (videoWrapper.requestFullscreen) {
      videoWrapper.requestFullscreen();
    } else if (videoWrapper.webkitRequestFullscreen) {
      videoWrapper.webkitRequestFullscreen();
    }
  };

  const downloadVideo = () => {
    const link = document.createElement('a');
    link.href = videoElement.src;
    link.download = video.originalName || video.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const seekBy = (seconds) => {
    const duration = Number.isFinite(videoElement.duration) ? videoElement.duration : videoElement.currentTime + Math.max(seconds, 0);
    const next = Math.min(Math.max(0, videoElement.currentTime + seconds), duration);
    videoElement.currentTime = next;
    showFullscreenControls();
  };

  const createControlButton = (className, label, handler) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `video-control ${className}`;
    button.setAttribute('aria-label', label);
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      handler();
    });
    return button;
  };

  const previewPlayButton = createControlButton('play-toggle', '播放', () => {
    if (videoElement.paused) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
  });

  const previewStopButton = createControlButton('stop-button', '停止', () => {
    videoElement.pause();
    videoElement.currentTime = 0;
    updatePlayIcons();
  });
  applyIcon(previewStopButton, 'stop');

  const previewFullscreenButton = createControlButton('fullscreen-toggle', '全屏', () => {
    toggleFullscreen();
  });

  const previewDownloadButton = createControlButton('download-button', '下载', () => {
    downloadVideo();
  });

  previewControls.append(previewPlayButton, previewStopButton, previewFullscreenButton, previewDownloadButton);

  const fullscreenRewindButton = createControlButton('rewind-button', '快退10秒', () => {
    seekBy(-10);
  });
  applyIcon(fullscreenRewindButton, 'rewind10');

  const fullscreenStopButton = createControlButton('stop-button', '停止', () => {
    videoElement.pause();
    videoElement.currentTime = 0;
    updatePlayIcons();
    showFullscreenControls();
  });
  applyIcon(fullscreenStopButton, 'stop');

  const fullscreenPlayButton = createControlButton('fullscreen-play-toggle', '播放', () => {
    if (videoElement.paused) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
    showFullscreenControls();
  });

  const fullscreenForwardButton = createControlButton('forward-button', '快进10秒', () => {
    seekBy(10);
  });
  applyIcon(fullscreenForwardButton, 'forward10');

  const fullscreenToggleButton = createControlButton('fullscreen-exit-toggle', '退出全屏', () => {
    toggleFullscreen();
    showFullscreenControls();
  });

  const fullscreenVolumeButton = createControlButton('fullscreen-volume-toggle', '静音', () => {
    videoElement.muted = !videoElement.muted;
    showFullscreenControls();
  });

  const fullscreenDownloadButton = createControlButton('fullscreen-download-button', '下载', () => {
    downloadVideo();
    showFullscreenControls();
  });

  fullscreenPrimary.append(fullscreenRewindButton, fullscreenStopButton, fullscreenPlayButton, fullscreenForwardButton);
  fullscreenSecondary.append(fullscreenToggleButton, fullscreenVolumeButton, fullscreenDownloadButton);

  const updatePlayIcons = () => {
    const iconName = videoElement.paused ? 'play' : 'pause';
    const label = videoElement.paused ? '播放' : '暂停';
    applyIcon(previewPlayButton, iconName);
    applyIcon(fullscreenPlayButton, iconName);
    previewPlayButton.setAttribute('aria-label', label);
    fullscreenPlayButton.setAttribute('aria-label', label);
  };

  const updateVolumeIcons = () => {
    const muted = videoElement.muted || videoElement.volume === 0;
    const iconName = muted ? 'volumeOff' : 'volumeUp';
    const label = muted ? '恢复音量' : '静音';
    applyIcon(fullscreenVolumeButton, iconName);
    fullscreenVolumeButton.setAttribute('aria-label', label);
  };

  const updateFullscreenIcons = () => {
    const active = isWrapperInFullscreen();
    applyIcon(previewFullscreenButton, active ? 'fullscreenExit' : 'fullscreen');
    applyIcon(fullscreenToggleButton, active ? 'fullscreenExit' : 'fullscreen');
    const label = active ? '退出全屏' : '全屏';
    previewFullscreenButton.setAttribute('aria-label', label);
    fullscreenToggleButton.setAttribute('aria-label', label);
  };

  const updateDownloadIcons = () => {
    applyIcon(previewDownloadButton, 'download');
    applyIcon(fullscreenDownloadButton, 'download');
  };

  const handleKeydown = (event) => {
    if (!isWrapperInFullscreen()) return;
    const target = event.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
      return;
    }

    switch (event.key) {
      case ' ': // Space
      case 'Spacebar':
        event.preventDefault();
        if (videoElement.paused) {
          videoElement.play();
        } else {
          videoElement.pause();
        }
        showFullscreenControls();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        seekBy(-10);
        break;
      case 'ArrowRight':
        event.preventDefault();
        seekBy(10);
        break;
      case 'f':
      case 'F':
        event.preventDefault();
        toggleFullscreen();
        break;
      case 'm':
      case 'M':
        event.preventDefault();
        videoElement.muted = !videoElement.muted;
        showFullscreenControls();
        break;
      default:
        break;
    }
  };

  const handleFullscreenChange = () => {
    if (!videoWrapper.isConnected) {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeydown);
      detachFullscreenInteractions();
      return;
    }

    const active = isWrapperInFullscreen();
    videoWrapper.classList.toggle('fullscreen-active', active);
    updateFullscreenIcons();

    if (active) {
      attachFullscreenInteractions();
      document.addEventListener('keydown', handleKeydown);
      showFullscreenControls();
    } else {
      document.removeEventListener('keydown', handleKeydown);
      detachFullscreenInteractions();
    }
  };

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

  updatePlayIcons();
  updateVolumeIcons();
  updateFullscreenIcons();
  updateDownloadIcons();

  videoElement.addEventListener('play', updatePlayIcons);
  videoElement.addEventListener('pause', updatePlayIcons);
  videoElement.addEventListener('volumechange', updateVolumeIcons);
  videoWrapper.appendChild(videoElement);
  videoWrapper.appendChild(overlay);
  videoWrapper.appendChild(previewControls);
  videoWrapper.appendChild(fullscreenControls);

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
    updatePlayIcons();
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

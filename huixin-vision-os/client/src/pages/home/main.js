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
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.25 5.653v12.694a.75.75 0 0 0 1.136.643l10.892-6.347a.75.75 0 0 0 0-1.286L6.386 5.01a.75.75 0 0 0-1.136.643Z" />
    </svg>
  `,
  pause: `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.75 5.25A.75.75 0 0 1 7.5 6v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm7.5 0A.75.75 0 0 1 15 6v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Z" />
    </svg>
  `,
  volumeUp: `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.114 5.636a.75.75 0 0 1 1.272-.772 9.005 9.005 0 0 1 0 10.272.75.75 0 1 1-1.272-.772 7.504 7.504 0 0 0 0-8.728Z" />
      <path d="M16.012 8.738a.75.75 0 0 1 1.272-.772 5.002 5.002 0 0 1 0 5.068.75.75 0 0 1-1.272-.772 3.501 3.501 0 0 0 0-3.524Z" />
      <path d="M12 4.5v15a1.5 1.5 0 0 1-2.561 1.06l-3.9-3.9H3.75A2.25 2.25 0 0 1 1.5 14.25v-4.5A2.25 2.25 0 0 1 3.75 7.5h1.789l3.9-3.9A1.5 1.5 0 0 1 12 4.5Z" />
    </svg>
  `,
  volumeOff: `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5v15a1.5 1.5 0 0 1-2.561 1.06l-3.9-3.9H3.75A2.25 2.25 0 0 1 1.5 14.25v-4.5A2.25 2.25 0 0 1 3.75 7.5h1.789l3.9-3.9A1.5 1.5 0 0 1 12 4.5Z" />
      <path d="M16.5 8.25a.75.75 0 0 1 1.06 0l1.94 1.94 1.94-1.94a.75.75 0 0 1 1.06 1.06l-1.94 1.94 1.94 1.94a.75.75 0 1 1-1.06 1.06l-1.94-1.94-1.94 1.94a.75.75 0 1 1-1.06-1.06l1.94-1.94-1.94-1.94a.75.75 0 0 1 0-1.06Z" />
    </svg>
  `,
  fullscreen: `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor">
      <path fill-rule="evenodd" d="M3 6a3 3 0 0 1 3-3h2.25a.75.75 0 0 1 0 1.5H6A1.5 1.5 0 0 0 4.5 6v2.25a.75.75 0 0 1-1.5 0V6Zm0 12a3 3 0 0 0 3 3h2.25a.75.75 0 0 0 0-1.5H6A1.5 1.5 0 0 1 4.5 18v-2.25a.75.75 0 1 0-1.5 0V18Zm18-12a3 3 0 0 0-3-3h-2.25a.75.75 0 0 0 0 1.5H18A1.5 1.5 0 0 1 19.5 6v2.25a.75.75 0 0 0 1.5 0V6Zm0 12a3 3 0 0 1-3 3h-2.25a.75.75 0 1 1 0-1.5H18a1.5 1.5 0 0 0 1.5-1.5v-2.25a.75.75 0 1 1 1.5 0V18Z" clip-rule="evenodd" />
    </svg>
  `,
  fullscreenExit: `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor">
      <path fill-rule="evenodd" d="M3 8.25A2.25 2.25 0 0 1 5.25 6H7.5a.75.75 0 0 1 0 1.5H5.25a.75.75 0 0 0-.75.75V10.5a.75.75 0 0 1-1.5 0V8.25ZM3 15.75A2.25 2.25 0 0 1 5.25 18H7.5a.75.75 0 0 0 0-1.5H5.25a.75.75 0 0 1-.75-.75V13.5a.75.75 0 1 0-1.5 0v2.25ZM21 8.25A2.25 2.25 0 0 0 18.75 6H16.5a.75.75 0 1 0 0 1.5h2.25a.75.75 0 0 1 .75.75V10.5a.75.75 0 0 0 1.5 0V8.25ZM21 15.75A2.25 2.25 0 0 0 18.75 18H16.5a.75.75 0 0 1 0-1.5h2.25a.75.75 0 0 0 .75-.75V13.5a.75.75 0 1 1 1.5 0v2.25Z" clip-rule="evenodd" />
    </svg>
  `,
  download: `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor">
      <path fill-rule="evenodd" d="M11.47 3.72a.75.75 0 0 1 1.06 0l3.75 3.75a.75.75 0 0 1-1.06 1.06L12.75 6.56v8.69a.75.75 0 0 1-1.5 0V6.56L8.78 8.53A.75.75 0 0 1 7.72 7.47l3.75-3.75Z" clip-rule="evenodd" />
      <path fill-rule="evenodd" d="M4.5 15a4.5 4.5 0 0 0 4.5 4.5h6a4.5 4.5 0 0 0 4.5-4.5V9.75a.75.75 0 0 0-1.5 0V15a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V9.75a.75.75 0 0 0-1.5 0V15Z" clip-rule="evenodd" />
    </svg>
  `,
  rewind10: `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.25 6.5a.75.75 0 0 0-1.17-.63l-5.75 3.75a.75.75 0 0 0 0 1.26l5.75 3.75a.75.75 0 0 0 1.17-.63V12l4.83 3.15a.75.75 0 0 0 1.17-.63v-7a.75.75 0 0 0-1.17-.63L11.25 11V6.5Z" />
      <path d="M19 10.25h-1v3.5h1V15h-2.25V9H19v1.25Zm-5.5-1.25A2.75 2.75 0 0 0 10.75 11v.5A2.75 2.75 0 0 0 13.5 14.25 2.75 2.75 0 0 0 16.25 11.5V11a2.75 2.75 0 0 0-2.75-2.75Zm0 1.5A1.25 1.25 0 0 1 14.75 11v.5a1.25 1.25 0 0 1-2.5 0V11a1.25 1.25 0 0 1 1.25-1.25Z" />
    </svg>
  `,
  forward10: `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.75 6.5a.75.75 0 0 1 1.17-.63l5.75 3.75a.75.75 0 0 1 0 1.26l-5.75 3.75a.75.75 0 0 1-1.17-.63V12l-4.83 3.15a.75.75 0 0 1-1.17-.63v-7a.75.75 0 0 1 1.17-.63L12.75 11V6.5Z" />
      <path d="M5 10.25h1V13.8H5V15h2.25V9H5v1.25Zm5.5-1.25A2.75 2.75 0 0 1 13.25 11v.5a2.75 2.75 0 0 1-2.75 2.75A2.75 2.75 0 0 1 7.75 11.5V11A2.75 2.75 0 0 1 10.5 9Zm0 1.5A1.25 1.25 0 0 0 9.25 11v.5a1.25 1.25 0 0 0 2.5 0V11a1.25 1.25 0 0 0-1.25-1.25Z" />
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
  overlay.append(previewControls, fullscreenControls);

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

  const previewVolumeButton = createControlButton('volume-toggle', '静音', () => {
    videoElement.muted = !videoElement.muted;
  });

  const previewPlayButton = createControlButton('play-toggle', '播放', () => {
    if (videoElement.paused) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
  });

  const previewFullscreenButton = createControlButton('fullscreen-toggle', '全屏', () => {
    toggleFullscreen();
  });

  const previewDownloadButton = createControlButton('download-button', '下载', () => {
    downloadVideo();
  });

  previewControls.append(previewVolumeButton, previewPlayButton, previewFullscreenButton, previewDownloadButton);

  const fullscreenRewindButton = createControlButton('rewind-button', '快退10秒', () => {
    seekBy(-10);
  });
  applyIcon(fullscreenRewindButton, 'rewind10');

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

  const fullscreenVolumeButton = createControlButton('fullscreen-volume-toggle', '静音', () => {
    videoElement.muted = !videoElement.muted;
    showFullscreenControls();
  });

  const fullscreenToggleButton = createControlButton('fullscreen-exit-toggle', '退出全屏', () => {
    toggleFullscreen();
  });

  const fullscreenDownloadButton = createControlButton('fullscreen-download-button', '下载', () => {
    downloadVideo();
    showFullscreenControls();
  });

  fullscreenPrimary.append(fullscreenRewindButton, fullscreenPlayButton, fullscreenForwardButton);
  fullscreenSecondary.append(fullscreenVolumeButton, fullscreenToggleButton, fullscreenDownloadButton);

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
    applyIcon(previewVolumeButton, iconName);
    applyIcon(fullscreenVolumeButton, iconName);
    previewVolumeButton.setAttribute('aria-label', label);
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

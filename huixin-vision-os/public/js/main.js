const categoryState = {
  fields: [],
  videos: [],
  filters: {},
};

async function fetchJSON(url) {
  const response = await fetch(url);
  return response.json();
}

function createSelect(field) {
  const container = document.createElement('div');
  container.className = 'filter-field';

  const label = document.createElement('label');
  label.textContent = field.label;

  const select = document.createElement('select');
  select.name = field.key;
  if (field.type === 'multi') {
    select.multiple = true;
  } else {
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '全部';
    select.appendChild(emptyOption);
  }

  field.options.forEach((option) => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    select.appendChild(optionElement);
  });

  select.addEventListener('change', handleFilterChange);

  container.appendChild(label);
  container.appendChild(select);
  return container;
}

function buildFilters(fields) {
  const primaryContainer = document.getElementById('primaryFilters');
  const extendedContainer = document.getElementById('extendedFilters');
  primaryContainer.innerHTML = '';
  extendedContainer.innerHTML = '';

  fields.forEach((field) => {
    const select = createSelect(field);
    if (field.group === 'primary-row-1' || field.group === 'primary-row-2') {
      primaryContainer.appendChild(select);
    } else {
      extendedContainer.appendChild(select);
    }
  });
}

function handleFilterChange(event) {
  const select = event.target;
  const key = select.name;
  if (select.multiple) {
    categoryState.filters[key] = Array.from(select.selectedOptions).map((option) => option.value);
  } else {
    categoryState.filters[key] = select.value;
  }
  renderVideos();
}

function resetFilters() {
  categoryState.filters = {};
  document.querySelectorAll('.filters select').forEach((select) => {
    if (select.multiple) {
      Array.from(select.options).forEach((option) => {
        option.selected = false;
      });
    } else {
      select.value = '';
    }
  });
  renderVideos();
}

function filterVideos(videos) {
  return videos.filter((video) => {
    return Object.entries(categoryState.filters).every(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return true;
      const categoryValue = video.categories?.[key];

      if (Array.isArray(value)) {
        if (!Array.isArray(categoryValue)) return false;
        return value.some((item) => categoryValue.includes(item));
      }

      if (!value) return true;
      if (!categoryValue) return false;
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
  playButton.textContent = '播放/暂停';
  playButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (videoElement.paused) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
  });

  const fullscreenButton = document.createElement('button');
  fullscreenButton.textContent = '全屏预览';
  fullscreenButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (videoElement.requestFullscreen) {
      videoElement.requestFullscreen();
    } else if (videoElement.webkitRequestFullscreen) {
      videoElement.webkitRequestFullscreen();
    }
  });

  overlay.appendChild(playButton);
  overlay.appendChild(fullscreenButton);

  videoWrapper.appendChild(videoElement);
  videoWrapper.appendChild(overlay);

  const info = document.createElement('div');
  info.className = 'video-info';

  const title = document.createElement('h3');
  title.textContent = video.title || video.originalName;

  const meta = document.createElement('div');
  meta.className = 'meta';

  categoryState.fields.forEach((field) => {
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

  card.addEventListener('mouseenter', () => {
    overlay.style.opacity = 1;
  });

  card.addEventListener('mouseleave', () => {
    overlay.style.opacity = 0;
    videoElement.pause();
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

async function init() {
  const [fields, videos] = await Promise.all([
    fetchJSON('/api/config/categories'),
    fetchJSON('/api/videos'),
  ]);

  categoryState.fields = fields;
  categoryState.videos = videos;

  buildFilters(fields);
  renderVideos();

  document.getElementById('toggleFilters').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const extended = document.getElementById('extendedFilters');
    const isHidden = extended.classList.contains('hidden');
    extended.classList.toggle('hidden');
    button.classList.toggle('expanded', isHidden);
    button.querySelector('.icon').textContent = isHidden ? '▲' : '▼';
    button.querySelector('.label').textContent = isHidden ? '收起扩展分类' : '展开更多分类';
  });

  document.getElementById('resetFilters').addEventListener('click', resetFilters);
}

document.addEventListener('DOMContentLoaded', init);

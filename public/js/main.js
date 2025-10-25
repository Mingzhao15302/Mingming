const gallery = document.getElementById('videoGallery');
const filterCategory = document.getElementById('filterCategory');
const filterModule = document.getElementById('filterModule');
const filterBucket = document.getElementById('filterBucket');
const filterTag = document.getElementById('filterTag');

let videos = [];

function createOption(value) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = value || '全部';
  return option;
}

function populateFilters() {
  const categories = new Set();
  const modules = new Set();
  const buckets = new Set();
  const tags = new Set();

  videos.forEach((video) => {
    if (video.category) categories.add(video.category);
    if (video.module) modules.add(video.module);
    if (video.bucket) buckets.add(video.bucket);
    if (Array.isArray(video.tags)) {
      video.tags.filter(Boolean).forEach((tag) => tags.add(tag));
    }
  });

  const selectMap = [
    [filterCategory, categories],
    [filterModule, modules],
    [filterBucket, buckets],
    [filterTag, tags],
  ];

  selectMap.forEach(([select, values]) => {
    const currentValue = select.value;
    select.innerHTML = '';
    select.appendChild(createOption(''));
    Array.from(values)
      .sort((a, b) => a.localeCompare(b))
      .forEach((value) => select.appendChild(createOption(value)));
    if (values.has(currentValue)) {
      select.value = currentValue;
    }
  });
}

function matchFilters(video) {
  const matchCategory = !filterCategory.value || video.category === filterCategory.value;
  const matchModule = !filterModule.value || video.module === filterModule.value;
  const matchBucket = !filterBucket.value || video.bucket === filterBucket.value;
  const matchTag =
    !filterTag.value || (Array.isArray(video.tags) && video.tags.includes(filterTag.value));
  return matchCategory && matchModule && matchBucket && matchTag;
}

function createCard(video) {
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <video src="${video.url}" preload="metadata"></video>
    <div class="card-body">
      <h3>${video.originalName}</h3>
      <p>
        ${
          [
            video.category && `分类：${video.category}`,
            video.module && `模块：${video.module}`,
            video.bucket && `桶型：${video.bucket}`,
          ]
            .filter(Boolean)
            .join(' · ') || '暂无分类信息'
        }
      </p>
      <div class="card-controls">
        <div class="tag-container">
          ${Array.isArray(video.tags) && video.tags.length
            ? video.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')
            : '<span class="tag">未打标签</span>'}
        </div>
        <div class="buttons">
          <button class="control-btn" data-action="toggle">播放</button>
          <button class="control-btn" data-action="fullscreen">全屏</button>
        </div>
      </div>
    </div>
  `;
  return card;
}

function renderGallery() {
  gallery.innerHTML = '';
  const fragment = document.createDocumentFragment();
  videos.filter(matchFilters).forEach((video) => {
    fragment.appendChild(createCard(video));
  });
  if (!fragment.childNodes.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = '暂无符合条件的视频，请尝试调整筛选条件。';
    gallery.appendChild(empty);
  } else {
    gallery.appendChild(fragment);
  }
}

function bindVideoControls(card) {
  const video = card.querySelector('video');
  const toggleBtn = card.querySelector('button[data-action="toggle"]');
  const fullscreenBtn = card.querySelector('button[data-action="fullscreen"]');

  toggleBtn.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      toggleBtn.textContent = '暂停';
    } else {
      video.pause();
      toggleBtn.textContent = '播放';
    }
  });

  fullscreenBtn.addEventListener('click', () => {
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
    }
  });
}

async function fetchVideos() {
  const response = await fetch('/api/videos');
  const data = await response.json();
  videos = Array.isArray(data.videos) ? data.videos : [];
  populateFilters();
  renderGallery();
  document.querySelectorAll('.card').forEach(bindVideoControls);
}

function bindFilters() {
  [filterCategory, filterModule, filterBucket, filterTag].forEach((select) => {
    select.addEventListener('change', () => {
      renderGallery();
      document.querySelectorAll('.card').forEach(bindVideoControls);
    });
  });
}

function init() {
  bindFilters();
  fetchVideos();
}

document.addEventListener('DOMContentLoaded', init);

const STORAGE_KEY = 'mingming-intelligence-store-v1';
const SUMMARY_DEFAULT = { group: 'lines', id: 'line-1' };

const baseParameters = [
  { name: '节拍', unit: 's', base: 52 },
  { name: '良率', unit: '%', base: 92 },
  { name: '稼动率', unit: '%', base: 96 },
  { name: '温度', unit: '°C', base: 21 },
  { name: '操作员', unit: '人', base: 4 }
];

const baseProcessSteps = ['来料', '预检', '装配', '检测', '出货'];
const baseModules = [
  { name: '视觉质检', status: 'green' },
  { name: '扭矩控制', status: 'green' },
  { name: '包装工位', status: 'amber' },
  { name: '机器人手臂', status: 'green' }
];

const randomNotes = [
  '维护班次后请确认扭矩参数。',
  '优化完成后需补充参考视频。',
  '站会提醒关注人工投料差异。',
  '下次开机前复盘模块预热表现。'
];

function translateModuleStatus(status) {
  if (status === 'green') return '运行正常';
  if (status === 'amber') return '重点关注';
  if (status === 'red') return '需立即处理';
  return status;
}

const Store = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return this.createDefault();
      }
      const parsed = JSON.parse(raw);
      return this.mergeWithDefault(parsed);
    } catch (error) {
      console.warn('Failed to load store, using defaults', error);
      return this.createDefault();
    }
  },
  save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save store', error);
      Toast.show('无法保存更改，请检查存储空间。', { type: 'error' });
    }
  },
  reset() {
    localStorage.removeItem(STORAGE_KEY);
    return this.createDefault();
  },
  export(state) {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mingming-console.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  async import(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    return this.mergeWithDefault(parsed);
  },
  mergeWithDefault(partial) {
    const defaults = this.createDefault();
    const next = { ...defaults, ...partial };
    next.mode = partial?.mode ?? defaults.mode;
    next.summary = partial?.summary ?? defaults.summary;
    next.lines = mergeEntities(defaults.lines, partial?.lines);
    next.feeds = mergeEntities(defaults.feeds, partial?.feeds);
    return next;
  },
  createDefault() {
    return {
      mode: 'presenter',
      summary: { ...SUMMARY_DEFAULT },
      lines: Array.from({ length: 9 }, (_, index) => createDefaultEntity('line', index)),
      feeds: Array.from({ length: 9 }, (_, index) => createDefaultEntity('feed', index)),
    };
  }
};

function mergeEntities(defaults, incoming) {
  if (!Array.isArray(incoming)) {
    return defaults;
  }
  return defaults.map(entity => {
    const existing = incoming.find(item => item.id === entity.id);
    if (!existing) {
      return entity;
    }
    return {
      ...entity,
      ...existing,
      parameters: existing.parameters ?? entity.parameters,
      process: existing.process ?? entity.process,
      modules: existing.modules ?? entity.modules,
      video: existing.video ?? entity.video,
      stats: existing.stats ?? entity.stats,
      notes: existing.notes ?? entity.notes
    };
  });
}

function createDefaultEntity(type, index) {
  const label = type === 'line' ? `生产线 ${index + 1}` : `供料方式 ${index + 1}`;
  const parameters = baseParameters.map((param, idx) => ({
    id: `${type}-${index + 1}-param-${idx + 1}`,
    name: param.name,
    value: (param.base + index * 2 + idx).toFixed(0),
    unit: param.unit
  }));
  const process = baseProcessSteps.map((step, idx) => ({
    id: `${type}-${index + 1}-step-${idx + 1}`,
    title: `${step} ${index + 1}`,
    owner: idx % 2 === 0 ? '运行' : '质检'
  }));
  const modules = baseModules.map((module, idx) => ({
    id: `${type}-${index + 1}-module-${idx + 1}`,
    name: module.name,
    status: idx === 2 && index % 2 === 0 ? 'amber' : module.status
  }));
  const placeholderVideo = {
    id: `${type}-${index + 1}-video-placeholder`,
    title: '上传录像',
    src: null,
    poster: null,
    createdAt: new Date().toISOString(),
    duration: 0,
    notes: '上传 MP4 文件以开始复盘。',
  };

  return {
    id: `${type}-${index + 1}`,
    type,
    name: label,
    description: `${label} 概览，等待新的视频上传。`,
    parameters,
    process,
    modules,
    stats: {
      status: '待上传',
      duration: '0:00',
      updatedAt: null
    },
    notes: randomNotes[index % randomNotes.length],
    video: {
      activeId: placeholderVideo.id,
      playlist: [placeholderVideo]
    }
  };
}

const Toast = {
  region: document.getElementById('toast-region'),
  show(message, { type = 'info', timeout = 3600 } = {}) {
    if (!this.region) return;
    const toast = document.createElement('div');
    toast.className = `toast${type === 'error' ? ' toast--error' : ''}`;
    toast.textContent = message;
    this.region.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('is-leaving');
      const handleRemove = () => toast.remove();
      toast.addEventListener('transitionend', handleRemove, { once: true });
      setTimeout(handleRemove, 300);
    }, timeout);
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const App = (() => {
  let state = Store.load();
  let selection = { group: 'lines', id: state.lines[0].id };
  let currentVideoElement;

  const refs = {
    shell: document.querySelector('.app-shell'),
    modeButtons: Array.from(document.querySelectorAll('.mode-toggle__btn')),
    dashboardContainers: {
      lines: document.getElementById('lines-dashboard'),
      feeds: document.getElementById('feeds-dashboard')
    },
    summaryToggle: document.getElementById('summary-toggle'),
    paramsList: document.getElementById('params-list'),
    processSvg: document.getElementById('process-svg'),
    processNodes: document.getElementById('process-nodes'),
    modulesList: document.getElementById('modules-list'),
    playlist: document.getElementById('playlist'),
    video: document.getElementById('video-element'),
    videoInput: document.getElementById('video-input'),
    videoUploadBtn: document.getElementById('video-upload-btn'),
    dropzone: document.getElementById('upload-dropzone'),
    metadataToggle: document.querySelector('[data-action="metadata"]'),
    metadataDrawer: document.getElementById('metadata-drawer'),
    metadataClose: document.querySelector('[data-action="close-metadata"]'),
    drawer: {
      params: document.getElementById('drawer-params'),
      process: document.getElementById('drawer-process'),
      modules: document.getElementById('drawer-modules'),
      notes: document.getElementById('drawer-notes')
    },
    saveNotes: document.querySelector('[data-action="save-notes"]'),
    importInput: document.getElementById('import-input'),
    topBarButtons: {
      import: document.querySelector('[data-action="import"]'),
      export: document.querySelector('[data-action="export"]'),
      reset: document.querySelector('[data-action="reset"]')
    },
    paneEditButtons: Array.from(document.querySelectorAll('.pane-edit-btn')),
    videoControls: document.querySelector('.video-controls')
  };

  function init() {
    currentVideoElement = refs.video;
    updateMode(state.mode || 'presenter', { save: false });
    refs.modeButtons.forEach(btn => btn.addEventListener('click', () => updateMode(btn.dataset.mode)));
    bindTopBarActions();
    renderDashboards();
    attachDashboardEvents();
    attachVideoControls();
    attachDropzone();
    attachMetadataDrawer();
    attachPaneEditing();
    selectEntity(selection.group, selection.id);
    window.addEventListener('resize', () => renderProcessFlow(getSelectedEntity()));
  }

  function bindTopBarActions() {
    refs.topBarButtons.import.addEventListener('click', () => refs.importInput.click());
    refs.importInput.addEventListener('change', handleImport);
    refs.topBarButtons.export.addEventListener('click', () => Store.export(state));
    refs.topBarButtons.reset.addEventListener('click', () => {
      if (confirm('确认将所有数据恢复为默认状态？')) {
        state = Store.reset();
        selection = { group: 'lines', id: state.lines[0].id };
        save();
        renderDashboards();
        selectEntity(selection.group, selection.id);
        Toast.show('控制台已恢复默认数据。');
      }
    });
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = await Store.import(file);
      state = imported;
      save();
      renderDashboards();
      selection = { group: 'lines', id: state.lines[0].id };
      selectEntity(selection.group, selection.id);
      Toast.show('导入成功，数据已更新。');
    } catch (error) {
      console.error('Import failed', error);
      Toast.show('导入失败，请确认 JSON 格式正确。', { type: 'error' });
    } finally {
      event.target.value = '';
    }
  }

  function updateMode(mode, { save: shouldSave = true } = {}) {
    state.mode = mode;
    refs.shell.dataset.mode = mode;
    refs.modeButtons.forEach(btn => btn.classList.toggle('is-active', btn.dataset.mode === mode));
    if (shouldSave) {
      save();
      Toast.show(mode === 'editor' ? '已切换至编辑模式。' : '已切换至演示模式。');
    }
    renderProcessNodes(getSelectedEntity());
  }

  function renderDashboards() {
    ['lines', 'feeds'].forEach(group => {
      const container = refs.dashboardContainers[group];
      container.innerHTML = '';
      state[group].forEach(entity => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'dashboard-card';
        card.dataset.id = entity.id;
        card.dataset.group = group;
        card.dataset.status = entity.stats.status || 'Pending';
        card.dataset.summary = String(state.summary?.group === group && state.summary?.id === entity.id);
        card.setAttribute('role', 'listitem');

        const title = document.createElement('span');
        title.className = 'dashboard-card__title';
        title.textContent = entity.name;

        const stat = document.createElement('span');
        stat.className = 'dashboard-card__stat';
        stat.textContent = entity.stats.duration || '0:00';

        const sub = document.createElement('span');
        sub.className = 'dashboard-card__sub';
        sub.textContent = entity.stats.updatedAt ? `更新于 ${formatRelative(entity.stats.updatedAt)}` : '等待视频';

        card.append(title, stat, sub);
        container.appendChild(card);
      });
    });
    refreshActiveCard();
  }

  function attachDashboardEvents() {
    Object.values(refs.dashboardContainers).forEach(container => {
      container.addEventListener('click', event => {
        const card = event.target.closest('.dashboard-card');
        if (!card) return;
        selectEntity(card.dataset.group, card.dataset.id);
      });
    });
  }

  function selectEntity(group, id) {
    selection = { group, id };
    refreshActiveCard();
    const entity = getSelectedEntity();
    refs.summaryToggle.checked = state.summary?.group === group && state.summary?.id === id;
    refs.summaryToggle.onchange = () => toggleSummary(entity);
    renderParameters(entity);
    renderProcessFlow(entity);
    renderModules(entity);
    renderPlaylist(entity);
    renderMetadataDrawer(entity);
    loadVideo(entity);
  }

  function refreshActiveCard() {
    document.querySelectorAll('.dashboard-card').forEach(card => {
      card.classList.toggle('is-active', card.dataset.group === selection.group && card.dataset.id === selection.id);
      card.dataset.summary = String(state.summary?.group === card.dataset.group && state.summary?.id === card.dataset.id);
    });
  }

  function getSelectedEntity() {
    return state[selection.group].find(item => item.id === selection.id);
  }

  function toggleSummary(entity) {
    if (refs.summaryToggle.checked) {
      state.summary = { group: selection.group, id: entity.id };
      Toast.show(`${entity.name} 已设为总览来源。`);
    } else {
      state.summary = { ...SUMMARY_DEFAULT };
      Toast.show('摘要来源已恢复默认。');
    }
    save();
    refreshActiveCard();
  }

  function renderParameters(entity) {
    refs.paramsList.innerHTML = '';
    entity.parameters.forEach(param => {
      const dt = document.createElement('dt');
      dt.textContent = param.name;
      const dd = document.createElement('dd');
      dd.textContent = `${param.value} ${param.unit ?? ''}`.trim();
      refs.paramsList.append(dt, dd);
    });
  }

  function renderProcessFlow(entity) {
    renderProcessNodes(entity);
    renderProcessSvg(entity);
  }

  function renderProcessNodes(entity) {
    refs.processNodes.innerHTML = '';
    const editable = state.mode === 'editor';
    entity.process.forEach(step => {
      const node = document.createElement('div');
      node.className = 'process-node';
      node.tabIndex = 0;
      node.dataset.id = step.id;
      node.draggable = editable;
      const title = document.createElement('div');
      title.className = 'process-node__title';
      title.textContent = step.title;
      const meta = document.createElement('div');
      meta.className = 'process-node__meta';
      meta.textContent = `负责人：${step.owner}`;
      node.append(title, meta);
      refs.processNodes.appendChild(node);
    });
    if (editable) {
      refs.processNodes.querySelectorAll('.process-node').forEach(node => {
        node.addEventListener('dragstart', handleProcessDragStart);
        node.addEventListener('dragover', handleProcessDragOver);
        node.addEventListener('drop', handleProcessDrop);
      });
    }
  }

  function renderProcessSvg(entity) {
    refs.processSvg.innerHTML = '';
    if (!entity.process.length) return;
    const nodes = Array.from(refs.processNodes.children);
    const width = nodes.reduce((acc, node) => acc + node.offsetWidth + 20, 40);
    refs.processSvg.setAttribute('width', width);
    refs.processSvg.innerHTML = '<defs><marker id="arrow-head" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" /></marker></defs>';
    nodes.forEach((node, index) => {
      const rect = node.getBoundingClientRect();
      const containerRect = refs.processNodes.getBoundingClientRect();
      const x = rect.left - containerRect.left + rect.width / 2;
      const y = 70;
      if (index < nodes.length - 1) {
        const nextRect = nodes[index + 1].getBoundingClientRect();
        const nextX = nextRect.left - containerRect.left + nextRect.width / 2;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x} ${y} C ${(x + nextX) / 2} ${y - 40}, ${(x + nextX) / 2} ${y + 40}, ${nextX} ${y}`);
        path.classList.add('process-edge');
        refs.processSvg.appendChild(path);
      }
    });
  }

  function renderModules(entity) {
    refs.modulesList.innerHTML = '';
    entity.modules.forEach(module => {
      const li = document.createElement('li');
      li.className = 'module-item';
      const name = document.createElement('span');
      name.textContent = module.name;
      const status = document.createElement('span');
      status.className = 'module-item__status';
      status.textContent = translateModuleStatus(module.status);
      li.append(name, status);
      refs.modulesList.appendChild(li);
    });
  }

  function renderPlaylist(entity) {
    refs.playlist.innerHTML = '';
    const { playlist, activeId } = entity.video;
    playlist.forEach(item => {
      const card = document.createElement('div');
      card.className = 'playlist-item';
      card.dataset.id = item.id;
      if (item.id === activeId) {
        card.classList.add('is-active');
      }
      const button = document.createElement('button');
      button.type = 'button';
      const thumb = document.createElement('img');
      thumb.className = 'playlist-item__thumb';
      thumb.alt = item.title;
      thumb.src = item.poster || createThumbnailPlaceholder(entity.name);
      const body = document.createElement('div');
      body.className = 'playlist-item__body';
      const title = document.createElement('span');
      title.className = 'playlist-item__title';
      title.textContent = item.title;
      const meta = document.createElement('span');
      meta.className = 'playlist-item__meta';
      meta.textContent = item.duration ? `${item.duration}` : '暂无时长';
      body.append(title, meta);
      button.append(thumb, body);
      button.addEventListener('click', () => {
        entity.video.activeId = item.id;
        save();
        renderPlaylist(entity);
        loadVideo(entity);
      });
      card.appendChild(button);
      refs.playlist.appendChild(card);
    });
  }

  function renderMetadataDrawer(entity) {
    refs.drawer.params.innerHTML = '';
    entity.parameters.forEach(param => {
      const dt = document.createElement('dt');
      dt.textContent = param.name;
      const dd = document.createElement('dd');
      dd.textContent = `${param.value} ${param.unit ?? ''}`.trim();
      refs.drawer.params.append(dt, dd);
    });
    refs.drawer.process.innerHTML = '';
    entity.process.forEach(step => {
      const li = document.createElement('li');
      li.textContent = `${step.title} • 负责人：${step.owner}`;
      refs.drawer.process.appendChild(li);
    });
    refs.drawer.modules.innerHTML = '';
    entity.modules.forEach(module => {
      const li = document.createElement('li');
      li.className = 'module-item';
      li.textContent = `${module.name} – ${translateModuleStatus(module.status)}`;
      refs.drawer.modules.appendChild(li);
    });
    refs.drawer.notes.value = entity.notes || '';
    refs.saveNotes.onclick = () => {
      entity.notes = refs.drawer.notes.value;
      Toast.show('备注已保存。');
      save();
    };
  }

  function attachMetadataDrawer() {
    refs.metadataToggle.addEventListener('click', () => {
      refs.metadataDrawer.hidden = false;
      refs.drawer.notes.focus();
    });
    refs.metadataClose.addEventListener('click', () => {
      refs.metadataDrawer.hidden = true;
    });
    refs.metadataDrawer.addEventListener('click', event => {
      if (event.target === refs.metadataDrawer) {
        refs.metadataDrawer.hidden = true;
      }
    });
  }

  function attachPaneEditing() {
    refs.paneEditButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.mode !== 'editor') {
          Toast.show('请切换到编辑模式后再修改数据。', { type: 'error' });
          return;
        }
        const entity = getSelectedEntity();
        if (btn.dataset.pane === 'parameters') {
          entity.parameters = entity.parameters.map(param => {
            const nextValue = prompt(`请输入 ${param.name} 的新数值`, param.value);
            return nextValue != null ? { ...param, value: nextValue } : param;
          });
          Toast.show('参数已更新。');
        }
        if (btn.dataset.pane === 'process') {
          const newStep = prompt('新增流程节点（留空则跳过）');
          if (newStep) {
            entity.process.push({
              id: `${entity.id}-step-${entity.process.length + 1}`,
              title: newStep,
              owner: '运行'
            });
          }
          Toast.show('流程已更新。');
        }
        if (btn.dataset.pane === 'modules') {
          const moduleName = prompt('新增模块名称（留空则跳过）');
          if (moduleName) {
            entity.modules.push({
              id: `${entity.id}-module-${entity.modules.length + 1}`,
              name: moduleName,
              status: 'green'
            });
          }
          Toast.show('模块已更新。');
        }
        save();
        renderParameters(entity);
        renderProcessFlow(entity);
        renderModules(entity);
        renderMetadataDrawer(entity);
      });
    });
  }

  function attachVideoControls() {
    const video = refs.video;
    const ensureSource = (message = '请先上传视频后再播放。') => {
      const hasSource = Boolean(video.currentSrc || video.src);
      if (!hasSource) {
        Toast.show(message, { type: 'error' });
        return false;
      }
      return true;
    };
    refs.videoControls.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      const control = button.dataset.control;
      if (control === 'play') {
        if (!ensureSource()) return;
        video.play();
      }
      if (control === 'pause') {
        if (!ensureSource('暂无视频可暂停。')) return;
        video.pause();
      }
      if (control === 'mute') {
        video.muted = !video.muted;
        button.textContent = video.muted ? '取消静音' : '静音';
      }
      if (control === 'fullscreen') {
        if (!ensureSource()) return;
        if (video.requestFullscreen) {
          video.requestFullscreen();
        }
      }
      if (control === 'poster') {
        if (!ensureSource()) return;
        capturePoster();
      }
    });
    refs.videoControls.addEventListener('input', event => {
      const target = event.target;
      if (target.matches('[data-control="volume"]')) {
        video.volume = Number(target.value);
      }
      if (target.matches('[data-control="speed"]')) {
        video.playbackRate = Number(target.value);
      }
    });
  }

  function attachDropzone() {
    refs.videoUploadBtn.addEventListener('click', () => refs.videoInput.click());
    refs.videoInput.addEventListener('change', async event => {
      const file = event.target.files?.[0];
      if (file) await ingestVideo(file);
      event.target.value = '';
    });
    ['dragenter', 'dragover'].forEach(eventName => {
      refs.dropzone.addEventListener(eventName, event => {
        event.preventDefault();
        refs.dropzone.classList.add('is-hovered');
      });
    });
    ['dragleave', 'drop'].forEach(eventName => {
      refs.dropzone.addEventListener(eventName, event => {
        event.preventDefault();
        refs.dropzone.classList.remove('is-hovered');
      });
    });
    refs.dropzone.addEventListener('drop', async event => {
      const file = event.dataTransfer?.files?.[0];
      if (file) await ingestVideo(file);
    });
  }

  async function ingestVideo(file) {
    if (state.mode !== 'editor') {
      Toast.show('请切换到编辑模式后再上传视频。', { type: 'error' });
      return;
    }
    if (file.type !== 'video/mp4') {
      Toast.show('仅支持 MP4 文件。', { type: 'error' });
      return;
    }
    const entity = getSelectedEntity();
    const dataUrl = await readFileAsDataURL(file);
    const playlistItem = {
      id: `${entity.id}-video-${Date.now()}`,
      title: file.name.replace(/\.[^.]+$/, ''),
      src: dataUrl,
      poster: null,
      createdAt: new Date().toISOString(),
      duration: 0,
      notes: ''
    };
    entity.video.playlist = entity.video.playlist.filter(item => item.src);
    entity.video.playlist.push(playlistItem);
    entity.video.activeId = playlistItem.id;
    Toast.show(`${file.name} 已加入播放列表。`);
    save();
    renderPlaylist(entity);
    loadVideo(entity);
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function loadVideo(entity) {
    const { playlist, activeId } = entity.video;
    const item = playlist.find(video => video.id === activeId) || playlist[0];
    if (!item) return;
    if (item.src) {
      currentVideoElement.src = item.src;
      currentVideoElement.poster = item.poster || '';
      currentVideoElement.load();
    } else {
      currentVideoElement.removeAttribute('src');
      currentVideoElement.poster = '';
      currentVideoElement.load();
      Toast.show('请先上传 MP4 视频后再播放。', { type: 'error' });
    }
    currentVideoElement.onloadedmetadata = () => {
      const formattedDuration = formatDuration(currentVideoElement.duration);
      item.duration = formattedDuration;
      entity.stats.duration = formattedDuration;
      entity.stats.status = '就绪';
      entity.stats.updatedAt = new Date().toISOString();
      save();
      renderDashboards();
      renderPlaylist(entity);
    };
  }

  async function capturePoster() {
    const entity = getSelectedEntity();
    const { playlist, activeId } = entity.video;
    const item = playlist.find(video => video.id === activeId);
    if (!item || !currentVideoElement.videoWidth) {
      Toast.show('请先播放视频后再截取封面。', { type: 'error' });
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = currentVideoElement.videoWidth;
    canvas.height = currentVideoElement.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(currentVideoElement, 0, 0, canvas.width, canvas.height);
    item.poster = canvas.toDataURL('image/jpeg', 0.75);
    Toast.show('封面已截取。');
    save();
    renderPlaylist(entity);
  }

  function handleProcessDragStart(event) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', event.currentTarget.dataset.id);
  }

  function handleProcessDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleProcessDrop(event) {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text/plain');
    const targetId = event.currentTarget.dataset.id;
    if (draggedId === targetId) return;
    const entity = getSelectedEntity();
    const draggedIndex = entity.process.findIndex(step => step.id === draggedId);
    const targetIndex = entity.process.findIndex(step => step.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const [moved] = entity.process.splice(draggedIndex, 1);
    entity.process.splice(targetIndex, 0, moved);
    save();
    renderProcessFlow(entity);
    renderMetadataDrawer(entity);
    Toast.show('流程顺序已更新。');
  }

  function attachVideoStatsSync(entity) {
    if (!entity) return;
  }

  function attachVideoMetadata() {
    // placeholder to align with spec, metadata handled in loadVideo.
  }

  function attachDropzoneMetadata() {}

  function createThumbnailPlaceholder(label) {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const context = canvas.getContext('2d');
    context.fillStyle = '#0f172a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#2563eb';
    context.font = 'bold 32px Inter';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label.slice(0, 14), canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL('image/png');
  }

  function formatDuration(seconds) {
    if (!seconds || !Number.isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function formatRelative(timestamp) {
    if (!timestamp) return '';
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes} 分钟前`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} 小时前`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} 天前`;
  }

  function save() {
    Store.save(state);
  }

  return { init };
})();

App.init();

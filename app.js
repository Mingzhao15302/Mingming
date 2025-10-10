const STORAGE_KEY = 'mingming-intelligence-store-v1';
const SUMMARY_DEFAULT = { group: 'lines', id: 'line-1' };

const baseParameters = [
  { name: 'Cycle time', unit: 's', base: 52 },
  { name: 'Yield', unit: '%', base: 92 },
  { name: 'Uptime', unit: '%', base: 96 },
  { name: 'Temperature', unit: '°C', base: 21 },
  { name: 'Operators', unit: 'people', base: 4 }
];

const baseProcessSteps = ['Inbound', 'Pre-check', 'Assembly', 'Inspection', 'Dispatch'];
const baseModules = [
  { name: 'Vision QA', status: 'green' },
  { name: 'Torque Control', status: 'green' },
  { name: 'Packaging', status: 'amber' },
  { name: 'Robotics Arm', status: 'green' }
];

const randomNotes = [
  'Confirm torque specs after maintenance shift.',
  'Capture new reference footage after optimization.',
  'Flag manual feed variation in next stand-up.',
  'Review module warmup behavior before next run.'
];

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
      Toast.show('Unable to save changes. Check storage quota.', { type: 'error' });
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
  const label = type === 'line' ? `Line ${index + 1}` : `Feed Method ${index + 1}`;
  const parameters = baseParameters.map((param, idx) => ({
    id: `${type}-${index + 1}-param-${idx + 1}`,
    name: param.name,
    value: (param.base + index * 2 + idx).toFixed(0),
    unit: param.unit
  }));
  const process = baseProcessSteps.map((step, idx) => ({
    id: `${type}-${index + 1}-step-${idx + 1}`,
    title: `${step} ${index + 1}`,
    owner: idx % 2 === 0 ? 'Ops' : 'QA'
  }));
  const modules = baseModules.map((module, idx) => ({
    id: `${type}-${index + 1}-module-${idx + 1}`,
    name: module.name,
    status: idx === 2 && index % 2 === 0 ? 'amber' : module.status
  }));
  const placeholderVideo = {
    id: `${type}-${index + 1}-video-placeholder`,
    title: 'Upload recording',
    src: null,
    poster: null,
    createdAt: new Date().toISOString(),
    duration: 0,
    notes: 'Upload an MP4 to begin the review.',
  };

  return {
    id: `${type}-${index + 1}`,
    type,
    name: label,
    description: `${label} production overview awaiting new footage.`,
    parameters,
    process,
    modules,
    stats: {
      status: 'Awaiting upload',
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
    toast.className = `toast-item text-sm text-slate-700${type === 'error' ? ' toast-item--error text-rose-700' : ''}`;
    toast.textContent = message;
    this.region.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('is-leaving');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
      toast.remove();
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
    shell: document.getElementById('app-shell'),
    modeButtons: Array.from(document.querySelectorAll('[data-mode-button]')),
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
    paneEditButtons: Array.from(document.querySelectorAll('[data-role="pane-edit"]')),
    videoControls: document.getElementById('video-controls')
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
      if (confirm('Reset all data to defaults?')) {
        state = Store.reset();
        selection = { group: 'lines', id: state.lines[0].id };
        save();
        renderDashboards();
        selectEntity(selection.group, selection.id);
        Toast.show('Dashboard reset to default data.');
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
      Toast.show('Import successful. Data refreshed.');
    } catch (error) {
      console.error('Import failed', error);
      Toast.show('Import failed. Ensure JSON is valid.', { type: 'error' });
    } finally {
      event.target.value = '';
    }
  }

  function updateMode(mode, { save: shouldSave = true } = {}) {
    state.mode = mode;
    refs.shell.dataset.mode = mode;
    refs.modeButtons.forEach(btn => {
      const isActive = btn.dataset.mode === mode;
      btn.setAttribute('aria-pressed', String(isActive));
      btn.classList.toggle('bg-blue-600', isActive);
      btn.classList.toggle('text-white', isActive);
      btn.classList.toggle('shadow-md', isActive);
      btn.classList.toggle('text-slate-500', !isActive);
    });
    refs.paneEditButtons.forEach(btn => {
      btn.classList.toggle('hidden', mode === 'presenter');
    });
    if (shouldSave) save();
    renderProcessNodes(getSelectedEntity());
  }

  function renderDashboards() {
    ['lines', 'feeds'].forEach(group => {
      const container = refs.dashboardContainers[group];
      container.innerHTML = '';
      state[group].forEach(entity => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'relative flex flex-col gap-2 rounded-2xl border border-transparent bg-white/95 p-4 text-left shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';
        card.dataset.dashboardCard = 'true';
        card.dataset.id = entity.id;
        card.dataset.group = group;
        card.dataset.status = entity.stats.status || 'Pending';
        card.setAttribute('role', 'listitem');

        const isSummary = state.summary?.group === group && state.summary?.id === entity.id;
        card.dataset.summary = String(isSummary);

        const summaryBadge = document.createElement('span');
        summaryBadge.dataset.summaryBadge = 'true';
        summaryBadge.className = 'pointer-events-none absolute right-3 top-3 rounded-full bg-amber-100 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-amber-700';
        summaryBadge.textContent = 'Summary';
        summaryBadge.hidden = !isSummary;

        const title = document.createElement('span');
        title.className = 'text-sm font-semibold text-slate-900';
        title.textContent = entity.name;

        const stat = document.createElement('span');
        stat.className = 'text-2xl font-bold text-slate-900';
        stat.textContent = entity.stats.duration || '0:00';

        const sub = document.createElement('span');
        sub.className = 'text-xs text-slate-500';
        sub.textContent = entity.stats.updatedAt ? `Updated ${formatRelative(entity.stats.updatedAt)}` : 'Awaiting video';

        const status = document.createElement('span');
        const statusValue = (entity.stats.status || 'Pending').toLowerCase();
        const statusClass = statusValue.includes('ready')
          ? 'text-emerald-600'
          : statusValue.includes('await')
            ? 'text-amber-600'
            : 'text-blue-600';
        status.className = `text-xs font-semibold uppercase tracking-wide ${statusClass}`;
        status.textContent = entity.stats.status || 'Pending';

        card.append(summaryBadge, title, stat, sub, status);
        container.appendChild(card);
      });
    });
    refreshActiveCard();
  }

  function attachDashboardEvents() {
    Object.values(refs.dashboardContainers).forEach(container => {
      container.addEventListener('click', event => {
        const card = event.target.closest('[data-dashboard-card]');
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
    document.querySelectorAll('[data-dashboard-card]').forEach(card => {
      const isActive = card.dataset.group === selection.group && card.dataset.id === selection.id;
      const isSummary = state.summary?.group === card.dataset.group && state.summary?.id === card.dataset.id;
      card.classList.toggle('ring-2', isActive);
      card.classList.toggle('ring-blue-500/60', isActive);
      card.classList.toggle('border-blue-200', isActive);
      card.classList.toggle('ring-amber-400/60', isSummary && !isActive);
      card.classList.toggle('border-amber-200', isSummary && !isActive);
      card.dataset.summary = String(isSummary);
      const badge = card.querySelector('[data-summary-badge]');
      if (badge) {
        badge.hidden = !isSummary;
      }
    });
  }

  function getSelectedEntity() {
    return state[selection.group].find(item => item.id === selection.id);
  }

  function toggleSummary(entity) {
    if (refs.summaryToggle.checked) {
      state.summary = { group: selection.group, id: entity.id };
      Toast.show(`${entity.name} is now the summary source.`);
    } else {
      state.summary = { ...SUMMARY_DEFAULT };
      Toast.show('Summary source reset to default.');
    }
    save();
    refreshActiveCard();
  }

  function renderParameters(entity) {
    refs.paramsList.innerHTML = '';
    entity.parameters.forEach(param => {
      const dt = document.createElement('dt');
      dt.className = 'text-sm font-medium text-slate-500';
      dt.textContent = param.name;
      const dd = document.createElement('dd');
      dd.className = 'text-lg font-semibold text-slate-900';
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
      node.className = 'flex min-w-[160px] flex-col gap-2 rounded-2xl border border-slate-200 bg-white/80 p-4 text-left shadow transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';
      node.dataset.processNode = 'true';
      node.tabIndex = 0;
      node.dataset.id = step.id;
      node.draggable = editable;
      node.classList.toggle('cursor-grab', editable);
      node.classList.toggle('hover:border-blue-500', editable);
      node.classList.toggle('hover:shadow-lg', editable);
      node.classList.toggle('active:cursor-grabbing', editable);
      node.classList.toggle('cursor-default', !editable);
      const title = document.createElement('div');
      title.className = 'text-sm font-semibold text-slate-900';
      title.textContent = step.title;
      const meta = document.createElement('div');
      meta.className = 'text-xs text-slate-500';
      meta.textContent = `Owner: ${step.owner}`;
      node.append(title, meta);
      refs.processNodes.appendChild(node);
    });
    if (editable) {
      refs.processNodes.querySelectorAll('[data-process-node="true"]').forEach(node => {
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
    refs.processSvg.innerHTML = '<defs><marker id="arrow-head" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" /></marker></defs>';
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
      li.className = 'flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm';
      const name = document.createElement('span');
      name.className = 'text-sm font-medium text-slate-700';
      name.textContent = module.name;
      const status = document.createElement('span');
      const statusStyles = {
        green: { label: 'Nominal', className: 'bg-emerald-50 text-emerald-600' },
        amber: { label: 'Watch', className: 'bg-amber-50 text-amber-600' },
        red: { label: 'Check', className: 'bg-rose-50 text-rose-600' }
      };
      const style = statusStyles[module.status] || { label: module.status, className: 'bg-slate-100 text-slate-600' };
      status.className = `rounded-full px-3 py-1 text-xs font-semibold ${style.className}`;
      status.textContent = style.label;
      li.append(name, status);
      refs.modulesList.appendChild(li);
    });
  }

  function renderPlaylist(entity) {
    refs.playlist.innerHTML = '';
    const { playlist, activeId } = entity.video;
    playlist.forEach(item => {
      const card = document.createElement('div');
      card.className = 'overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm transition hover:-translate-y-1 hover:shadow-lg';
      card.dataset.playlistItem = 'true';
      card.dataset.id = item.id;
      const isActive = item.id === activeId;
      if (isActive) {
        card.classList.add('border-blue-200', 'ring-2', 'ring-blue-500/60', 'shadow-lg');
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'flex h-full w-full flex-col text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';
      const thumb = document.createElement('img');
      thumb.className = 'h-28 w-full object-cover';
      thumb.alt = item.title;
      thumb.src = item.poster || createThumbnailPlaceholder(entity.name);
      const body = document.createElement('div');
      body.className = 'flex flex-1 flex-col gap-1 px-4 py-3';
      const title = document.createElement('span');
      title.className = 'text-sm font-semibold text-slate-900';
      title.textContent = item.title;
      const meta = document.createElement('span');
      meta.className = 'text-xs text-slate-500';
      meta.textContent = item.duration ? `${item.duration}` : 'No duration';
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
      dt.className = 'text-xs font-semibold uppercase tracking-wide text-slate-500';
      dt.textContent = param.name;
      const dd = document.createElement('dd');
      dd.className = 'text-sm font-medium text-slate-700';
      dd.textContent = `${param.value} ${param.unit ?? ''}`.trim();
      refs.drawer.params.append(dt, dd);
    });
    refs.drawer.process.innerHTML = '';
    entity.process.forEach(step => {
      const li = document.createElement('li');
      li.className = 'rounded-xl bg-slate-100/80 px-3 py-2';
      li.textContent = `${step.title} • Owner: ${step.owner}`;
      refs.drawer.process.appendChild(li);
    });
    refs.drawer.modules.innerHTML = '';
    entity.modules.forEach(module => {
      const li = document.createElement('li');
      li.className = 'rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-600';
      li.textContent = `${module.name} – ${module.status}`;
      refs.drawer.modules.appendChild(li);
    });
    refs.drawer.notes.value = entity.notes || '';
    refs.saveNotes.onclick = () => {
      entity.notes = refs.drawer.notes.value;
      Toast.show('Notes saved.');
      save();
    };
  }

  function attachMetadataDrawer() {
    refs.metadataToggle.addEventListener('click', () => {
      refs.metadataDrawer.hidden = false;
      refs.metadataToggle.setAttribute('aria-expanded', 'true');
      refs.drawer.notes.focus();
    });
    refs.metadataClose.addEventListener('click', () => {
      refs.metadataDrawer.hidden = true;
      refs.metadataToggle.setAttribute('aria-expanded', 'false');
    });
    refs.metadataDrawer.addEventListener('click', event => {
      if (event.target === refs.metadataDrawer) {
        refs.metadataDrawer.hidden = true;
        refs.metadataToggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !refs.metadataDrawer.hidden) {
        refs.metadataDrawer.hidden = true;
        refs.metadataToggle.setAttribute('aria-expanded', 'false');
        refs.metadataToggle.focus();
      }
    });
  }

  function attachPaneEditing() {
    refs.paneEditButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.mode !== 'editor') {
          Toast.show('Switch to Editor mode to edit metadata.', { type: 'error' });
          return;
        }
        const entity = getSelectedEntity();
        if (btn.dataset.pane === 'parameters') {
          entity.parameters = entity.parameters.map(param => {
            const nextValue = prompt(`Update value for ${param.name}`, param.value);
            return nextValue != null ? { ...param, value: nextValue } : param;
          });
          Toast.show('Parameters updated.');
        }
        if (btn.dataset.pane === 'process') {
          const newStep = prompt('Add new process step (leave blank to skip)');
          if (newStep) {
            entity.process.push({
              id: `${entity.id}-step-${entity.process.length + 1}`,
              title: newStep,
              owner: 'Ops'
            });
          }
          Toast.show('Process updated.');
        }
        if (btn.dataset.pane === 'modules') {
          const moduleName = prompt('Add module name (leave blank to skip)');
          if (moduleName) {
            entity.modules.push({
              id: `${entity.id}-module-${entity.modules.length + 1}`,
              name: moduleName,
              status: 'green'
            });
          }
          Toast.show('Modules updated.');
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
    refs.videoControls.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      const control = button.dataset.control;
      if (control === 'play') video.play();
      if (control === 'pause') video.pause();
      if (control === 'mute') {
        video.muted = !video.muted;
        button.textContent = video.muted ? 'Unmute' : 'Mute';
      }
      if (control === 'fullscreen') {
        if (video.requestFullscreen) {
          video.requestFullscreen();
        }
      }
      if (control === 'poster') {
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
        refs.dropzone.classList.add('ring-2', 'ring-offset-2', 'ring-blue-500', 'bg-blue-50');
      });
    });
    ['dragleave', 'drop'].forEach(eventName => {
      refs.dropzone.addEventListener(eventName, event => {
        event.preventDefault();
        refs.dropzone.classList.remove('ring-2', 'ring-offset-2', 'ring-blue-500', 'bg-blue-50');
      });
    });
    refs.dropzone.addEventListener('drop', async event => {
      const file = event.dataTransfer?.files?.[0];
      if (file) await ingestVideo(file);
    });
  }

  async function ingestVideo(file) {
    if (state.mode !== 'editor') {
      Toast.show('Switch to Editor mode to upload media.', { type: 'error' });
      return;
    }
    if (file.type !== 'video/mp4') {
      Toast.show('Only MP4 files are supported.', { type: 'error' });
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
    Toast.show(`${file.name} added to playlist.`);
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
      Toast.show('Upload an MP4 to begin playback.', { type: 'error' });
    }
    currentVideoElement.onloadedmetadata = () => {
      const formattedDuration = formatDuration(currentVideoElement.duration);
      item.duration = formattedDuration;
      entity.stats.duration = formattedDuration;
      entity.stats.status = 'Ready';
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
      Toast.show('Play the video to capture a poster frame.', { type: 'error' });
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = currentVideoElement.videoWidth;
    canvas.height = currentVideoElement.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(currentVideoElement, 0, 0, canvas.width, canvas.height);
    item.poster = canvas.toDataURL('image/jpeg', 0.75);
    Toast.show('Poster frame captured.');
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
    Toast.show('Process order updated.');
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
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  function save() {
    Store.save(state);
  }

  return { init };
})();

App.init();

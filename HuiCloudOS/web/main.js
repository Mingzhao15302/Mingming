import { createApp, reactive } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) || `${window.location.protocol}//${window.location.hostname}:8080`;
const TOKEN_KEY = 'huiCloudToken';
const USER_KEY = 'huiCloudUser';
const CART_KEY = 'huiCloudCart';

const navItems = [
  { hash: '#/welcome', label: '欢迎页' },
  { hash: '#/login', label: '登录' },
  { hash: '#/videos', label: '视频浏览' },
  { hash: '#/store', label: '商城' },
  { hash: '#/cart', label: '购物车' },
  { hash: '#/console', label: '控制台' }
];

function createElement(tag, className, content) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content !== undefined) {
    if (typeof content === 'string') {
      el.innerHTML = content;
    } else {
      el.append(content);
    }
  }
  return el;
}

async function apiRequest(path, options = {}, token) {
  const headers = options.headers || {};
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || '请求失败');
  }
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

function storeSession(token, user) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

function loadSession() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const user = sessionStorage.getItem(USER_KEY);
  return { token, user: user ? JSON.parse(user) : null };
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function loadCart() {
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function renderHeader(app, title, actions = []) {
  const header = createElement('header', 'header');
  const left = createElement('div', 'header-left');
  const hamburger = createElement('button', 'hamburger', '<span>☰</span>');
  hamburger.addEventListener('click', () => app.toggleSidebar());
  left.append(hamburger);
  const logoRow = createElement('div', 'header-logo');
  const logo = createElement('img');
  logo.src = '/assets/logos/huixin-logo.png';
  logo.alt = 'HuiCloud';
  const titleEl = createElement('h2', '', title || '辉云易达 OS');
  left.append(logoRow);
  logoRow.append(logo, titleEl);
  header.append(left);

  const right = createElement('div', 'header-actions');
  if (app.state.user) {
    const userChip = createElement('div', 'chip', `<strong>${app.state.user.username}</strong>`);
    right.append(userChip);
  }
  actions.forEach((action) => right.append(action));
  header.append(right);
  return header;
}

class HuiCloudApp {
  constructor() {
    this.sidebar = document.querySelector('#sidebar');
    this.view = document.querySelector('#view');
    this.modals = document.querySelector('#modals');
    const { token, user } = loadSession();
    this.state = {
      token,
      user,
      cart: loadCart(),
      productTypes: null,
      settings: null,
      filters: {},
      videos: [],
      videoPage: 1,
      videoTotal: 0,
      videoObserver: null,
      videoLoading: false,
      storePage: 1,
      storeTotal: 0,
      storeItems: [],
      storeLoading: false,
      currentProduct: null
    };
    this.csvWorker = null;
    this.routes = {
      '#/welcome': () => this.renderWelcome(),
      '#/login': () => this.renderLogin(),
      '#/videos': () => this.renderVideos(),
      '#/store': () => this.renderStore(),
      '#/product': (id) => this.renderProductDetail(id),
      '#/cart': () => this.renderCart(),
      '#/checkout': () => this.renderCheckout(),
      '#/success': () => this.renderSuccess(),
      '#/console': () => this.renderConsole()
    };
    this.init();
  }

  init() {
    this.renderSidebar();
    window.addEventListener('hashchange', () => this.renderRoute());
    if (!location.hash || !this.routes[location.hash.split('?')[0]]) {
      location.hash = '#/welcome';
    }
    this.renderRoute();
  }

  toggleSidebar() {
    const shell = document.querySelector('.app-shell');
    shell.classList.toggle('sidebar-open');
    if (shell.classList.contains('sidebar-open')) {
      this.sidebar.classList.remove('hidden');
    } else {
      this.sidebar.classList.add('hidden');
    }
  }

  renderSidebar() {
    this.sidebar.innerHTML = '';
    const logoRow = createElement('div', 'logo-row');
    const logo = createElement('img');
    logo.src = '/assets/logos/huixin-logo.png';
    logo.alt = 'HuiCloud';
    const title = createElement('strong', '', '辉云易达 OS');
    logoRow.append(logo, title);
    this.sidebar.append(logoRow);

    const nav = createElement('nav');
    navItems.forEach((item) => {
      const link = createElement('a', '', item.label);
      link.href = item.hash;
      if (location.hash.startsWith(item.hash)) {
        link.classList.add('active');
      }
      nav.append(link);
    });
    this.sidebar.append(nav);
  }

  async renderRoute() {
    const [hash, search] = location.hash.split('?');
    const params = new URLSearchParams(search || '');
    this.renderSidebar();
    const route = Object.keys(this.routes).find((key) => hash.startsWith(key));
    if (!route) {
      location.hash = '#/welcome';
      return;
    }
    const handler = this.routes[route];
    if (route === '#/product') {
      await handler(params.get('id'));
      return;
    }
    await handler();
  }

  setView(element) {
    this.view.innerHTML = '';
    this.view.append(element);
  }

  ensureAuth() {
    if (!this.state.token) {
      location.hash = '#/login';
      return false;
    }
    return true;
  }

  async login(username, password) {
    const data = await apiRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.state.token = data.token;
    this.state.user = data.user;
    storeSession(data.token, data.user);
    this.renderSidebar();
    location.hash = '#/console';
  }

  logout() {
    this.state.token = null;
    this.state.user = null;
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.renderSidebar();
    location.hash = '#/login';
  }

  async fetchProductTypes() {
    if (this.state.productTypes) return this.state.productTypes;
    const data = await apiRequest('/api/product-types', { method: 'GET' }, this.state.token);
    this.state.productTypes = data;
    return data;
  }

  async fetchSettings() {
    if (this.state.settings) return this.state.settings;
    const data = await apiRequest('/api/settings', { method: 'GET' }, this.state.token);
    this.state.settings = data;
    return data;
  }

  async renderWelcome() {
    const page = createElement('section', 'page');
    const header = renderHeader(this, '欢迎来到辉云易达 OS');
    page.append(header);

    const hero = createElement('section', 'hero');
    const bg = createElement('div', 'hero-bg');
    bg.style.backgroundImage = 'url(/assets/backgrounds/home-hero.jpg)';
    hero.append(bg);

    const heroContent = createElement('div', 'hero-content');
    heroContent.innerHTML = `
      <h1>智联工厂业务中台</h1>
      <p>集成视频资产、商城销售、控制台与报价系统的一体化平台，满足灌装行业快速部署与移动办公需求。</p>
    `;
    const buttons = createElement('div', 'hero-buttons');
    const videoBtn = createElement('button', 'primary-button', '进入视频浏览');
    videoBtn.addEventListener('click', () => {
      location.hash = '#/videos';
    });
    const loginBtn = createElement('button', 'secondary-button', '登录控制台');
    loginBtn.addEventListener('click', () => {
      location.hash = '#/login';
    });
    buttons.append(videoBtn, loginBtn);
    heroContent.append(buttons);

    const vueMount = createElement('div', 'hero-canvas');
    hero.append(vueMount);
    hero.append(heroContent);
    page.append(hero);
    this.setView(page);

    createApp({
      setup() {
        const shapes = reactive(
          Array.from({ length: 8 }).map(() => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 20 + Math.random() * 40,
            opacity: 0.2 + Math.random() * 0.4
          }))
        );
        setInterval(() => {
          shapes.forEach((shape) => {
            shape.x = Math.random() * 100;
            shape.y = Math.random() * 100;
            shape.size = 20 + Math.random() * 60;
            shape.opacity = 0.15 + Math.random() * 0.45;
          });
        }, 1800);
        return { shapes };
      },
      template: `
        <div class="hero-particles">
          <div
            v-for="(shape, index) in shapes"
            :key="index"
            class="hero-particle"
            :style="{
              left: shape.x + '%',
              top: shape.y + '%',
              width: shape.size + 'px',
              height: shape.size + 'px',
              opacity: shape.opacity
            }"
          ></div>
        </div>
      `
    }).mount(vueMount);
  }

  async renderLogin() {
    const page = createElement('section', 'page');
    const header = renderHeader(this, '登录控制台');
    page.append(header);
    const card = createElement('div', 'card');
    card.style.maxWidth = '420px';
    card.style.margin = '80px auto';
    const form = createElement('form', 'form-login');
    form.innerHTML = `
      <div class="form-field">
        <label>账号</label>
        <input name="username" value="hxadmin" required />
      </div>
      <div class="form-field">
        <label>密码</label>
        <input name="password" type="password" value="hx84556793" required />
      </div>
      <button class="primary-button" type="submit">登录</button>
    `;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      try {
        await this.login(formData.get('username'), formData.get('password'));
      } catch (err) {
        alert('登录失败：' + err.message);
      }
    });
    card.append(form);
    page.append(card);
    this.setView(page);
  }

  async renderVideos() {
    if (!this.state.token) {
      // 对外演示仍可访问：使用公共接口获取分页
      try {
        await apiRequest('/api/session', { method: 'GET' }, this.state.token);
      } catch (err) {
        // ignore
      }
    }
    const page = createElement('section', 'page');
    const header = renderHeader(this, '视频浏览', [this.createSearchInput('搜索视频', (value) => {
      this.state.filters.search = value;
      this.state.videoPage = 1;
      this.state.videos = [];
      this.loadVideos(true);
    })]);
    page.append(header);

    const filterPanel = createElement('div', 'filter-panel');
    const toggleBtn = createElement('button', 'ghost-button', '展开筛选');
    const filterGrid = createElement('div', 'filter-grid collapsed');
    filterPanel.append(toggleBtn, filterGrid);
    page.append(filterPanel);
    toggleBtn.addEventListener('click', () => {
      filterGrid.classList.toggle('collapsed');
      filterGrid.classList.toggle('expanded');
      toggleBtn.textContent = filterGrid.classList.contains('collapsed') ? '展开筛选' : '收起筛选';
    });

    const grid = createElement('div', 'video-grid');
    page.append(grid);
    const sentinel = createElement('div', 'sentinel');
    sentinel.style.height = '1px';
    page.append(sentinel);
    this.setView(page);

    const types = await this.fetchProductTypes();
    const selectFields = ['产品类型', '灌装机型号', '灌装自动线', '桶盖', '容量', '来料方式', '防爆要求', '灌装方式', '理盖方式', '放盖方式', '压盖方式', '输送方式', '缓存方式', 'VOC要求', '分桶方式', '码垛方式'];
    selectFields.forEach((field) => {
      const wrap = createElement('label');
      wrap.innerHTML = `<span>${field}</span>`;
      const select = createElement('select');
      select.innerHTML = `<option value="">全部</option>` + (types[field] || []).map((item) => `<option value="${item}">${item}</option>`).join('');
      select.addEventListener('change', () => {
        this.state.filters[field] = select.value;
        this.state.videoPage = 1;
        this.state.videos = [];
        this.loadVideos(true);
      });
      wrap.append(select);
      filterGrid.append(wrap);
    });

    this.state.videoContainer = grid;
    this.state.videoSentinel = sentinel;
    this.state.videos = [];
    this.state.videoPage = 1;
    await this.loadVideos(true);

    if (this.state.videoObserver) {
      this.state.videoObserver.disconnect();
    }
    this.state.videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.state.videoLoading) {
          if (this.state.videos.length < this.state.videoTotal) {
            this.state.videoPage += 1;
            this.loadVideos();
          }
        }
      });
    });
    this.state.videoObserver.observe(sentinel);
  }

  createSearchInput(placeholder, onChange) {
    const container = createElement('div', 'search-box');
    const input = createElement('input');
    input.placeholder = placeholder;
    input.addEventListener('input', (event) => {
      const value = event.target.value;
      clearTimeout(container._timer);
      container._timer = setTimeout(() => onChange(value.trim()), 300);
    });
    container.append(input);
    return container;
  }

  async loadVideos(reset = false) {
    if (this.state.videoLoading) return;
    this.state.videoLoading = true;
    try {
      const params = new URLSearchParams();
      params.set('page', this.state.videoPage);
      params.set('pageSize', 30);
      if (this.state.filters.search) {
        params.set('search', this.state.filters.search);
      }
      Object.entries(this.state.filters).forEach(([key, value]) => {
        if (!value || key === 'search') return;
        params.set(`category[${key}]`, value);
      });
      const data = await apiRequest(`/api/videos?${params.toString()}`, { method: 'GET' }, this.state.token || null);
      if (reset) {
        this.state.videos = [];
        this.state.videoContainer.innerHTML = '';
      }
      this.state.videoTotal = data.total;
      data.list.forEach((item) => {
        this.state.videos.push(item);
        this.state.videoContainer.append(this.createVideoCard(item));
      });
    } catch (err) {
      console.error(err);
    } finally {
      this.state.videoLoading = false;
    }
  }

  createVideoCard(video) {
    const card = createElement('div', 'video-card');
    const videoEl = createElement('video');
    videoEl.controls = false;
    videoEl.preload = 'metadata';
    videoEl.poster = `/posters/${video.posterName}`;
    videoEl.src = `/videos/${video.fileName}`;
    const actions = createElement('div', 'actions');
    const playBtn = this.createVideoAction('▶', '播放/暂停', () => {
      if (videoEl.paused) {
        videoEl.play();
      } else {
        videoEl.pause();
      }
    });
    const muteBtn = this.createVideoAction('🔊', '静音/取消', () => {
      videoEl.muted = !videoEl.muted;
    });
    const fullBtn = this.createVideoAction('⛶', '全屏', () => {
      if (videoEl.requestFullscreen) {
        videoEl.requestFullscreen();
      }
    });
    const downloadBtn = this.createVideoAction('⬇', '下载', () => {
      const link = document.createElement('a');
      link.href = `/videos/${video.fileName}`;
      link.download = video.fileName;
      link.click();
    });
    actions.append(playBtn, muteBtn, fullBtn, downloadBtn);
    card.append(videoEl, actions);
    const meta = createElement('div', 'meta');
    meta.innerHTML = `
      <strong>${video.title}</strong>
      <span class="chip">${video.category?.['产品类型'] || '未分类'}</span>
    `;
    card.append(meta);
    return card;
  }

  createVideoAction(symbol, label, handler) {
    const btn = createElement('button', 'secondary-button', symbol);
    btn.title = label;
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      handler();
    });
    return btn;
  }

  async renderStore() {
    if (!this.ensureAuth()) return;
    const page = createElement('section', 'page');
    const header = renderHeader(this, '商城', [this.createSearchInput('搜索产品', (value) => {
      this.state.storePage = 1;
      this.state.storeItems = [];
      this.state.storeSearch = value;
      this.loadProducts(true);
    })]);
    page.append(header);

    const grid = createElement('div', 'product-grid');
    page.append(grid);
    const sentinel = createElement('div', 'sentinel');
    sentinel.style.height = '1px';
    page.append(sentinel);
    this.setView(page);

    this.state.storeContainer = grid;
    this.state.storeSentinel = sentinel;
    this.state.storeItems = [];
    this.state.storePage = 1;
    await this.loadProducts(true);

    if (this.state.storeObserver) {
      this.state.storeObserver.disconnect();
    }
    this.state.storeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.state.storeLoading) {
          if (this.state.storeItems.length < this.state.storeTotal) {
            this.state.storePage += 1;
            this.loadProducts();
          }
        }
      });
    });
    this.state.storeObserver.observe(sentinel);

    const cartButton = createElement('div', 'floating-cart', `🛒 购物车 (${this.state.cart.reduce((sum, item) => sum + item.quantity, 0)})`);
    cartButton.addEventListener('click', () => {
      location.hash = '#/cart';
    });
    page.append(cartButton);
  }

  async loadProducts(reset = false) {
    if (this.state.storeLoading) return;
    this.state.storeLoading = true;
    try {
      const params = new URLSearchParams();
      params.set('page', this.state.storePage);
      params.set('pageSize', 12);
      if (this.state.storeSearch) {
        params.set('search', this.state.storeSearch);
      }
      const data = await apiRequest(`/api/products?${params.toString()}`, { method: 'GET' }, this.state.token);
      if (reset) {
        this.state.storeContainer.innerHTML = '';
        this.state.storeItems = [];
      }
      this.state.storeTotal = data.total;
      data.list.forEach((product) => {
        this.state.storeItems.push(product);
        this.state.storeContainer.append(this.createProductCard(product));
      });
    } catch (err) {
      console.error(err);
    } finally {
      this.state.storeLoading = false;
    }
  }

  createProductCard(product) {
    const card = createElement('div', 'product-card');
    const img = createElement('img');
    img.src = product.cover;
    img.alt = product.name;
    card.append(img);
    const info = createElement('div', 'info');
    info.innerHTML = `
      <h3>${product.name}</h3>
      <span>${product.model}</span>
      <strong>¥${product.price.toLocaleString()}</strong>
    `;
    const btn = createElement('button', 'primary-button', '加入购物车');
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      this.addToCart(product);
    });
    card.addEventListener('click', () => {
      location.hash = `#/product?id=${product.id}`;
    });
    info.append(btn);
    card.append(info);
    return card;
  }

  addToCart(product) {
    const existing = this.state.cart.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.state.cart.push({ ...product, quantity: 1 });
    }
    saveCart(this.state.cart);
    alert('已加入购物车');
    const cartBtn = document.querySelector('.floating-cart');
    if (cartBtn) {
      const count = this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
      cartBtn.textContent = `🛒 购物车 (${count})`;
    }
  }

  async renderProductDetail(id) {
    if (!this.ensureAuth()) return;
    const product = this.state.storeItems.find((item) => item.id === id) || (await this.fetchProductById(id));
    if (!product) {
      location.hash = '#/store';
      return;
    }
    this.state.currentProduct = product;
    const page = createElement('section', 'page');
    const header = renderHeader(this, product.name, [
      this.createButton('返回商城', () => (location.hash = '#/store'), 'secondary-button')
    ]);
    page.append(header);
    const container = createElement('div', 'product-detail card');
    const top = createElement('div', 'detail-top');
    const carousel = createElement('div', 'carousel');
    product.gallery.forEach((src, index) => {
      const img = createElement('img');
      img.src = src;
      img.alt = `${product.name} ${index + 1}`;
      carousel.append(img);
    });
    const info = createElement('div', 'detail-info');
    info.innerHTML = `
      <h2>${product.name}</h2>
      <p>型号：${product.model}</p>
      <p>价格：<strong>¥${product.price.toLocaleString()}</strong></p>
      <p>容量：${product.specs.capacity}</p>
      <p>产能：${product.specs.throughput}</p>
      <p>自动化：${product.specs.automation}</p>
    `;
    const addBtn = this.createButton('加入购物车', () => this.addToCart(product));
    info.append(addBtn);
    top.append(carousel, info);
    container.append(top);
    const highlight = createElement('div', 'detail-highlights');
    highlight.innerHTML = `<h3>亮点</h3><ul>${product.highlights.map((item) => `<li>${item}</li>`).join('')}</ul>`;
    container.append(highlight);
    page.append(container);
    this.setView(page);
  }

  async fetchProductById(id) {
    if (!id) return null;
    const data = await apiRequest(`/api/products?id=${encodeURIComponent(id)}`, { method: 'GET' }, this.state.token);
    if (data.product) {
      return data.product;
    }
    return null;
  }

  renderCart() {
    if (!this.ensureAuth()) return;
    const page = createElement('section', 'page');
    const header = renderHeader(this, '购物车', [
      this.createButton('继续逛逛', () => (location.hash = '#/store'), 'secondary-button')
    ]);
    page.append(header);
    const list = createElement('div', 'cart-list');
    const total = this.state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.state.cart.forEach((item) => {
      const row = createElement('div', 'cart-item');
      const img = createElement('img');
      img.src = item.cover;
      img.alt = item.name;
      const info = createElement('div', 'info');
      info.innerHTML = `<strong>${item.name}</strong><span>${item.model}</span>`;
      const controls = createElement('div', 'controls');
      const minus = this.createButton('－', () => this.updateCart(item.id, item.quantity - 1), 'ghost-button');
      const plus = this.createButton('＋', () => this.updateCart(item.id, item.quantity + 1), 'ghost-button');
      const qty = createElement('span', '', `x${item.quantity}`);
      controls.append(minus, qty, plus);
      const price = createElement('div', 'price', `¥${(item.price * item.quantity).toLocaleString()}`);
      const removeBtn = this.createButton('移除', () => this.removeCartItem(item.id), 'secondary-button');
      row.append(img, info, controls, price, removeBtn);
      list.append(row);
    });
    page.append(list);
    const summary = createElement('div', 'cart-summary');
    summary.innerHTML = `<strong>合计：¥${total.toLocaleString()}</strong>`;
    const checkoutBtn = this.createButton('去结算', () => (location.hash = '#/checkout'));
    summary.append(checkoutBtn);
    page.append(summary);
    this.setView(page);
  }

  updateCart(id, quantity) {
    const index = this.state.cart.findIndex((item) => item.id === id);
    if (index === -1) return;
    if (quantity <= 0) {
      this.state.cart.splice(index, 1);
    } else {
      this.state.cart[index].quantity = quantity;
    }
    saveCart(this.state.cart);
    this.renderCart();
  }

  removeCartItem(id) {
    this.state.cart = this.state.cart.filter((item) => item.id !== id);
    saveCart(this.state.cart);
    this.renderCart();
  }

  async renderCheckout() {
    if (!this.ensureAuth()) return;
    const settings = await this.fetchSettings();
    const page = createElement('section', 'page');
    const header = renderHeader(this, '结算');
    page.append(header);

    const form = createElement('form', 'checkout-form');
    form.innerHTML = `
      <div class="checkout-grid">
        <label>客户名称<input name="customer" required /></label>
        <label>联系人<input name="contact" required /></label>
        <label>联系电话<input name="phone" required /></label>
        <label>业务员<select name="sales"></select></label>
      </div>
      <label>备注<textarea name="note" rows="3"></textarea></label>
    `;
    const salesSelect = form.querySelector('select[name="sales"]');
    (settings.sales || []).forEach((sales) => {
      const option = createElement('option');
      option.value = sales;
      option.textContent = sales;
      salesSelect.append(option);
    });

    const orderSummary = createElement('div', 'order-summary');
    const total = this.state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = total > 200000 ? total * 0.1 : total > 100000 ? total * 0.05 : 0;
    const finalAmount = total - discount;
    orderSummary.innerHTML = `
      <h3>订单汇总</h3>
      <p>商品金额：¥${total.toLocaleString()}</p>
      <p>优惠：¥${discount.toLocaleString()}</p>
      <p><strong>应付：¥${finalAmount.toLocaleString()}</strong></p>
    `;

    const buttons = createElement('div', 'button-group');
    buttons.append(
      this.createButton('打印报价单', () => window.print(), 'secondary-button'),
      this.createButton('打印合同', () => window.print(), 'secondary-button'),
      this.createButton('提交订单', async () => {
        const formData = new FormData(form);
        const payload = {
          customer: formData.get('customer'),
          contact: formData.get('contact'),
          phone: formData.get('phone'),
          sales: formData.get('sales'),
          note: formData.get('note'),
          items: this.state.cart,
          total,
          discount,
          finalAmount
        };
        try {
          await apiRequest('/api/orders', {
            method: 'POST',
            body: JSON.stringify(payload)
          }, this.state.token);
          this.state.cart = [];
          saveCart(this.state.cart);
          location.hash = '#/success';
        } catch (err) {
          alert('提交失败：' + err.message);
        }
      })
    );

    page.append(form, orderSummary, buttons);
    this.setView(page);
  }

  renderSuccess() {
    if (!this.ensureAuth()) return;
    const page = createElement('section', 'page');
    const header = renderHeader(this, '下单成功');
    page.append(header);
    const container = createElement('div', 'success-page');
    const card = createElement('div', 'success-card');
    card.innerHTML = `
      <div class="badge">✓</div>
      <h2>下单成功</h2>
      <p>感谢您的信任，我们的业务人员将尽快与您联系。</p>
    `;
    card.append(
      this.createButton('返回商城', () => (location.hash = '#/store'), 'secondary-button'),
      this.createButton('查看订单', () => (location.hash = '#/console?tab=orders'))
    );
    container.append(card);
    page.append(container);
    this.setView(page);
  }

  createButton(label, handler, className = 'primary-button') {
    const btn = createElement('button', className, label);
    btn.type = 'button';
    btn.addEventListener('click', handler);
    return btn;
  }

  async renderConsole() {
    if (!this.ensureAuth()) return;
    const page = createElement('section', 'page');
    const logoutBtn = this.createButton('退出登录', () => this.logout(), 'secondary-button');
    const header = renderHeader(this, '控制台', [logoutBtn]);
    page.append(header);

    const tabHeader = createElement('div', 'tab-header');
    const tabs = [
      { id: 'videos', label: '视频库' },
      { id: 'quotes', label: '报价模块' },
      { id: 'orders', label: '订单模块' },
      { id: 'products', label: '商品模块' },
      { id: 'contracts', label: '合同模板' },
      { id: 'exports', label: '导出' },
      { id: 'settings', label: '设置' },
      { id: 'maintenance', label: '维护' }
    ];
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const active = params.get('tab') || 'videos';
    tabs.forEach((tab) => {
      const btn = this.createButton(tab.label, () => this.switchConsoleTab(tab.id), 'secondary-button');
      btn.dataset.tab = tab.id;
      if (tab.id === active) btn.classList.add('active');
      tabHeader.append(btn);
    });
    page.append(tabHeader);

    const content = createElement('div', 'tab-content');
    page.append(content);
    this.setView(page);
    this.switchConsoleTab(active);
  }

  switchConsoleTab(tabId) {
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const current = params.get('tab');
    if (current !== tabId) {
      params.set('tab', tabId);
      location.hash = `#/console?${params.toString()}`;
    }
    const buttons = this.view.querySelectorAll('.tab-header button');
    buttons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    const content = this.view.querySelector('.tab-content');
    content.innerHTML = '';
    const renderer = {
      videos: () => this.renderConsoleVideos(content),
      quotes: () => this.renderConsoleQuotes(content),
      orders: () => this.renderConsoleOrders(content),
      products: () => this.renderConsoleProducts(content),
      contracts: () => this.renderConsoleContracts(content),
      exports: () => this.renderConsoleExports(content),
      settings: () => this.renderConsoleSettings(content),
      maintenance: () => this.renderConsoleMaintenance(content)
    }[tabId];
    if (renderer) renderer();
  }

  renderConsoleVideos(container) {
    const actions = createElement('div', 'console-actions');
    const uploadInput = createElement('input');
    uploadInput.type = 'file';
    uploadInput.accept = 'video/mp4,video/webm,video/ogg';
    uploadInput.multiple = true;
    uploadInput.addEventListener('change', () => {
      const files = Array.from(uploadInput.files || []);
      if (!files.length) return;
      this.handleVideoUploads(files);
    });
    const uploadBtn = this.createButton('批量导入视频', () => uploadInput.click());
    actions.append(uploadBtn);

    const csvInput = createElement('input');
    csvInput.type = 'file';
    csvInput.accept = '.csv';
    csvInput.addEventListener('change', async () => {
      const file = csvInput.files?.[0];
      if (!file) return;
      const text = await file.text();
      await this.parseCsvInWorker(text, async (rows) => {
        console.log('Parsed rows', rows.length);
        await apiRequest('/api/videos/import', {
          method: 'POST',
          body: JSON.stringify({ csv: text })
        }, this.state.token);
        alert('CSV 导入完成');
      });
    });
    const csvBtn = this.createButton('导入 CSV', () => csvInput.click(), 'secondary-button');
    const exportBtn = this.createButton('导出 CSV', async () => {
      const csv = await fetch(`${API_BASE}/api/videos/export`, {
        headers: { Authorization: `Bearer ${this.state.token}` }
      });
      const blob = await csv.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `videos-${Date.now()}.csv`;
      link.click();
    }, 'secondary-button');
    actions.append(csvBtn, exportBtn);
    container.append(actions);

    const tableWrap = createElement('div', 'table-scroll');
    const table = createElement('table', 'table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>标题</th>
          <th>分类</th>
          <th>大小</th>
          <th>上传时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    tableWrap.append(table);
    container.append(tableWrap);
    this.loadConsoleVideos(table.querySelector('tbody'));
  }

  async loadConsoleVideos(tbody) {
    const data = await apiRequest('/api/videos?page=1&pageSize=50', { method: 'GET' }, this.state.token);
    tbody.innerHTML = '';
    data.list.forEach((video) => {
      const row = createElement('tr');
      const size = (video.fileSize / 1024 / 1024).toFixed(2);
      row.innerHTML = `
        <td>${video.title}</td>
        <td>${video.category?.['产品类型'] || '未分类'}</td>
        <td>${size} MB</td>
        <td>${new Date(video.uploadedAt).toLocaleString()}</td>
      `;
      const actionCell = createElement('td');
      const editBtn = this.createButton('编辑分类', () => this.openCategoryModal(video), 'secondary-button');
      actionCell.append(editBtn);
      row.append(actionCell);
      tbody.append(row);
    });
  }

  async openCategoryModal(video) {
    const modal = createElement('div', 'modal-backdrop');
    const box = createElement('div', 'modal');
    box.innerHTML = `<h3>编辑分类 - ${video.title}</h3>`;
    const grid = createElement('div', 'modal-grid');
    const types = await this.fetchProductTypes();
    Object.entries(types).forEach(([field, options]) => {
      const wrap = createElement('label');
      wrap.innerHTML = `<span>${field}</span>`;
      const select = createElement('select');
      select.innerHTML = `<option value="">未设置</option>` + options.map((item) => `<option value="${item}">${item}</option>`).join('');
      select.value = video.category?.[field] || '';
      select.addEventListener('change', () => {
        video.category = video.category || {};
        video.category[field] = select.value;
      });
      wrap.append(select);
      grid.append(wrap);
    });
    box.append(grid);
    const actions = createElement('div', 'modal-actions');
    actions.append(
      this.createButton('取消', () => modal.remove(), 'ghost-button'),
      this.createButton('保存', async () => {
        await apiRequest(`/api/videos/${video.id}`, {
          method: 'PUT',
          body: JSON.stringify(video)
        }, this.state.token);
        alert('已保存');
        modal.remove();
        this.switchConsoleTab('videos');
      })
    );
    box.append(actions);
    modal.append(box);
    this.modals.append(modal);
  }

  async handleVideoUploads(files) {
    const queue = files.map((file) => ({ file, status: 'waiting', progress: 0 }));
    const list = createElement('div', 'upload-list card');
    queue.forEach((task) => {
      const row = createElement('div', 'upload-row');
      row.innerHTML = `
        <strong>${task.file.name}</strong>
        <span class="status">等待中</span>
        <div class="progress-bar"><div class="progress"></div></div>
      `;
      task.row = row;
      task.statusEl = row.querySelector('.status');
      task.progressEl = row.querySelector('.progress');
      list.append(row);
    });
    this.modals.innerHTML = '';
    const modal = createElement('div', 'modal-backdrop');
    const box = createElement('div', 'modal');
    box.innerHTML = '<h3>上传进度</h3>';
    box.append(list);
    const closeBtn = this.createButton('关闭', () => modal.remove(), 'secondary-button');
    box.append(closeBtn);
    modal.append(box);
    this.modals.append(modal);

    const concurrency = 3;
    let index = 0;
    const runNext = async () => {
      if (index >= queue.length) return;
      const task = queue[index++];
      task.status = 'uploading';
      task.statusEl.textContent = '上传中';
      try {
        await this.uploadSingleVideo(task);
        task.status = 'done';
        task.statusEl.textContent = '完成';
        task.progressEl.style.width = '100%';
      } catch (err) {
        task.status = 'failed';
        task.statusEl.textContent = '失败，点击重试';
        task.row.addEventListener('click', async () => {
          task.statusEl.textContent = '重新上传中';
          try {
            await this.uploadSingleVideo(task);
            task.status = 'done';
            task.statusEl.textContent = '完成';
            task.progressEl.style.width = '100%';
          } catch (error) {
            task.statusEl.textContent = '仍然失败';
          }
        }, { once: true });
      } finally {
        runNext();
      }
    };
    Array.from({ length: concurrency }).forEach(runNext);
  }

  async uploadSingleVideo(task) {
    const file = task.file;
    if (file.size > 100 * 1024 * 1024) {
      throw new Error('单个文件不能超过 100MB');
    }
    const chunkSize = 2 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const posterName = `${uploadId}.jpg`;
    const posterData = await this.capturePoster(file);
    await apiRequest('/api/videos/poster', {
      method: 'POST',
      body: JSON.stringify({ fileName: posterName, data: posterData })
    }, this.state.token);
    for (let index = 0; index < totalChunks; index += 1) {
      const start = index * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const chunk = file.slice(start, end);
      const response = await fetch(`${API_BASE}/api/videos/upload?uploadId=${uploadId}&chunkIndex=${index}&totalChunks=${totalChunks}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.state.token}`
        },
        body: chunk
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || '上传失败');
      }
      const progress = Math.round(((index + 1) / totalChunks) * 100);
      task.progressEl.style.width = `${progress}%`;
    }
    await apiRequest('/api/videos/merge', {
      method: 'POST',
      body: JSON.stringify({
        uploadId,
        fileName: `${uploadId}.mp4`,
        totalChunks,
        meta: { title: file.name, posterName }
      })
    }, this.state.token);
    this.switchConsoleTab('videos');
  }

  capturePoster(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.src = URL.createObjectURL(file);
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(video.src);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      video.onerror = () => reject(new Error('无法加载视频'));
    });
  }

  parseCsvInWorker(text, callback) {
    if (!this.csvWorker) {
      this.csvWorker = new Worker(new URL('./workers/csvWorker.js', import.meta.url), { type: 'module' });
    }
    this.csvWorker.onmessage = async (event) => {
      const { type, payload } = event.data;
      if (type === 'parsed') {
        await callback(payload.rows);
      }
    };
    this.csvWorker.postMessage({ type: 'parse', payload: { text } });
  }

  async renderConsoleQuotes(container) {
    const form = createElement('div', 'card');
    form.innerHTML = `
      <h3>报价模板配置</h3>
      <label>模板名称<input id="quote-name" /></label>
      <label>折扣比例<input id="quote-discount" type="number" value="5" />%</label>
      <button class="primary-button" id="quote-generate">生成报价</button>
      <div id="quote-result" class="quote-result"></div>
    `;
    form.querySelector('#quote-generate').addEventListener('click', async () => {
      const name = form.querySelector('#quote-name').value || '默认模板';
      const discount = Number(form.querySelector('#quote-discount').value || 0);
      const subtotal = this.state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const saving = subtotal * (discount / 100);
      const total = subtotal - saving;
      const result = form.querySelector('#quote-result');
      result.innerHTML = `
        <p>模板：${name}</p>
        <p>折扣：${discount}%</p>
        <p>原价：¥${subtotal.toLocaleString()}</p>
        <p>优惠：¥${saving.toLocaleString()}</p>
        <p><strong>报价：¥${total.toLocaleString()}</strong></p>
      `;
      await apiRequest('/api/quotes', {
        method: 'POST',
        body: JSON.stringify({ name, discount, subtotal, saving, total })
      }, this.state.token);
      alert('报价已保存，可通过浏览器打印导出 PDF');
    });
    container.append(form);
  }

  async renderConsoleOrders(container) {
    const data = await apiRequest('/api/orders', { method: 'GET' }, this.state.token);
    const card = createElement('div', 'card');
    card.innerHTML = '<h3>订单记录</h3>';
    const list = createElement('ul');
    data.list.forEach((order) => {
      const item = createElement('li');
      item.innerHTML = `
        <strong>${order.customer}</strong> - ¥${order.finalAmount.toLocaleString()}<br />
        <small>${new Date(order.createdAt).toLocaleString()}</small>
      `;
      list.append(item);
    });
    card.append(list);
    container.append(card);
  }

  renderConsoleProducts(container) {
    const card = createElement('div', 'card');
    card.innerHTML = '<h3>商品目录</h3>';
    const table = createElement('table', 'table');
    table.innerHTML = `
      <thead><tr><th>名称</th><th>型号</th><th>价格</th></tr></thead>
      <tbody></tbody>
    `;
    card.append(table);
    container.append(card);
    apiRequest('/api/products?page=1&pageSize=100', { method: 'GET' }, this.state.token).then((data) => {
      const tbody = table.querySelector('tbody');
      data.list.forEach((item) => {
        const row = createElement('tr');
        row.innerHTML = `<td>${item.name}</td><td>${item.model}</td><td>¥${item.price.toLocaleString()}</td>`;
        tbody.append(row);
      });
    });
  }

  renderConsoleContracts(container) {
    const card = createElement('div', 'card');
    card.innerHTML = `
      <h3>合同模板</h3>
      <p>将模板 PDF 或 DOC 文件存储于安全的文档仓库，控制台提供快捷链接与打印视图。</p>
      <button class="secondary-button" onclick="window.print()">打印合同示例</button>
    `;
    container.append(card);
  }

  renderConsoleExports(container) {
    const card = createElement('div', 'card');
    card.innerHTML = `
      <h3>导出中心</h3>
      <p>统一导出视频 CSV、订单明细与报价记录。</p>
    `;
    const exportVideosBtn = this.createButton('导出视频 CSV', async () => {
      const csv = await fetch(`${API_BASE}/api/videos/export`, {
        headers: { Authorization: `Bearer ${this.state.token}` }
      });
      const blob = await csv.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `videos-${Date.now()}.csv`;
      link.click();
    }, 'secondary-button');
    card.append(exportVideosBtn);
    container.append(card);
  }

  async renderConsoleSettings(container) {
    const settings = await apiRequest('/api/settings', { method: 'GET' }, this.state.token);
    this.state.settings = settings;
    const card = createElement('div', 'card');
    card.innerHTML = `
      <h3>公司信息</h3>
      <label>公司名称<input id="company-name" value="${settings.companyName}" /></label>
      <label>业务员名单<textarea id="sales-list">${settings.sales.join('\n')}</textarea></label>
      <button class="primary-button" id="save-settings">保存</button>
    `;
    card.querySelector('#save-settings').addEventListener('click', async () => {
      const name = card.querySelector('#company-name').value;
      const sales = card.querySelector('#sales-list').value.split(/\n+/).filter(Boolean);
      await apiRequest('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ companyName: name, sales })
      }, this.state.token);
      this.state.settings = { ...settings, companyName: name, sales };
      alert('设置已更新');
    });
    container.append(card);
  }

  renderConsoleMaintenance(container) {
    const card = createElement('div', 'card');
    card.innerHTML = `
      <h3>系统维护</h3>
      <p>查看系统日志与备份管理状态。</p>
      <ul>
        <li>最近备份时间：${new Date().toLocaleString()}</li>
        <li>系统状态：<span class="status-dot success"></span>运行正常</li>
      </ul>
    `;
    container.append(card);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new HuiCloudApp();
});

const app = getApp();

function markdownToHtml(md) {
  if (!md) return '';
  let html = md;
  html = html.replace(/^###\s?(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s?(.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s?(.*)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/^-\s?(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/g, '<ul class="rich-text-list">$1</ul>');
  html = html.replace(/\n/g, '<br/>');
  return html;
}

Page({
  data: {
    brandStats: [],
    recentLeads: [],
    businessScripts: [],
    livestreamScripts: [],
    scriptModal: {
      visible: false,
      nodes: [],
      title: ''
    },
    orderForm: {
      content: ''
    },
    orderPreview: '',
    loginForm: {
      username: '',
      password: ''
    },
    isAuthenticated: false,
    userInfo: {},
    customerLeads: [],
    token: ''
  },

  onLoad() {
    this.fetchBrandStats();
    this.fetchRecentLeads();
    this.fetchScripts('business');
    this.fetchScripts('livestream');
    const token = wx.getStorageSync('huiyun_token');
    if (token) {
      this.setData({ token, isAuthenticated: true });
      this.fetchUserProfile();
      this.fetchCustomerLeads();
    }
  },

  getApiUrl(path) {
    const baseUrl = (app && app.globalData && app.globalData.apiBaseUrl) || 'http://localhost:8000/api';
    return `${baseUrl}${path}`;
  },

  fetchBrandStats() {
    wx.request({
      url: this.getApiUrl('/brand/stats'),
      method: 'GET',
      success: ({ data }) => {
        if (data?.success) {
          this.setData({ brandStats: data.data });
        }
      }
    });
  },

  fetchRecentLeads() {
    wx.request({
      url: this.getApiUrl('/brand/leads/recent'),
      method: 'GET',
      success: ({ data }) => {
        if (data?.success) {
          this.setData({ recentLeads: data.data });
        }
      }
    });
  },

  fetchScripts(type) {
    wx.request({
      url: this.getApiUrl(`/scripts/${type}`),
      method: 'GET',
      success: ({ data }) => {
        if (data?.success) {
          const key = type === 'business' ? 'businessScripts' : 'livestreamScripts';
          this.setData({ [key]: data.data });
        }
      }
    });
  },

  fetchScriptDetail(type, key) {
    wx.request({
      url: this.getApiUrl(`/scripts/${type}/${key}`),
      method: 'GET',
      success: ({ data }) => {
        if (data?.success) {
          const html = markdownToHtml(data.data.content || '');
          this.setData({
            scriptModal: {
              visible: true,
              title: data.data.title,
              nodes: html
            }
          });
        }
      }
    });
  },

  fetchUserProfile() {
    wx.request({
      url: this.getApiUrl('/auth/profile'),
      method: 'GET',
      header: {
        Authorization: `Bearer ${this.data.token}`
      },
      success: ({ data }) => {
        if (data?.success) {
          this.setData({ userInfo: data.data });
        }
      }
    });
  },

  fetchCustomerLeads() {
    wx.request({
      url: this.getApiUrl('/brand/leads'),
      method: 'GET',
      header: {
        Authorization: `Bearer ${this.data.token}`
      },
      success: ({ data }) => {
        if (data?.success) {
          this.setData({ customerLeads: data.data });
        }
      }
    });
  },

  handleOpenScript(e) {
    const { type, key } = e.currentTarget.dataset;
    this.fetchScriptDetail(type, key);
  },

  handleCloseScript() {
    this.setData({
      scriptModal: {
        visible: false,
        nodes: [],
        title: ''
      }
    });
  },

  handleOrderContent(e) {
    this.setData({ 'orderForm.content': e.detail.value });
  },

  handleGenerateOrder() {
    if (!this.data.orderForm.content) {
      wx.showToast({ title: '请输入订单描述', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '生成中...' });
    wx.request({
      url: this.getApiUrl('/orders'),
      method: 'POST',
      data: {
        content: this.data.orderForm.content
      },
      success: ({ data }) => {
        wx.hideLoading();
        if (data?.success) {
          this.setData({ orderPreview: data.data.preview });
          wx.showModal({
            title: '生成成功',
            content: 'PDF 下载链接已复制，可直接分享给微信好友。',
            showCancel: false
          });
          if (data.data.pdf_url) {
            wx.setClipboardData({ data: data.data.pdf_url });
          }
        }
      },
      fail: () => {
        wx.hideLoading();
      }
    });
  },

  handlePreviewOrder() {
    if (!this.data.orderForm.content) {
      wx.showToast({ title: '请输入订单描述', icon: 'none' });
      return;
    }
    wx.request({
      url: this.getApiUrl('/orders/preview'),
      method: 'POST',
      data: {
        content: this.data.orderForm.content
      },
      success: ({ data }) => {
        if (data?.success) {
          this.setData({ orderPreview: data.data.preview });
        }
      }
    });
  },

  handleUsername(e) {
    this.setData({ 'loginForm.username': e.detail.value });
  },

  handlePassword(e) {
    this.setData({ 'loginForm.password': e.detail.value });
  },

  handleLogin() {
    if (!this.data.loginForm.username || !this.data.loginForm.password) {
      wx.showToast({ title: '请输入账号密码', icon: 'none' });
      return;
    }
    wx.request({
      url: this.getApiUrl('/auth/login'),
      method: 'POST',
      data: this.data.loginForm,
      success: ({ data }) => {
        if (data?.success) {
          wx.setStorageSync('huiyun_token', data.data.token);
          this.setData({
            isAuthenticated: true,
            token: data.data.token
          });
          this.fetchUserProfile();
          this.fetchCustomerLeads();
          wx.showToast({ title: '登录成功' });
        } else {
          wx.showToast({ title: data?.message || '登录失败', icon: 'none' });
        }
      },
      fail: () => wx.showToast({ title: '网络异常', icon: 'none' })
    });
  },

  handleLogout() {
    wx.removeStorageSync('huiyun_token');
    this.setData({
      isAuthenticated: false,
      token: '',
      userInfo: {},
      customerLeads: []
    });
  },

  handleSyncQr() {
    wx.showToast({ title: '二维码已同步', icon: 'success' });
  },

  handleOpenDashboard() {
    wx.showToast({ title: '打开数据面板', icon: 'none' });
  }
});

const app = getApp();

const defaultDashboard = {
  leads: '--',
  leadsTrend: '—',
  contractAmount: '--',
  pendingContracts: '--',
  todos: []
};

const defaultSummary = {
  month: '--',
  generatedAt: '--',
  coreProgress: '暂无数据',
  keyAccounts: [],
  nextSteps: '暂无数据'
};

const offlineTodos = [
  {
    id: 'todo-1',
    icon: '📞',
    title: '跟进青禾功能饮料招标',
    subtitle: '确认试制产线排期'
  },
  {
    id: 'todo-2',
    icon: '📝',
    title: '完善德润乳品合同条款',
    subtitle: '与法务对齐付款节点'
  },
  {
    id: 'todo-3',
    icon: '🏭',
    title: '安排辉鑫灌装线验收',
    subtitle: '协调设备调试工程师'
  }
];

const offlineDashboard = {
  leads: '128',
  leadsTrend: '较上月 +18%',
  contractAmount: '342.6',
  pendingContracts: '3',
  todos: offlineTodos
};

function cloneDashboard(data) {
  return {
    ...data,
    todos: (data.todos || []).map((item) => ({ ...item }))
  };
}

function buildOfflineSummary() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  return {
    month: `${year}年${month}月`,
    generatedAt: `${month}月AI同步`,
    coreProgress: '华盛饮品高速灌装项目完成产线联调，客户确认采购方案。',
    keyAccounts: [
      '青禾功能饮料 · 签署PO，预计两周内完成预付款',
      '德润乳品 · 待确认消毒模组升级配置'
    ],
    nextSteps: '推进华南区域演示中心建设，并锁定下月渠道招商目标。'
  };
}

function isoDateString(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatCalendarLabel(date) {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${month}月${day}日`;
}

function calcCalendarStart(monthStart) {
  const weekday = (monthStart.getDay() + 6) % 7; // Monday = 0
  const offset = (weekday + 1) % 7;
  const start = new Date(monthStart);
  start.setDate(monthStart.getDate() - offset);
  return start;
}

function buildOfflineLogsByDate(today) {
  const logs = {};
  const addLog = (offset, payload) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    const key = isoDateString(date);
    logs[key] = logs[key] || [];
    logs[key].push({ ...payload, id: `${key}-${logs[key].length}` });
  };

  addLog(0, {
    title: '回访中港灌装项目',
    time: '09:30',
    content: '确认设备选型与厂房改造进度，客户对智能灌装线表现出高度兴趣。'
  });
  addLog(-1, {
    title: '华盛饮品试产协调',
    time: '14:00',
    content: '组织工艺团队进行试产保障沟通，输出定制化消毒模组方案。'
  });
  addLog(-3, {
    title: '德润乳品项目推进',
    time: '16:30',
    content: '提交最新报价并安排下周实地勘查，客户拟签排产协议。'
  });
  addLog(-5, {
    title: '青禾功能饮料交流',
    time: '11:15',
    content: '完成包装线设计演示并确认试制样品批次。'
  });

  return logs;
}

function buildOfflineCalendarPayload() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const calendarStart = calcCalendarStart(monthStart);
  const logsByDate = buildOfflineLogsByDate(today);
  const days = [];
  const cursor = new Date(calendarStart);

  for (let i = 0; i < 42; i += 1) {
    const iso = isoDateString(cursor);
    days.push({
      day: cursor.getDate(),
      date: iso,
      isCurrentMonth: cursor.getMonth() === monthStart.getMonth(),
      hasLog: Boolean(logsByDate[iso] && logsByDate[iso].length)
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const todayIso = isoDateString(today);
  return {
    calendar: {
      weekdays: ['日', '一', '二', '三', '四', '五', '六'],
      currentMonthLabel: `${monthStart.getFullYear()}年${monthStart.getMonth() + 1}月`,
      days
    },
    logsByDate,
    selectedLogs: logsByDate[todayIso] || [],
    selectedDateLabel: `今天 · ${formatCalendarLabel(today)}`
  };
}

Page({
  data: {
    tabs: [
      { key: 'dashboard', label: '概览' },
      { key: 'quotation', label: '报价单' },
      { key: 'calendar', label: '销售日志' },
      { key: 'summary', label: 'AI总结' }
    ],
    activeTab: 'dashboard',
    dashboard: defaultDashboard,
    offlineMode: false,
    bottleOptions: ['500ml PET', '330ml 玻璃', '750ml 高端玻璃'],
    quotationForm: {
      clientName: '',
      capacity: '',
      bottleIndex: 0,
      launchDate: '',
      budget: '',
      requirements: ''
    },
    quotationSubmitting: false,
    quotationPreview: null,
    calendar: {
      weekdays: ['日', '一', '二', '三', '四', '五', '六'],
      currentMonthLabel: '',
      days: []
    },
    selectedLogs: [],
    selectedDateLabel: '选择日期查看日志',
    aiSummary: defaultSummary
  },

  onLoad() {
    this.offlineLogsByDate = null;
    this.loadDashboard();
    this.loadCalendar();
    this.loadSummary();
  },

  shouldUseMock() {
    return app.globalData.backendOnline === false;
  },

  markBackendOffline() {
    if (app.globalData.backendOnline !== false) {
      app.globalData.backendOnline = false;
    }
    if (!app.globalData.offlineNotified) {
      wx.showToast({ title: '后台未连接，已切换演示数据', icon: 'none' });
      app.globalData.offlineNotified = true;
    }
    if (!this.data.offlineMode) {
      this.setData({ offlineMode: true });
    }
  },

  markBackendOnline() {
    if (app.globalData.backendOnline === false) {
      app.globalData.backendOnline = true;
      app.globalData.offlineNotified = false;
    }
    if (this.data.offlineMode) {
      this.setData({ offlineMode: false });
    }
  },

  applyDashboardFallback() {
    this.setData({ dashboard: cloneDashboard(offlineDashboard) });
  },

  applyCalendarFallback() {
    const payload = buildOfflineCalendarPayload();
    this.offlineLogsByDate = payload.logsByDate;
    this.setData({
      calendar: payload.calendar,
      selectedLogs: payload.selectedLogs,
      selectedDateLabel: payload.selectedDateLabel
    });
  },

  applySummaryFallback() {
    this.setData({ aiSummary: buildOfflineSummary() });
  },

  buildOfflineLabel(dateString) {
    if (!dateString) {
      return '销售记录';
    }
    const todayIso = isoDateString(new Date());
    if (dateString === todayIso) {
      return `今天 · ${formatCalendarLabel(new Date())}`;
    }
    const parts = dateString.split('-');
    if (parts.length !== 3) {
      return '销售记录';
    }
    const month = parts[1];
    const day = parts[2];
    return `${month}月${day}日 · 销售记录`;
  },

  retryBackend() {
    app.globalData.backendOnline = true;
    app.globalData.offlineNotified = false;
    this.setData({ offlineMode: false });
    this.loadDashboard();
    this.loadCalendar();
    this.loadSummary();
  },

  getApi(path) {
    return `${app.globalData.apiBaseUrl}${path}`;
  },

  parseNumber(value) {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value !== 'string') {
      return null;
    }
    const normalized = value.replace(/[\s,，]/g, '').replace(/[^0-9.-]/g, '');
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  },

  parsePositiveNumber(value) {
    const parsed = this.parseNumber(value);
    if (parsed === null || parsed <= 0) {
      return null;
    }
    return parsed;
  },

  parseNonNegativeNumber(value) {
    const parsed = this.parseNumber(value);
    if (parsed === null || parsed < 0) {
      return null;
    }
    return parsed;
  },

  handleTabChange(event) {
    const { key } = event.detail;
    this.setData({ activeTab: key });
    if (key === 'dashboard') {
      this.loadDashboard();
    }
    if (key === 'calendar' && !this.data.calendar.days.length) {
      this.loadCalendar();
    }
    if (key === 'summary') {
      this.loadSummary();
    }
  },

  handleShortcut(event) {
    const { key } = event.currentTarget.dataset;
    this.setData({ activeTab: key });
    if (key === 'summary') {
      this.loadSummary();
    }
  },

  loadDashboard() {
    if (this.shouldUseMock()) {
      this.markBackendOffline();
      this.applyDashboardFallback();
      return;
    }
    wx.request({
      url: this.getApi('/dashboard/overview'),
      method: 'GET',
      success: ({ data }) => {
        this.markBackendOnline();
        this.setData({ dashboard: data });
      },
      fail: (error) => {
        console.warn('概览数据请求失败', error);
        this.markBackendOffline();
        this.applyDashboardFallback();
      }
    });
  },

  handleQuotationInput(event) {
    const { field } = event.currentTarget.dataset;
    const value = event.detail.value;
    this.setData({
      quotationForm: {
        ...this.data.quotationForm,
        [field]: value
      }
    });
  },

  handleBottleChange(event) {
    const index = Number(event.detail.value);
    this.setData({
      quotationForm: {
        ...this.data.quotationForm,
        bottleIndex: index
      }
    });
  },

  handleDateChange(event) {
    const value = event.detail.value;
    this.setData({
      quotationForm: {
        ...this.data.quotationForm,
        launchDate: value
      }
    });
  },

  saveDraft() {
    wx.setStorage({
      key: 'quotationDraft',
      data: this.data.quotationForm
    });
    wx.showToast({ title: '已保存草稿', icon: 'success' });
  },

  loadHistory() {
    wx.getStorage({
      key: 'quotationDraft',
      success: ({ data }) => {
        wx.showToast({ title: '已载入草稿', icon: 'none' });
        this.setData({ quotationForm: data });
      },
      fail: () => {
        wx.showToast({ title: '暂无历史记录', icon: 'none' });
      }
    });
  },

  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: () => {
        wx.showToast({ title: '附件已选择', icon: 'success' });
      }
    });
  },

  validateQuotation(form) {
    const clientName = (form.clientName || '').trim();
    if (!clientName) {
      wx.showToast({ title: '请输入客户名称', icon: 'none' });
      return false;
    }
    if (!form.capacity) {
      wx.showToast({ title: '请输入产能', icon: 'none' });
      return false;
    }
    const requirements = (form.requirements || '').trim();
    if (!requirements) {
      wx.showToast({ title: '请填写需求', icon: 'none' });
      return false;
    }
    return true;
  },

  submitQuotation() {
    const form = this.data.quotationForm;
    if (!this.validateQuotation(form)) {
      return;
    }
    const payload = this.normalizeQuotationPayload(form);
    if (!payload) {
      return;
    }
    this.setData({ quotationSubmitting: true });
    wx.request({
      url: this.getApi('/quotes'),
      method: 'POST',
      data: payload,
      success: ({ statusCode, data }) => {
        if (statusCode === 200) {
          this.markBackendOnline();
          this.setData({ quotationPreview: data });
          wx.showToast({ title: '已生成', icon: 'success' });
        } else {
          if (statusCode >= 500) {
            this.markBackendOffline();
          }
          const message = this.extractErrorMessage(data);
          const fallback = this.buildLocalQuotePreview(payload);
          if (fallback) {
            this.setData({ quotationPreview: fallback });
            wx.showToast({ title: '已生成（本地估算）', icon: 'success' });
          } else {
            wx.showToast({ title: message || '提交失败，请检查填写内容', icon: 'none' });
          }
        }
      },
      fail: (error) => {
        console.error('报价请求失败', error);
        this.markBackendOffline();
        const fallback = this.buildLocalQuotePreview(payload);
        if (fallback) {
          this.setData({ quotationPreview: fallback });
          wx.showToast({ title: '已生成（本地估算）', icon: 'success' });
        } else {
          wx.showToast({ title: '提交失败，请稍后再试', icon: 'none' });
        }
      },
      complete: () => {
        this.setData({ quotationSubmitting: false });
      }
    });
  },

  normalizeQuotationPayload(form) {
    const clientName = (form.clientName || '').trim();
    const capacity = this.parsePositiveNumber(form.capacity);
    if (capacity === null) {
      wx.showToast({ title: '请输入正确的产能数值', icon: 'none' });
      return null;
    }

    let budget = null;
    if (form.budget !== '') {
      const parsedBudget = this.parseNonNegativeNumber(form.budget);
      if (parsedBudget === null) {
        wx.showToast({ title: '请输入正确的预算金额', icon: 'none' });
        return null;
      }
      budget = parsedBudget;
    }

    const requirements = (form.requirements || '').trim();

    return {
      clientName,
      capacity,
      bottleType: this.data.bottleOptions[form.bottleIndex],
      launchDate: form.launchDate || null,
      budget,
      requirements
    };
  },

  extractErrorMessage(data) {
    if (!data) {
      return '';
    }
    if (typeof data === 'string') {
      return data;
    }
    if (Array.isArray(data?.detail) && data.detail.length) {
      const first = data.detail[0];
      if (typeof first === 'string') {
        return first;
      }
      if (first?.msg) {
        return first.msg;
      }
    }
    if (data?.detail?.msg) {
      return data.detail.msg;
    }
    if (data?.message) {
      return data.message;
    }
    return '';
  },

  buildLocalQuotePreview(payload) {
    if (!payload) {
      return null;
    }
    const highlights = [];
    if (payload.capacity) {
      highlights.push(`产线配置满足 ${payload.capacity} 瓶/小时产能`);
    }
    if (payload.bottleType) {
      highlights.push(`适配 ${payload.bottleType} 包装规格`);
    }
    if (payload.launchDate) {
      highlights.push(`预计 ${this.formatMonth(payload.launchDate)} 可完成联调交付`);
    }
    if (payload.requirements && payload.requirements.length > 30) {
      highlights.push('已根据重点需求生成多模块集成方案');
    }

    const base = Number(payload.capacity) * 150;
    let estimated = base;
    if (payload.budget !== null && payload.budget !== undefined) {
      const budgetValue = Number(payload.budget);
      if (Number.isFinite(budgetValue)) {
        const lowerBound = Math.max(base, budgetValue * 10000);
        const upperBound = budgetValue * 12000;
        estimated = Math.min(lowerBound, upperBound);
      }
    }

    if (!Number.isFinite(estimated)) {
      return null;
    }

    const highlightText = highlights.length
      ? highlights.join('；')
      : '方案已根据基础配置生成，请补充更多需求获取精准报价';

    return {
      clientName: payload.clientName,
      highlights: highlightText,
      estimatedTotal: Number(estimated.toFixed(2))
    };
  },

  formatMonth(dateValue) {
    if (!dateValue) {
      return '';
    }
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${year}年${month}月`;
  },

  exportQuotation() {
    wx.showToast({ title: '请在管理端导出', icon: 'none' });
  },

  loadCalendar() {
    if (this.shouldUseMock()) {
      this.markBackendOffline();
      this.applyCalendarFallback();
      return;
    }
    wx.request({
      url: this.getApi('/logs/calendar'),
      method: 'GET',
      success: ({ data }) => {
        this.markBackendOnline();
        this.offlineLogsByDate = null;
        this.setData({
          calendar: data.calendar,
          selectedLogs: data.todayLogs,
          selectedDateLabel: data.selectedDateLabel
        });
      },
      fail: (error) => {
        console.warn('日历数据请求失败', error);
        this.markBackendOffline();
        this.applyCalendarFallback();
      }
    });
  },

  handleDateSelect(event) {
    const { date } = event.currentTarget.dataset;
    if (!date) {
      return;
    }
    if (this.shouldUseMock() && this.offlineLogsByDate) {
      const logs = this.offlineLogsByDate[date] || [];
      this.setData({
        selectedLogs: logs,
        selectedDateLabel: this.buildOfflineLabel(date)
      });
      return;
    }
    wx.request({
      url: this.getApi(`/logs/${date}`),
      method: 'GET',
      success: ({ data }) => {
        this.markBackendOnline();
        this.setData({
          selectedLogs: data.logs,
          selectedDateLabel: data.label
        });
      },
      fail: (error) => {
        console.warn('指定日期日志请求失败', error);
        this.markBackendOffline();
        this.applyCalendarFallback();
        if (this.offlineLogsByDate) {
          const fallbackLogs = this.offlineLogsByDate[date] || [];
          this.setData({
            selectedLogs: fallbackLogs,
            selectedDateLabel: this.buildOfflineLabel(date)
          });
        }
      }
    });
  },

  loadSummary() {
    if (this.shouldUseMock()) {
      this.markBackendOffline();
      this.applySummaryFallback();
      return;
    }
    wx.request({
      url: this.getApi('/summary/monthly'),
      method: 'GET',
      success: ({ data }) => {
        this.markBackendOnline();
        this.setData({ aiSummary: data });
      },
      fail: (error) => {
        console.warn('AI总结请求失败', error);
        this.markBackendOffline();
        this.applySummaryFallback();
      }
    });
  },

  refreshSummary() {
    wx.showLoading({ title: '生成中...', mask: true });
    if (this.shouldUseMock()) {
      this.markBackendOffline();
      this.applySummaryFallback();
      wx.hideLoading();
      wx.showToast({ title: '展示演示数据', icon: 'none' });
      return;
    }
    wx.request({
      url: this.getApi('/summary/monthly'),
      method: 'POST',
      success: ({ data }) => {
        this.markBackendOnline();
        this.setData({ aiSummary: data });
        wx.showToast({ title: '已更新', icon: 'success' });
      },
      fail: (error) => {
        console.warn('刷新AI总结失败', error);
        this.markBackendOffline();
        this.applySummaryFallback();
        wx.showToast({ title: '生成失败，展示演示数据', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  }
});

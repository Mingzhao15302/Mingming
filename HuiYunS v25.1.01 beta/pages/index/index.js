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
    this.loadDashboard();
    this.loadCalendar();
    this.loadSummary();
  },

  getApi(path) {
    return `${app.globalData.apiBaseUrl}${path}`;
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
    wx.request({
      url: this.getApi('/dashboard/overview'),
      method: 'GET',
      success: ({ data }) => {
        this.setData({ dashboard: data });
      },
      fail: () => {
        this.setData({ dashboard: defaultDashboard });
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
    if (!form.clientName) {
      wx.showToast({ title: '请输入客户名称', icon: 'none' });
      return false;
    }
    if (!form.capacity) {
      wx.showToast({ title: '请输入产能', icon: 'none' });
      return false;
    }
    if (!form.requirements) {
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
          this.setData({ quotationPreview: data });
          wx.showToast({ title: '已生成', icon: 'success' });
        } else {
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
    const capacity = Number(form.capacity);
    if (!Number.isFinite(capacity) || capacity <= 0) {
      wx.showToast({ title: '请输入正确的产能数值', icon: 'none' });
      return null;
    }

    let budget = null;
    if (form.budget !== '') {
      budget = Number(form.budget);
      if (!Number.isFinite(budget) || budget < 0) {
        wx.showToast({ title: '请输入正确的预算金额', icon: 'none' });
        return null;
      }
    }

    return {
      clientName: form.clientName,
      capacity,
      bottleType: this.data.bottleOptions[form.bottleIndex],
      launchDate: form.launchDate || null,
      budget,
      requirements: form.requirements
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
    wx.request({
      url: this.getApi('/logs/calendar'),
      method: 'GET',
      success: ({ data }) => {
        this.setData({
          calendar: data.calendar,
          selectedLogs: data.todayLogs,
          selectedDateLabel: data.selectedDateLabel
        });
      },
      fail: () => {
        wx.showToast({ title: '日历加载失败', icon: 'none' });
      }
    });
  },

  handleDateSelect(event) {
    const { date } = event.currentTarget.dataset;
    if (!date) {
      return;
    }
    wx.request({
      url: this.getApi(`/logs/${date}`),
      method: 'GET',
      success: ({ data }) => {
        this.setData({
          selectedLogs: data.logs,
          selectedDateLabel: data.label
        });
      },
      fail: () => {
        wx.showToast({ title: '未能获取日志', icon: 'none' });
      }
    });
  },

  loadSummary() {
    wx.request({
      url: this.getApi('/summary/monthly'),
      method: 'GET',
      success: ({ data }) => {
        this.setData({ aiSummary: data });
      },
      fail: () => {
        this.setData({ aiSummary: defaultSummary });
      }
    });
  },

  refreshSummary() {
    wx.showLoading({ title: '生成中...', mask: true });
    wx.request({
      url: this.getApi('/summary/monthly'),
      method: 'POST',
      success: ({ data }) => {
        this.setData({ aiSummary: data });
        wx.showToast({ title: '已更新', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '生成失败', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  }
});

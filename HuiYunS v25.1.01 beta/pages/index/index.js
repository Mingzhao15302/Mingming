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
    this.setData({ quotationSubmitting: true });
    wx.request({
      url: this.getApi('/quotes'),
      method: 'POST',
      data: {
        ...form,
        bottleType: this.data.bottleOptions[form.bottleIndex]
      },
      success: ({ data }) => {
        this.setData({ quotationPreview: data });
        wx.showToast({ title: '已生成', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '提交失败，请稍后再试', icon: 'none' });
      },
      complete: () => {
        this.setData({ quotationSubmitting: false });
      }
    });
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

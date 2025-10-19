App({
  onLaunch() {
    try {
      const storedBaseUrl = wx.getStorageSync('apiBaseUrl');
      if (storedBaseUrl) {
        this.globalData.apiBaseUrl = storedBaseUrl;
      }
    } catch (error) {
      console.warn('读取接口地址失败', error);
    }
  },

  setApiBaseUrl(url) {
    if (typeof url !== 'string') {
      return;
    }
    const trimmed = url.trim();
    if (!trimmed) {
      return;
    }
    this.globalData.apiBaseUrl = trimmed;
    try {
      wx.setStorageSync('apiBaseUrl', trimmed);
    } catch (error) {
      console.warn('存储接口地址失败', error);
    }
  },

  globalData: {
    apiBaseUrl: 'http://127.0.0.1:8000/api',
    backendOnline: true,
    offlineNotified: false
  }
});

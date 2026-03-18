// BJJ Echo - 巴西柔术 Flow 训练记录
App({
  globalData: {
    createNewFlow: false,
  },
  onLaunch() {
    // 初始化本地存储
    ;['flows', 'steps', 'decisions', 'notes', 'techniques'].forEach(key => {
      const data = wx.getStorageSync(key)
      if (!data || !Array.isArray(data)) {
        wx.setStorageSync(key, [])
      }
    })
  },
})

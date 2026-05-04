// BJJ Echo - 巴西柔术 Flow 训练记录
App({
  globalData: {
    resetAddForm: false,
    /** switchTab 无法带 query，从详情「编辑」跳转时用 */
    pendingAddSessionId: '',
    pendingAddInsightId: '',
  },
  onLaunch() {
    // 提示用户更新到线上最新包（避免好友仍停留在旧版界面）
    if (wx.canIUse('getUpdateManager')) {
      const um = wx.getUpdateManager()
      um.onUpdateReady(() => {
        wx.showModal({
          title: '发现新版本',
          content: '是否重启小程序以使用最新版本？',
          confirmText: '重启',
          success(res) {
            if (res.confirm) um.applyUpdate()
          },
        })
      })
    }

    // 初始化本地存储
    ;['flows', 'steps', 'decisions', 'notes', 'techniques'].forEach(key => {
      const data = wx.getStorageSync(key)
      if (!data || !Array.isArray(data)) {
        wx.setStorageSync(key, [])
      }
    })
    const customTags = wx.getStorageSync('customTechTags')
    if (!customTags || typeof customTags !== 'object') {
      wx.setStorageSync('customTechTags', { positions: [], actions: [] })
    }
    const sessionRecords = wx.getStorageSync('sessionRecords')
    if (!sessionRecords || !Array.isArray(sessionRecords)) {
      wx.setStorageSync('sessionRecords', [])
    }
    const customSessionStates = wx.getStorageSync('customSessionClassStates')
    if (!customSessionStates || !Array.isArray(customSessionStates)) {
      wx.setStorageSync('customSessionClassStates', [])
    }
    const customPainTags = wx.getStorageSync('customSessionPainTags')
    if (!customPainTags || !Array.isArray(customPainTags)) {
      wx.setStorageSync('customSessionPainTags', [])
    }
  },
})

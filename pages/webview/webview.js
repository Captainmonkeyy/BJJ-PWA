Page({
  data: {
    src: '',
    showError: false,
  },

  onWebViewError() {
    this.setData({ showError: true })
  },

  onCopyLink() {
    const src = this.data.src
    if (!src) return
    wx.setClipboardData({
      data: src,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    })
  },

  onGoBack() {
    wx.navigateBack()
  },

  onLoad(options) {
    const raw = options.url
    if (!raw) {
      wx.showToast({ title: '链接无效', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1200)
      return
    }
    let decoded = ''
    try {
      decoded = decodeURIComponent(raw)
    } catch (e) {
      decoded = raw
    }
    if (!decoded || (!/^https?:\/\//i.test(decoded) && !/^\/\//.test(decoded))) {
      wx.showToast({ title: '链接无效', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1200)
      return
    }
    const src = decoded.startsWith('//') ? 'https:' + decoded : decoded
    this.setData({ src, showError: false })
  },

  onShareAppMessage() {
    const src = this.data.src
    if (!src) {
      return { title: 'Echo的柔术记录', path: '/pages/index/index' }
    }
    return {
      title: 'Echo的柔术记录 · 链接预览',
      path: `/pages/webview/webview?url=${encodeURIComponent(src)}`,
    }
  },

  onShareTimeline() {
    const src = this.data.src
    if (!src) {
      return { title: 'Echo的柔术记录' }
    }
    return {
      title: 'Echo的柔术记录 · 链接预览',
      query: `url=${encodeURIComponent(src)}`,
    }
  },
})
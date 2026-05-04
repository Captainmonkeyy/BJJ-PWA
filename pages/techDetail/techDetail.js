const storage = require('../../utils/storage')
const util = require('../../utils/util')
const { POSITION_LABELS, ACTION_LABELS, TECH_POSITION_LABELS } = require('../../utils/constants')

Page({
  data: {
    tech: null,
    teachVideoRows: [],
    POSITION_LABELS,
    ACTION_LABELS,
    TECH_POSITION_LABELS,
  },

  loadTech(id) {
    if (!id) return
    const tech = storage.getTechniqueById(id)
    if (tech) {
      const teachVideoRows = util.getTeachVideoRowsForDetail(tech)
      this.setData({ tech, teachVideoRows })
    }
  },

  onLoad(options) {
    const id = options.id
    this._techId = id || ''
    if (id) {
      this.loadTech(id)
    }
  },

  onShow() {
    if (this._techId) {
      this.loadTech(this._techId)
    }
  },

  onShareAppMessage() {
    const tech = this.data.tech
    const id = (tech && tech.id) || this._techId
    if (!id) {
      return { title: 'Echo的柔术记录', path: '/pages/index/index' }
    }
    const name = ((tech && tech.name) || '招式').trim()
    const title = name.length > 28 ? `${name.slice(0, 28)}…` : `招式：${name}`
    return {
      title,
      path: `/pages/techDetail/techDetail?id=${id}`,
    }
  },

  onShareTimeline() {
    const tech = this.data.tech
    const id = (tech && tech.id) || this._techId
    if (!id) {
      return { title: 'Echo的柔术记录' }
    }
    const name = ((tech && tech.name) || '招式').trim()
    const title = name.length > 28 ? `${name.slice(0, 28)}…` : `招式：${name}`
    return {
      title,
      query: `id=${id}`,
    }
  },

  onBack() {
    wx.navigateBack()
  },

  onEdit() {
    const { tech } = this.data
    if (tech) {
      wx.navigateTo({ url: `/pages/addTech/addTech?id=${tech.id}` })
    }
  },

  onOpenTeachVideo(e) {
    const raw = e.currentTarget.dataset.url
    if (!raw) return
    const url = util.normalizeHttpUrl(raw)
    if (!util.isValidWebUrl(url)) {
      wx.showToast({ title: '链接无效或已失效', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/webview/webview?url=${encodeURIComponent(url)}`,
    })
  },

  })

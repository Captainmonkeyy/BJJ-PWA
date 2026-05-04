const storage = require('../../utils/storage')
const util = require('../../utils/util')

function formatYmdChinese(ymd) {
  if (!ymd || ymd.length < 10) return ymd || ''
  const parts = ymd.split('-').map(Number)
  return `${parts[0]}年${parts[1]}月${parts[2]}日`
}

Page({
  data: {
    insight: null,
    dateLine: '',
  },

  loadInsight(id) {
    if (!id) return
    const insight = storage.getInsightById(id)
    if (insight) {
      const ymd = util.effectiveRecordDate(insight)
      this.setData({
        insight,
        dateLine: ymd ? `日期：${formatYmdChinese(ymd)}` : '',
      })
    }
  },

  onLoad(options) {
    const id = options.id
    this._insightId = id || ''
    if (id) {
      this.loadInsight(id)
    }
  },

  onShow() {
    if (this._insightId) {
      this.loadInsight(this._insightId)
    }
  },

  onShareAppMessage() {
    const insight = this.data.insight
    const id = (insight && insight.id) || this._insightId
    if (!id) {
      return { title: 'Echo的柔术记录', path: '/pages/index/index' }
    }
    const raw = ((insight && insight.title) || '心得').trim()
    const title = raw.length > 28 ? `${raw.slice(0, 28)}…` : `心得：${raw}`
    return {
      title,
      path: `/pages/insightDetail/insightDetail?id=${id}`,
    }
  },

  onShareTimeline() {
    const insight = this.data.insight
    const id = (insight && insight.id) || this._insightId
    if (!id) {
      return { title: 'Echo的柔术记录' }
    }
    const raw = ((insight && insight.title) || '心得').trim()
    const title = raw.length > 28 ? `${raw.slice(0, 28)}…` : `心得：${raw}`
    return {
      title,
      query: `id=${id}`,
    }
  },

  onBack() {
    wx.navigateBack()
  },

  onEdit() {
    const { insight } = this.data
    if (!insight) return
    const app = getApp()
    app.globalData.pendingAddInsightId = insight.id
    app.globalData.pendingAddSessionId = ''
    app.globalData.resetAddForm = false
    wx.switchTab({ url: '/pages/add/add' })
  },

})

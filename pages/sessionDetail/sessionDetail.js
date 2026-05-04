const storage = require('../../utils/storage')
const util = require('../../utils/util')
const { formatSessionClassStateLabel, formatSessionPainTagLabel } = require('../../utils/constants')

function formatYmdChinese(ymd) {
  if (!ymd || ymd.length < 10) return ymd || ''
  const parts = ymd.split('-').map(Number)
  return `${parts[0]}年${parts[1]}月${parts[2]}日`
}

Page({
  data: {
    session: null,
    dateLine: '',
    classStateLabel: '',
    painTagsLine: '',
  },

  loadSession(id) {
    if (!id) return
    const s = storage.getSessionRecordById(id)
    if (s) {
      const ymd = util.effectiveRecordDate(s)
      const classStateLabel = s.classState ? formatSessionClassStateLabel(s.classState) : ''
      const painTags = Array.isArray(s.painTags) ? s.painTags : []
      const painTagsLine = painTags.map(t => formatSessionPainTagLabel(t)).filter(Boolean).join('、')
      const painText = [painTagsLine, s.painDescription].filter(Boolean).join('\n')
      this.setData({
        session: s,
        dateLine: ymd ? `日期：${formatYmdChinese(ymd)}` : '',
        classStateLabel,
        painTagsLine,
        painText,
      })
    }
  },

  onLoad(options) {
    const id = options.id
    this._sessionId = id || ''
    if (id) {
      this.loadSession(id)
    }
  },

  onShow() {
    if (this._sessionId) {
      this.loadSession(this._sessionId)
    }
  },

  onShareAppMessage() {
    const s = this.data.session
    const id = (s && s.id) || this._sessionId
    if (!id) {
      return { title: 'Echo的柔术记录', path: '/pages/index/index' }
    }
    return {
      title: '实战表现',
      path: `/pages/sessionDetail/sessionDetail?id=${id}`,
    }
  },

  onShareTimeline() {
    const s = this.data.session
    const id = (s && s.id) || this._sessionId
    if (!id) {
      return { title: 'Echo的柔术记录' }
    }
    return {
      title: '实战表现',
      query: `id=${id}`,
    }
  },

  onBack() {
    wx.navigateBack()
  },

  onEdit() {
    const s = this.data.session
    if (!s) return
    const app = getApp()
    app.globalData.pendingAddSessionId = s.id
    app.globalData.pendingAddInsightId = ''
    app.globalData.resetAddForm = false
    wx.switchTab({ url: '/pages/add/add' })
  },

  })

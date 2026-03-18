const storage = require('../../utils/storage')
const { POSITION_LABELS, ACTION_LABELS, START_POSITION_LABELS, TOP_ACTION_LABELS, BOTTOM_ACTION_LABELS } = require('../../utils/constants')

function formatFlowStart(flow) {
  if (!flow) return '未设置'
  if (flow.startPosition === 'top' && flow.startAction) {
    return `${START_POSITION_LABELS.top} · ${TOP_ACTION_LABELS[flow.startAction] || flow.startAction}`
  }
  if (flow.startPosition === 'bottom' && flow.startAction) {
    return `${START_POSITION_LABELS.bottom} · ${BOTTOM_ACTION_LABELS[flow.startAction] || flow.startAction}`
  }
  return flow.startPosition || '未设置'
}

Page({
  data: {
    flows: [],
    techniques: [],
    POSITION_LABELS,
    ACTION_LABELS,
  },

  onShow() {
    const flows = storage.getAllFlows().map(f => ({
      ...f,
      startText: formatFlowStart(f),
    }))
    const techniques = storage.getAllTechniques()
    this.setData({ flows, techniques })
  },

  onAddTap() {
    getApp().globalData.createNewFlow = true
    wx.switchTab({ url: '/pages/add/add' })
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    const type = e.currentTarget.dataset.type
    if (type === 'flow') {
      wx.navigateTo({ url: `/pages/classDetail/classDetail?id=${id}` })
    } else {
      wx.navigateTo({ url: `/pages/techDetail/techDetail?id=${id}` })
    }
  },
})

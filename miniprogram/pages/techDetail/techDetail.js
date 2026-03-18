const storage = require('../../utils/storage')
const { POSITION_LABELS, ACTION_LABELS } = require('../../utils/constants')

Page({
  data: {
    tech: null,
    POSITION_LABELS,
    ACTION_LABELS,
  },

  onLoad(options) {
    const id = options.id
    if (id) {
      const tech = storage.getTechniqueById(id)
      if (tech) {
        this.setData({ tech })
      }
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
})

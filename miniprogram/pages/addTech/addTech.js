const storage = require('../../utils/storage')
const util = require('../../utils/util')
const { POSITION_LABELS, ACTION_LABELS, POSITION_OPTIONS, ACTION_OPTIONS } = require('../../utils/constants')

Page({
  data: {
    techId: '',
    techName: '',
    techPosition: '',
    techAction: '',
    techNotes: '',
    POSITION_LABELS,
    ACTION_LABELS,
    POSITION_OPTIONS,
    ACTION_OPTIONS,
  },

  onLoad(options) {
    const techId = options.id || ''
    if (techId) {
      const tech = storage.getTechniqueById(techId)
      if (tech) {
        this.setData({
          techId,
          techName: tech.name || '',
          techPosition: tech.position || '',
          techAction: tech.action || '',
          techNotes: tech.notes || '',
        })
      }
    } else {
      this.resetForm()
    }
  },

  resetForm() {
    this.setData({
      techId: '',
      techName: '',
      techPosition: '',
      techAction: '',
      techNotes: '',
    })
  },

  onNameInput(e) {
    this.setData({ techName: e.detail.value })
  },

  onPositionTap(e) {
    this.setData({ techPosition: e.currentTarget.dataset.val })
  },

  onActionTap(e) {
    this.setData({ techAction: e.currentTarget.dataset.val })
  },

  onNotesInput(e) {
    this.setData({ techNotes: e.detail.value })
  },

  onSubmit() {
    const { techId, techName, techPosition, techAction, techNotes } = this.data
    if (!techName.trim()) {
      wx.showToast({ title: '请输入招式名称', icon: 'none' })
      return
    }
    const id = techId || util.generateId()
    const now = Date.now()
    const tech = {
      id,
      name: techName.trim(),
      position: techPosition || '',
      action: techAction || '',
      notes: techNotes.trim() || '',
      createdAt: techId ? (storage.getTechniqueById(techId)?.createdAt || now) : now,
      updatedAt: now,
    }
    storage.saveTechnique(tech)
    wx.showToast({ title: '保存成功' })
    wx.navigateBack()
  },
})

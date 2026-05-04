const storage = require('../../utils/storage')
const util = require('../../utils/util')
const {
  TECH_POSITION_LABELS,
  ACTION_LABELS,
  TECH_POSITION_OPTIONS,
  ACTION_OPTIONS,
} = require('../../utils/constants')

Page({
  data: {
    techId: '',
    techName: '',
    techPosition: '',
    techAction: '',
    techNotes: '',
    teachVideoLinks: [{ _id: util.generateId(), url: '', title: '' }],
    TECH_POSITION_LABELS,
    ACTION_LABELS,
    techPositionOptionList: [],
    techActionOptionList: [],
    tagDialogVisible: false,
    tagDialogKind: '',
    tagDialogValue: '',
    recordDate: '',
    todayStr: '',
    showExpandModal: false,
    expandModalTitle: '',
    expandModalValue: '',
    keyboardHeight: 0,
  },

  onLoad(options) {
    this.refreshTagOptionLists()
    const todayStr = util.todayYMD()
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
          teachVideoLinks: util.getTeachVideoLinksFromTech(tech),
          recordDate: tech.recordDate || util.ymdFromTimestamp(tech.updatedAt || tech.createdAt),
          todayStr,
        })
      } else {
        this.setData({ todayStr })
      }
    } else {
      this.resetForm()
      this.setData({ todayStr })
    }

    // 监听键盘高度变化
    wx.onKeyboardHeightChange(res => {
      this.setData({ keyboardHeight: res.height })
    })
  },

  onShow() {
    this.refreshTagOptionLists()
    this.setData({ todayStr: util.todayYMD() })
  },

  onShareAppMessage() {
    const { techId, techName } = this.data
    if (techId) {
      const name = (techName || '').trim() || '招式'
      return {
        title: name.length > 28 ? `${name.slice(0, 28)}…` : `招式：${name}`,
        path: `/pages/techDetail/techDetail?id=${techId}`,
      }
    }
    return {
      title: 'Echo的柔术记录 · 编辑招式',
      path: '/pages/addTech/addTech',
    }
  },

  onShareTimeline() {
    const { techId, techName } = this.data
    if (techId) {
      const name = (techName || '').trim() || '招式'
      return {
        title: name.length > 28 ? `${name.slice(0, 28)}…` : `招式：${name}`,
        query: `id=${techId}`,
      }
    }
    return {
      title: 'Echo的柔术记录 · 编辑招式',
    }
  },

  onRecordDateChange(e) {
    this.setData({ recordDate: e.detail.value })
  },

  refreshTagOptionLists() {
    const custom = storage.getCustomTechTags()
    this.setData({
      techPositionOptionList: [...TECH_POSITION_OPTIONS, ...custom.positions],
      techActionOptionList: [...ACTION_OPTIONS, ...custom.actions],
    })
  },

  resetForm() {
    this.setData({
      techId: '',
      techName: '',
      techPosition: '',
      techAction: '',
      techNotes: '',
      teachVideoLinks: [{ _id: util.generateId(), url: '', title: '' }],
      recordDate: '',
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

  onTeachLinkUrlInput(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const value = e.detail.value
    const links = [...this.data.teachVideoLinks]
    if (!links[idx]) return
    links[idx] = { ...links[idx], url: value }
    if (/https?:\/\//i.test(value)) {
      const p = util.parsePastedVideoShareLine(value)
      const n = p.url ? util.normalizeHttpUrl(p.url) : ''
      if (n && util.isValidWebUrl(n)) {
        links[idx].url = n
        if (p.title) links[idx].title = p.title
      }
    }
    this.setData({ teachVideoLinks: links })
  },

  onTeachLinkTitleInput(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const value = e.detail.value
    const links = [...this.data.teachVideoLinks]
    if (!links[idx]) return
    links[idx] = { ...links[idx], title: value }
    if (/https?:\/\//i.test(value)) {
      const p = util.parsePastedVideoShareLine(value)
      const n = p.url ? util.normalizeHttpUrl(p.url) : ''
      if (n && util.isValidWebUrl(n)) {
        links[idx].url = n
        if (p.title) links[idx].title = p.title
      }
    }
    this.setData({ teachVideoLinks: links })
  },

  onAddTeachLinkRow() {
    const teachVideoLinks = [...this.data.teachVideoLinks, { _id: util.generateId(), url: '', title: '' }]
    this.setData({ teachVideoLinks })
  },

  onRemoveTeachLinkRow(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    let teachVideoLinks = [...this.data.teachVideoLinks]
    teachVideoLinks.splice(idx, 1)
    if (teachVideoLinks.length === 0) {
      teachVideoLinks = [{ _id: util.generateId(), url: '', title: '' }]
    }
    this.setData({ teachVideoLinks })
  },

  onAddPositionTagTap() {
    this.setData({ tagDialogVisible: true, tagDialogKind: 'position', tagDialogValue: '' })
  },

  onAddActionTagTap() {
    this.setData({ tagDialogVisible: true, tagDialogKind: 'action', tagDialogValue: '' })
  },

  onTagDialogInput(e) {
    this.setData({ tagDialogValue: e.detail.value })
  },

  onTagDialogCancel() {
    this.setData({ tagDialogVisible: false, tagDialogKind: '', tagDialogValue: '' })
  },

  onTagDialogConfirm() {
    const { tagDialogKind, tagDialogValue } = this.data
    const trimmed = (tagDialogValue || '').trim()
    if (!trimmed) {
      wx.showToast({ title: '请输入标签名称', icon: 'none' })
      return
    }
    if (tagDialogKind === 'position') {
      storage.addCustomTechPosition(trimmed)
      this.setData({ techPosition: trimmed })
    } else if (tagDialogKind === 'action') {
      storage.addCustomTechAction(trimmed)
      this.setData({ techAction: trimmed })
    }
    this.setData({ tagDialogVisible: false, tagDialogKind: '', tagDialogValue: '' })
    this.refreshTagOptionLists()
  },

  noop() {},

  onSubmit() {
    const { techId, techName, techPosition, techAction, techNotes, teachVideoLinks } = this.data
    if (!techName.trim()) {
      wx.showToast({ title: '请输入招式名称', icon: 'none' })
      return
    }
    const linkResult = util.normalizeTeachVideoLinksForSave(teachVideoLinks)
    if (!linkResult.ok) {
      wx.showToast({ title: linkResult.msg, icon: 'none' })
      return
    }
    const id = techId || util.generateId()
    const now = Date.now()
    const existing = techId ? storage.getTechniqueById(techId) : null
    const tech = {
      id,
      name: techName.trim(),
      position: techPosition || '',
      action: techAction || '',
      notes: techNotes.trim() || '',
      teachVideoLinks: linkResult.teachVideoLinks,
      teachVideoUrl: linkResult.teachVideoUrl,
      teachVideoTitle: linkResult.teachVideoTitle,
      recordDate: util.resolveRecordDateOnSave(this.data.recordDate, existing),
      createdAt: techId ? (existing?.createdAt || now) : now,
      updatedAt: now,
    }
    storage.saveTechnique(tech)
    wx.showToast({ title: '保存成功' })
    wx.navigateBack()
  },

  onExpandNotes() {
    this.setData({
      showExpandModal: true,
      expandModalTitle: '招式解说',
      expandModalValue: this.data.techNotes || '',
    })
  },

  onCancelExpand() {
    this.setData({ showExpandModal: false, expandModalTitle: '', expandModalValue: '' })
  },

  onDoneExpand() {
    this.setData({ techNotes: this.data.expandModalValue })
    this.setData({ showExpandModal: false, expandModalTitle: '', expandModalValue: '' })
  },

  onExpandInput(e) {
    this.setData({ expandModalValue: e.detail.value })
  },
})

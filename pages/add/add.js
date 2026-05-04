const storage = require('../../utils/storage')
const util = require('../../utils/util')
const {
  ACTION_LABELS,
  TECH_POSITION_LABELS,
  TECH_POSITION_OPTIONS,
  ACTION_OPTIONS,
  SESSION_CLASS_STATE_OPTIONS,
  SESSION_CLASS_STATE_LABELS,
  SESSION_PAIN_AREA_OPTIONS,
  SESSION_PAIN_AREA_LABELS,
} = require('../../utils/constants')

Page({
  data: {
    recordMode: 'session',
    sessionId: '',
    sessionClassState: '',
    sessionClassStateOptionList: [],
    SESSION_CLASS_STATE_LABELS,
    sessionPainTags: [],
    sessionPainTagOptionList: [],
    SESSION_PAIN_AREA_LABELS,
    sessionPain: '',
    sessionPractice: '',
    techName: '',
    techPosition: '',
    techAction: '',
    techNotes: '',
    teachVideoLinks: [{ _id: util.generateId(), url: '', title: '' }],
    TECH_POSITION_LABELS,
    techPositionOptionList: [],
    techActionOptionList: [],
    tagDialogVisible: false,
    tagDialogKind: '',
    tagDialogValue: '',
    ACTION_LABELS,
    recordDate: '',
    todayStr: '',
    recordSaveTipVisible: false,
    insightId: '',
    insightTitle: '',
    insightBody: '',
    showExpandModal: false,
    expandModalTitle: '',
    expandModalValue: '',
    expandModalKey: '',
    keyboardHeight: 0,
  },

  _recordSaveTipTimer: null,

  showRecordSaveSuccessTip(options = {}) {
    const duration = options.duration != null ? options.duration : 2200
    const switchToIndex = !!options.switchToIndex
    if (this._recordSaveTipTimer) {
      clearTimeout(this._recordSaveTipTimer)
      this._recordSaveTipTimer = null
    }
    this.setData({ recordSaveTipVisible: true })
    this._recordSaveTipTimer = setTimeout(() => {
      this._recordSaveTipTimer = null
      this.setData({ recordSaveTipVisible: false })
      if (switchToIndex) {
        wx.switchTab({ url: '/pages/index/index' })
      }
    }, duration)
  },

  recordSaveTipNoop() {},

  onUnload() {
    if (this._recordSaveTipTimer) {
      clearTimeout(this._recordSaveTipTimer)
      this._recordSaveTipTimer = null
    }
  },

  onShareAppMessage() {
    const { recordMode, sessionId, insightId, insightTitle } = this.data
    if (recordMode === 'session' && sessionId) {
      return {
        title: '实战表现',
        path: `/pages/sessionDetail/sessionDetail?id=${sessionId}`,
      }
    }
    if (recordMode === 'insight' && insightId) {
      const t = (insightTitle || '').trim() || '心得'
      return {
        title: t.length > 28 ? `${t.slice(0, 28)}…` : `心得：${t}`,
        path: `/pages/insightDetail/insightDetail?id=${insightId}`,
      }
    }
    return {
      title: 'Echo的柔术记录 · 新建记录',
      path: '/pages/add/add',
    }
  },

  onShareTimeline() {
    const { recordMode, sessionId, insightId, insightTitle } = this.data
    if (recordMode === 'session' && sessionId) {
      return {
        title: '实战表现',
        query: `id=${sessionId}`,
      }
    }
    if (recordMode === 'insight' && insightId) {
      const t = (insightTitle || '').trim() || '心得'
      return {
        title: t.length > 28 ? `${t.slice(0, 28)}…` : `心得：${t}`,
        query: `insightId=${insightId}`,
      }
    }
    return {
      title: 'Echo的柔术记录 · 新建记录',
    }
  },

  onShow() {
    const app = getApp()
    if (app.globalData.pendingAddSessionId) {
      const id = app.globalData.pendingAddSessionId
      app.globalData.pendingAddSessionId = ''
      app.globalData.pendingAddInsightId = ''
      this._loadSessionEdit(id)
    } else if (app.globalData.pendingAddInsightId) {
      const id = app.globalData.pendingAddInsightId
      app.globalData.pendingAddInsightId = ''
      app.globalData.pendingAddSessionId = ''
      this._loadInsightEdit(id)
    } else if (app.globalData.resetAddForm) {
      app.globalData.resetAddForm = false
      this.resetForm()
    }
    this.setData({ todayStr: util.todayYMD() })
    this.refreshTechTagOptionLists()
    this.refreshSessionClassOptionList()
    this.refreshSessionPainTagOptionList()
  },

  onRecordDateChange(e) {
    this.setData({ recordDate: e.detail.value })
  },

  onModeSwitch(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ recordMode: mode })
    if (mode === 'tech') {
      this.setData({
        techName: '',
        techPosition: '',
        techAction: '',
        techNotes: '',
        teachVideoLinks: [{ _id: util.generateId(), url: '', title: '' }],
        insightId: '',
        insightTitle: '',
        insightBody: '',
        sessionId: '',
        sessionClassState: '',
        sessionPainTags: [],
        sessionPain: '',
        sessionPractice: '',
      })
      this.refreshTechTagOptionLists()
    } else if (mode === 'insight') {
      const todayStr = util.todayYMD()
      const rd = (this.data.recordDate || '').trim()
      this.setData({
        insightId: '',
        insightTitle: '',
        insightBody: '',
        recordDate: rd || todayStr,
        sessionId: '',
        sessionClassState: '',
        sessionPainTags: [],
        sessionPain: '',
        sessionPractice: '',
      })
    } else if (mode === 'session') {
      this.setData({
        insightId: '',
        insightTitle: '',
        insightBody: '',
      })
    }
  },

  onSessionClassStateTap(e) {
    const val = e.currentTarget.dataset.val
    this.setData({ sessionClassState: this.data.sessionClassState === val ? '' : val })
  },

  onAddSessionClassStateTagTap() {
    this.setData({ tagDialogVisible: true, tagDialogKind: 'sessionClassState', tagDialogValue: '' })
  },

  onSessionPainTagTap(e) {
    const val = e.currentTarget.dataset.val
    let tags = (this.data.sessionPainTags || []).slice()
    if (val === 'painNone') {
      if (tags.indexOf('painNone') >= 0) {
        tags = tags.filter(t => t !== 'painNone')
      } else {
        tags = ['painNone']
      }
    } else {
      tags = tags.filter(t => t !== 'painNone')
      const i = tags.indexOf(val)
      if (i >= 0) tags.splice(i, 1)
      else tags.push(val)
    }
    this.setData({ sessionPainTags: tags })
  },

  onAddSessionPainTagTap() {
    this.setData({ tagDialogVisible: true, tagDialogKind: 'sessionPainTag', tagDialogValue: '' })
  },

  onSessionPainInput(e) {
    this.setData({ sessionPain: e.detail.value })
  },

  onSessionPracticeInput(e) {
    this.setData({ sessionPractice: e.detail.value })
  },

  refreshTechTagOptionLists() {
    const custom = storage.getCustomTechTags()
    this.setData({
      techPositionOptionList: [...TECH_POSITION_OPTIONS, ...custom.positions],
      techActionOptionList: [...ACTION_OPTIONS, ...custom.actions],
    })
  },

  refreshSessionClassOptionList() {
    const custom = storage.getCustomSessionClassStates()
    this.setData({
      sessionClassStateOptionList: [...SESSION_CLASS_STATE_OPTIONS, ...custom],
    })
  },

  refreshSessionPainTagOptionList() {
    const custom = storage.getCustomSessionPainTags()
    this.setData({
      sessionPainTagOptionList: [...SESSION_PAIN_AREA_OPTIONS, ...custom],
    })
  },

  _loadSessionEdit(id) {
    const s = storage.getSessionRecordById(id)
    if (!s) return false
    this.setData({
      recordMode: 'session',
      sessionId: s.id,
      sessionClassState: s.classState || '',
      sessionPainTags: Array.isArray(s.painTags) ? s.painTags.slice() : [],
      sessionPain: s.painDescription != null ? String(s.painDescription) : '',
      sessionPractice: s.practiceNotes != null ? String(s.practiceNotes) : '',
      recordDate: s.recordDate || util.ymdFromTimestamp(s.updatedAt || s.createdAt),
    })
    this.refreshSessionClassOptionList()
    this.refreshSessionPainTagOptionList()
    return true
  },

  _loadInsightEdit(id) {
    const ins = storage.getInsightById(id)
    if (!ins) return false
    this.setData({
      recordMode: 'insight',
      insightId: ins.id,
      insightTitle: ins.title || '',
      insightBody: ins.body != null ? String(ins.body) : '',
      recordDate: ins.recordDate || util.ymdFromTimestamp(ins.updatedAt || ins.createdAt),
    })
    return true
  },

  onLoad(options) {
    let sessionIdParam = options.sessionId || ''
    let insightIdParam = options.insightId || ''
    if (!sessionIdParam && !insightIdParam) {
      const app = getApp()
      sessionIdParam = app.globalData.pendingAddSessionId || ''
      insightIdParam = app.globalData.pendingAddInsightId || ''
      if (sessionIdParam) app.globalData.pendingAddSessionId = ''
      if (insightIdParam) app.globalData.pendingAddInsightId = ''
    }
    if (sessionIdParam && this._loadSessionEdit(sessionIdParam)) return
    if (insightIdParam && this._loadInsightEdit(insightIdParam)) return
    this.resetForm()

    // 监听键盘高度变化
    wx.onKeyboardHeightChange(res => {
      this.setData({ keyboardHeight: res.height })
    })
  },

  resetForm() {
    this.setData({
      recordMode: 'session',
      sessionId: '',
      sessionClassState: '',
      sessionPainTags: [],
      sessionPain: '',
      sessionPractice: '',
      techName: '',
      techPosition: '',
      techAction: '',
      techNotes: '',
      teachVideoLinks: [{ _id: util.generateId(), url: '', title: '' }],
      recordDate: '',
      insightId: '',
      insightTitle: '',
      insightBody: '',
    })
    this.refreshSessionClassOptionList()
    this.refreshSessionPainTagOptionList()
  },

  onInsightTitleInput(e) {
    this.setData({ insightTitle: e.detail.value })
  },

  onInsightBodyInput(e) {
    this.setData({ insightBody: e.detail.value })
  },

  onSubmitInsight() {
    const { insightTitle, insightBody, insightId, recordDate } = this.data
    if (!(insightTitle || '').trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' })
      return
    }
    const existing = insightId ? storage.getInsightById(insightId) : null
    const id = insightId || util.generateId()
    const now = Date.now()
    const insight = {
      id,
      title: insightTitle.trim(),
      body: (insightBody || '').trim(),
      recordDate: util.resolveRecordDateOnSave(recordDate, existing),
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    }
    storage.saveInsight(insight)
    this.showRecordSaveSuccessTip({ switchToIndex: false, duration: 2200 })
    this.setData({
      insightId: '',
      insightTitle: '',
      insightBody: '',
      recordDate: '',
    })
  },

  sessionHasContent() {
    const { sessionClassState, sessionPainTags, sessionPain, sessionPractice } = this.data
    const pain = (sessionPain || '').trim()
    const pr = (sessionPractice || '').trim()
    const tagLen = (sessionPainTags && sessionPainTags.length) || 0
    return Boolean(sessionClassState || tagLen || pain || pr)
  },

  onSubmitSession() {
    if (!this.sessionHasContent()) {
      wx.showToast({ title: '请至少填写一项', icon: 'none' })
      return
    }
    const { sessionId, sessionClassState, sessionPainTags, sessionPain, sessionPractice, recordDate } = this.data
    const existing = sessionId ? storage.getSessionRecordById(sessionId) : null
    const id = sessionId || util.generateId()
    const now = Date.now()
    const rec = {
      id,
      classState: sessionClassState || '',
      painTags: Array.isArray(sessionPainTags) ? sessionPainTags.slice() : [],
      painDescription: (sessionPain || '').trim(),
      practiceNotes: (sessionPractice || '').trim(),
      recordDate: util.resolveRecordDateOnSave(recordDate, existing),
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    }
    storage.saveSessionRecord(rec)
    this.resetForm()
    this.showRecordSaveSuccessTip({ switchToIndex: true, duration: 2200 })
  },

  onTechNameInput(e) {
    this.setData({ techName: e.detail.value })
  },

  onTechPositionTap(e) {
    this.setData({ techPosition: e.currentTarget.dataset.val })
  },

  onTechActionTap(e) {
    this.setData({ techAction: e.currentTarget.dataset.val })
  },

  onAddTechPositionTagTap() {
    this.setData({ tagDialogVisible: true, tagDialogKind: 'position', tagDialogValue: '' })
  },

  onAddTechActionTagTap() {
    this.setData({ tagDialogVisible: true, tagDialogKind: 'action', tagDialogValue: '' })
  },

  onTechTagDialogInput(e) {
    this.setData({ tagDialogValue: e.detail.value })
  },

  onTechTagDialogCancel() {
    this.setData({ tagDialogVisible: false, tagDialogKind: '', tagDialogValue: '' })
  },

  onTechTagDialogConfirm() {
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
    } else if (tagDialogKind === 'sessionClassState') {
      storage.addCustomSessionClassState(trimmed)
      this.setData({ sessionClassState: trimmed })
    } else if (tagDialogKind === 'sessionPainTag') {
      storage.addCustomSessionPainTag(trimmed)
      let tags = (this.data.sessionPainTags || []).slice()
      tags = tags.filter(t => t !== 'painNone')
      if (tags.indexOf(trimmed) < 0) tags.push(trimmed)
      this.setData({ sessionPainTags: tags })
    }
    this.setData({ tagDialogVisible: false, tagDialogKind: '', tagDialogValue: '' })
    this.refreshTechTagOptionLists()
    this.refreshSessionClassOptionList()
    this.refreshSessionPainTagOptionList()
  },

  tagDialogNoop() {},

  onTechNotesInput(e) {
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

  onSubmitTech() {
    const { techName, techPosition, techAction, techNotes, teachVideoLinks } = this.data
    if (!techName.trim()) {
      wx.showToast({ title: '请输入招式名称', icon: 'none' })
      return
    }
    const linkResult = util.normalizeTeachVideoLinksForSave(teachVideoLinks)
    if (!linkResult.ok) {
      wx.showToast({ title: linkResult.msg, icon: 'none' })
      return
    }
    const id = util.generateId()
    const now = Date.now()
    const tech = {
      id,
      name: techName.trim(),
      position: techPosition || '',
      action: techAction || '',
      notes: techNotes.trim() || '',
      teachVideoLinks: linkResult.teachVideoLinks,
      teachVideoUrl: linkResult.teachVideoUrl,
      teachVideoTitle: linkResult.teachVideoTitle,
      recordDate: util.resolveRecordDateOnSave(this.data.recordDate, null),
      createdAt: now,
      updatedAt: now,
    }
    storage.saveTechnique(tech)
    this.showRecordSaveSuccessTip({ switchToIndex: false, duration: 2200 })
    this.setData({
      techName: '',
      techPosition: '',
      techAction: '',
      techNotes: '',
      teachVideoLinks: [{ _id: util.generateId(), url: '', title: '' }],
    })
    this.refreshTechTagOptionLists()
  },

  noop() {},

  onExpandPractice() {
    this.setData({
      showExpandModal: true,
      expandModalTitle: '实战表现',
      expandModalValue: this.data.sessionPractice || '',
      expandModalKey: 'sessionPractice',
    })
  },

  onExpandTechNotes() {
    this.setData({
      showExpandModal: true,
      expandModalTitle: '招式解说',
      expandModalValue: this.data.techNotes || '',
      expandModalKey: 'techNotes',
    })
  },

  onExpandInsightBody() {
    this.setData({
      showExpandModal: true,
      expandModalTitle: '正文',
      expandModalValue: this.data.insightBody || '',
      expandModalKey: 'insightBody',
    })
  },

  onDoneExpand() {
    const { expandModalKey, expandModalValue } = this.data
    if (expandModalKey === 'sessionPractice') {
      this.setData({ sessionPractice: expandModalValue })
    } else if (expandModalKey === 'techNotes') {
      this.setData({ techNotes: expandModalValue })
    } else if (expandModalKey === 'insightBody') {
      this.setData({ insightBody: expandModalValue })
    }
    this.setData({ showExpandModal: false, expandModalTitle: '', expandModalValue: '', expandModalKey: '' })
  },

  onExpandInput(e) {
    this.setData({ expandModalValue: e.detail.value })
  },
})

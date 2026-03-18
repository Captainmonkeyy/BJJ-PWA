const storage = require('../../utils/storage')
const util = require('../../utils/util')
const {
  POSITION_LABELS,
  ACTION_LABELS,
  POSITION_OPTIONS,
  ACTION_OPTIONS,
  START_POSITION_OPTIONS,
  START_POSITION_LABELS,
  TOP_ACTION_OPTIONS,
  TOP_ACTION_LABELS,
  BOTTOM_ACTION_OPTIONS,
  BOTTOM_ACTION_LABELS,
  STEP_STATE_OPTIONS,
  STEP_STATE_LABELS,
  STEP_POSITION_OPTIONS,
  STEP_ACTION_OPTIONS,
} = require('../../utils/constants')

Page({
  data: {
    recordMode: 'flow',
    flowId: '',
    flowName: '',
    startPosition: '', // top | bottom
    startAction: '',
    steps: [],
    decisions: [],
    notes: [],
    showStepForm: false,
    editingStepIndex: -1,
    stepState: '',
    stepPosition: '',
    stepAction: '',
    decisionTrigger: '',
    noteContent: '',
    techName: '',
    techPosition: '',
    techAction: '',
    techNotes: '',
    POSITION_LABELS,
    ACTION_LABELS,
    POSITION_OPTIONS,
    ACTION_OPTIONS,
    START_POSITION_OPTIONS,
    START_POSITION_LABELS,
    TOP_ACTION_OPTIONS,
    TOP_ACTION_LABELS,
    BOTTOM_ACTION_OPTIONS,
    BOTTOM_ACTION_LABELS,
    STEP_STATE_OPTIONS,
    STEP_STATE_LABELS,
    STEP_POSITION_OPTIONS,
    STEP_ACTION_OPTIONS,
  },

  onShow() {
    if (getApp().globalData.createNewFlow) {
      getApp().globalData.createNewFlow = false
      this.resetForm()
    }
  },

  onModeSwitch(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ recordMode: mode })
    if (mode === 'tech') {
      this.setData({ techName: '', techPosition: '', techAction: '', techNotes: '' })
    }
  },

  onLoad(options) {
    const flowId = options.id || ''
    if (flowId) {
      const flow = storage.getFlowById(flowId)
      if (flow) {
        const steps = storage.getStepsByFlowId(flowId)
        const decisions = storage.getDecisionsByFlowId(flowId)
        const notes = storage.getNotesByFlowId(flowId)
        const startPosition = (flow.startPosition === 'top' || flow.startPosition === 'bottom') ? flow.startPosition : ''
        const startAction = startPosition ? (flow.startAction || '') : ''
        this.setData({
          recordMode: 'flow',
          flowId,
          flowName: flow.name,
          startPosition,
          startAction,
          steps,
          decisions,
          notes,
        })
      }
    } else {
      this.resetForm()
    }
  },

  resetForm() {
    this.setData({
      recordMode: 'flow',
      flowId: '',
      flowName: '',
      startPosition: '',
      startAction: '',
      steps: [],
      decisions: [],
      notes: [],
      showStepForm: false,
      editingStepIndex: -1,
      stepState: '',
      stepPosition: '',
      stepAction: '',
      decisionTrigger: '',
      noteContent: '',
      techName: '',
      techPosition: '',
      techAction: '',
      techNotes: '',
    })
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

  onTechNotesInput(e) {
    this.setData({ techNotes: e.detail.value })
  },

  onSubmitTech() {
    const { techName, techPosition, techAction, techNotes } = this.data
    if (!techName.trim()) {
      wx.showToast({ title: '请输入招式名称', icon: 'none' })
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
      createdAt: now,
      updatedAt: now,
    }
    storage.saveTechnique(tech)
    wx.showToast({ title: '保存成功' })
    this.setData({ techName: '', techPosition: '', techAction: '', techNotes: '' })
  },

  onEnterCanvas() {
    const { flowId } = this.data
    if (flowId) {
      wx.navigateTo({ url: `/pages/flowEditor/flowEditor?id=${flowId}` })
    } else {
      getApp().globalData.draftFlow = {
        flowName: this.data.flowName,
        startPosition: this.data.startPosition,
        startAction: this.data.startAction,
      }
      wx.navigateTo({ url: '/pages/flowEditor/flowEditor' })
    }
  },

  onFlowNameInput(e) {
    this.setData({ flowName: e.detail.value })
  },

  onStartPositionTap(e) {
    const pos = e.currentTarget.dataset.val
    this.setData({
      startPosition: pos,
      startAction: '',
    })
  },

  onStartActionTap(e) {
    this.setData({ startAction: e.currentTarget.dataset.val })
  },

  onStepStateTap(e) {
    this.setData({
      stepState: e.currentTarget.dataset.val,
      stepPosition: '',
      stepAction: '',
    })
  },

  onStepPositionTap(e) {
    this.setData({ stepPosition: e.currentTarget.dataset.val })
  },

  onStepActionTap(e) {
    this.setData({ stepAction: e.currentTarget.dataset.val })
  },

  onAddStep() {
    this.setData({
      showStepForm: true,
      editingStepIndex: -1,
      stepState: '',
      stepPosition: '',
      stepAction: '',
    })
  },

  onEditStep(e) {
    const idx = e.currentTarget.dataset.idx
    const s = this.data.steps[idx]
    this.setData({
      showStepForm: true,
      editingStepIndex: idx,
      stepState: s.state || '',
      stepPosition: s.position || '',
      stepAction: s.action || '',
    })
  },

  onRemoveStep(e) {
    const idx = e.currentTarget.dataset.idx
    const steps = this.data.steps.filter((_, i) => i !== idx)
    this.setData({ steps })
  },

  onSaveStep() {
    const { steps, stepState, stepPosition, stepAction, editingStepIndex } = this.data
    if (!stepState) {
      wx.showToast({ title: '请选择状态（压制/逃脱）', icon: 'none' })
      return
    }
    if (!stepPosition) {
      wx.showToast({ title: '请选择位置', icon: 'none' })
      return
    }
    if (!stepAction) {
      wx.showToast({ title: '请选择动作类型', icon: 'none' })
      return
    }
    const step = {
      id: util.generateId(),
      state: stepState,
      position: stepPosition,
      action: stepAction,
      order: steps.length + 1,
    }
    if (editingStepIndex >= 0) {
      step.id = steps[editingStepIndex].id
      const next = [...steps]
      next[editingStepIndex] = step
      this.setData({ steps: next, showStepForm: false, editingStepIndex: -1, stepState: '', stepPosition: '', stepAction: '' })
    } else {
      this.setData({ steps: [...steps, step], showStepForm: false, stepState: '', stepPosition: '', stepAction: '' })
    }
  },

  onCancelStep() {
    this.setData({ showStepForm: false, editingStepIndex: -1, stepState: '', stepPosition: '', stepAction: '' })
  },

  onDecisionTriggerInput(e) {
    this.setData({ decisionTrigger: e.detail.value })
  },

  onAddDecision() {
    const { decisions, decisionTrigger } = this.data
    if (!decisionTrigger.trim()) {
      wx.showToast({ title: '请输入触发条件', icon: 'none' })
      return
    }
    const decision = {
      id: util.generateId(),
      trigger: decisionTrigger.trim(),
    }
    this.setData({
      decisions: [...decisions, decision],
      decisionTrigger: '',
    })
  },

  onRemoveDecision(e) {
    const idx = e.currentTarget.dataset.idx
    const decisions = this.data.decisions.filter((_, i) => i !== idx)
    this.setData({ decisions })
  },

  onNoteInput(e) {
    const idx = e.currentTarget.dataset.idx
    const val = e.detail.value
    const notes = [...this.data.notes]
    notes[idx] = { ...(notes[idx] || {}), id: notes[idx]?.id || util.generateId(), content: val }
    this.setData({ notes })
  },

  onAddNote() {
    const { notes } = this.data
    if (notes.length >= 3) {
      wx.showToast({ title: '最多 3 条关键点', icon: 'none' })
      return
    }
    this.setData({
      notes: [...notes, { id: util.generateId(), content: '' }],
    })
  },

  onRemoveNote(e) {
    const idx = e.currentTarget.dataset.idx
    const notes = this.data.notes.filter((_, i) => i !== idx)
    this.setData({ notes })
  },

  onSubmit() {
    const { flowId, flowName, startPosition, startAction, steps, decisions, notes } = this.data
    if (!flowName.trim()) {
      wx.showToast({ title: '请输入流程名称', icon: 'none' })
      return
    }
    if (!startPosition) {
      wx.showToast({ title: '请选择起始位置（上位/下位）', icon: 'none' })
      return
    }
    if (!startAction) {
      wx.showToast({ title: '请选择起始动作', icon: 'none' })
      return
    }
    const id = flowId || util.generateId()
    const now = Date.now()
    const flow = {
      id,
      name: flowName.trim(),
      startPosition,
      startAction,
      tags: [],
      createdAt: flowId ? (storage.getFlowById(flowId)?.createdAt || now) : now,
      updatedAt: now,
    }
    storage.saveFlow(flow)
    storage.saveSteps(id, steps.map((s, i) => ({ ...s, order: i + 1 })))
    storage.saveDecisions(id, decisions)
    storage.saveNotes(id, notes.filter(n => n.content && n.content.trim()))
    wx.showToast({ title: '保存成功' })
    wx.switchTab({ url: '/pages/index/index' })
  },
})

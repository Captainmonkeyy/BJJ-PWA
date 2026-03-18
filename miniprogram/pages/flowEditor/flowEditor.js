const storage = require('../../utils/storage')
const util = require('../../utils/util')
const { buildTree, flattenTree, getNodeLabel, canAddBranch } = require('../../utils/flowTree')
const {
  STEP_STATE_LABELS,
  STEP_STATE_OPTIONS,
  POSITION_LABELS,
  ACTION_LABELS,
  STEP_POSITION_OPTIONS,
  STEP_ACTION_OPTIONS,
} = require('../../utils/constants')

Page({
  data: {
    flowId: '',
    flowName: '',
    startPosition: '',
    startAction: '',
    nodes: [],
    edges: [],
    rootId: '',
    notes: [],
    selectedNodeId: '',
    showAddMenu: false,
    showStepForm: false,
    showBranchForm: false,
    showTechPicker: false,
    stepState: '',
    stepPosition: '',
    stepAction: '',
    branchTrigger: '',
    addFromNodeId: '',
    treeRows: [],
    techniques: [],
    techMap: {},
    STEP_STATE_LABELS,
    STEP_STATE_OPTIONS,
    POSITION_LABELS,
    ACTION_LABELS,
    STEP_POSITION_OPTIONS,
    STEP_ACTION_OPTIONS,
  },

  onBack() {
    wx.navigateBack()
  },

  onModalTap() {
    // 阻止点击弹窗内容时冒泡到遮罩，避免误关闭
  },

  onCancelAddMenu() {
    this.setData({ showAddMenu: false })
  },

  onLoad(options) {
    const flowId = options.id || ''
    if (flowId) {
      const flow = storage.getFlowById(flowId)
      if (flow) {
        this.loadFlow(flow)
      }
    } else {
      const draft = getApp().globalData.draftFlow || {}
      this.setData({
        flowId: '',
        flowName: draft.flowName || '',
        startPosition: draft.startPosition || '',
        startAction: draft.startAction || '',
        nodes: [],
        edges: [],
        rootId: '',
        notes: [],
      })
      getApp().globalData.draftFlow = null
    }
    this.loadTechniques()
  },

  loadFlow(flow) {
    let nodes = flow.nodes || []
    let edges = flow.edges || []
    let rootId = flow.rootId || ''
    if (nodes.length === 0 && !rootId) {
      const steps = storage.getStepsByFlowId(flow.id)
      const decisions = storage.getDecisionsByFlowId(flow.id)
      if (steps.length > 0) {
        nodes = steps.map((s, i) => ({
          id: s.id || util.generateId(),
          type: 'step',
          step: { state: s.state, position: s.position, action: s.action },
        }))
        for (let i = 0; i < nodes.length - 1; i++) {
          const branch = decisions[i]?.trigger || null
          edges.push({
            id: util.generateId(),
            from: nodes[i].id,
            to: nodes[i + 1].id,
            branch,
          })
        }
        rootId = nodes[0]?.id || ''
      }
    } else if (!rootId && nodes[0]) {
      rootId = nodes[0].id
    }
    const startPosition = (flow.startPosition === 'top' || flow.startPosition === 'bottom') ? flow.startPosition : ''
    const startAction = startPosition ? (flow.startAction || '') : ''
    this.setData({
      flowId: flow.id,
      flowName: flow.name || '',
      startPosition,
      startAction,
      nodes,
      edges,
      rootId,
      notes: flow.notes || [],
    })
    this.refreshTree()
  },

  loadTechniques() {
    const techniques = storage.getAllTechniques()
    const techMap = {}
    techniques.forEach(t => { techMap[t.id] = t })
    this.setData({ techniques, techMap })
  },

  refreshTree() {
    const { nodes, edges, rootId, techMap } = this.data
    const tree = buildTree(nodes, edges, rootId)
    const flat = flattenTree(tree, techMap)
    const treeRows = flat.map(r => ({
      ...r,
      canAddBranch: canAddBranch(edges, rootId, r.node?.id),
    }))
    this.setData({ treeRows })
  },

  onFlowNameInput(e) {
    this.setData({ flowName: e.detail.value })
  },

  onStartPositionTap(e) {
    this.setData({
      startPosition: e.currentTarget.dataset.val,
      startAction: '',
    })
  },

  onStartActionTap(e) {
    this.setData({ startAction: e.currentTarget.dataset.val })
  },

  onAddFirstNode() {
    const { rootId, selectedNodeId, edges } = this.data
    const addFromNodeId = selectedNodeId || rootId || ''
    if (addFromNodeId && !canAddBranch(edges, rootId, addFromNodeId)) {
      wx.showToast({
        title: '已达上限：每节点最多3分支，树深度最多3层',
        icon: 'none',
      })
      return
    }
    this.setData({ showAddMenu: true, addFromNodeId })
  },

  onAddBranch(e) {
    const nodeId = e.currentTarget.dataset.id
    const { edges, rootId } = this.data
    if (!canAddBranch(edges, rootId, nodeId)) {
      wx.showToast({
        title: '已达上限：每节点最多3分支，树深度最多3层',
        icon: 'none',
      })
      return
    }
    this.setData({
      showBranchForm: true,
      addFromNodeId: nodeId,
      branchTrigger: '',
    })
  },

  onNodeTap(e) {
    const nodeId = e.currentTarget.dataset.id
    this.setData({
      selectedNodeId: this.data.selectedNodeId === nodeId ? '' : nodeId,
    })
  },

  onAddStep() {
    this.setData({
      showAddMenu: false,
      showStepForm: true,
      stepState: '',
      stepPosition: '',
      stepAction: '',
    })
  },

  onAddTechFromLib() {
    this.setData({
      showAddMenu: false,
      showTechPicker: true,
    })
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

  onSaveStep() {
    const { stepState, stepPosition, stepAction, nodes, rootId, addFromNodeId, edges } = this.data
    if (!stepState || !stepPosition || !stepAction) {
      wx.showToast({ title: '请完成步骤选择', icon: 'none' })
      return
    }
    if (addFromNodeId && !canAddBranch(edges, rootId, addFromNodeId)) {
      wx.showToast({ title: '已达上限：每节点最多3分支，树深度最多3层', icon: 'none' })
      return
    }
    const nodeId = util.generateId()
    const node = {
      id: nodeId,
      type: 'step',
      step: { state: stepState, position: stepPosition, action: stepAction },
    }
    const newNodes = [...nodes, node]
    let newEdges = [...this.data.edges]
    let newRootId = rootId

    if (!rootId) {
      newRootId = nodeId
    } else if (addFromNodeId) {
      newEdges = [...newEdges, {
        id: util.generateId(),
        from: addFromNodeId,
        to: nodeId,
        branch: this.data.branchTrigger?.trim() || null,
      }]
    }

    this.setData({
      nodes: newNodes,
      edges: newEdges,
      rootId: newRootId,
      showStepForm: false,
      addFromNodeId: '',
      branchTrigger: '',
    })
    this.refreshTree()
  },

  onSelectTech(e) {
    const techId = e.currentTarget.dataset.id
    const tech = this.data.techMap[techId]
    if (!tech) return
    const { nodes, rootId, addFromNodeId, edges } = this.data
    if (addFromNodeId && !canAddBranch(edges, rootId, addFromNodeId)) {
      wx.showToast({ title: '已达上限：每节点最多3分支，树深度最多3层', icon: 'none' })
      return
    }
    const nodeId = util.generateId()
    const node = {
      id: nodeId,
      type: 'tech',
      techId: tech.id,
      label: tech.name,
    }
    const newNodes = [...nodes, node]
    let newEdges = [...this.data.edges]
    let newRootId = rootId

    if (!rootId) {
      newRootId = nodeId
    } else if (addFromNodeId) {
      newEdges = [...newEdges, {
        id: util.generateId(),
        from: addFromNodeId,
        to: nodeId,
        branch: this.data.branchTrigger?.trim() || null,
      }]
    }

    this.setData({
      nodes: newNodes,
      edges: newEdges,
      rootId: newRootId,
      showTechPicker: false,
      addFromNodeId: '',
      branchTrigger: '',
    })
    this.refreshTree()
  },

  onBranchTriggerInput(e) {
    this.setData({ branchTrigger: e.detail.value })
  },

  onBranchThenStep() {
    const { addFromNodeId } = this.data
    if (!addFromNodeId) return
    this.setData({
      showBranchForm: false,
      showStepForm: true,
      stepState: '',
      stepPosition: '',
      stepAction: '',
    })
  },

  onBranchThenTech() {
    const { addFromNodeId } = this.data
    if (!addFromNodeId) return
    this.setData({
      showBranchForm: false,
      showTechPicker: true,
    })
  },

  onCancelBranch() {
    this.setData({
      showBranchForm: false,
      addFromNodeId: '',
      branchTrigger: '',
    })
  },

  onCancelStep() {
    this.setData({
      showStepForm: false,
      stepState: '',
      stepPosition: '',
      stepAction: '',
    })
  },

  onRemoveNode(e) {
    const nodeId = e.currentTarget.dataset.id
    const { nodes, edges, rootId } = this.data
    const newNodes = nodes.filter(n => n.id !== nodeId)
    const newEdges = edges.filter(edge => edge.from !== nodeId && edge.to !== nodeId)
    let newRootId = rootId
    if (rootId === nodeId) {
      const firstEdge = edges.find(edge => edge.from === nodeId)
      newRootId = firstEdge ? firstEdge.to : (newNodes[0]?.id || '')
    }
    this.setData({
      nodes: newNodes,
      edges: newEdges,
      rootId: newRootId,
      selectedNodeId: '',
    })
    this.refreshTree()
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
    this.setData({ notes: [...notes, { id: util.generateId(), content: '' }] })
  },

  onRemoveNote(e) {
    const idx = e.currentTarget.dataset.idx
    this.setData({ notes: this.data.notes.filter((_, i) => i !== idx) })
  },

  onSubmit() {
    const { flowId, flowName, startPosition, startAction, nodes, edges, rootId, notes } = this.data
    if (!flowName.trim()) {
      wx.showToast({ title: '请输入流程名称', icon: 'none' })
      return
    }
    if (!startPosition || !startAction) {
      wx.showToast({ title: '请选择起始位置和动作', icon: 'none' })
      return
    }
    if (!rootId || nodes.length === 0) {
      wx.showToast({ title: '请至少添加一个节点', icon: 'none' })
      return
    }
    const id = flowId || util.generateId()
    const now = Date.now()
    const flow = {
      id,
      name: flowName.trim(),
      startPosition,
      startAction,
      nodes,
      edges,
      rootId,
      notes: notes.filter(n => n.content && n.content.trim()),
      tags: [],
      createdAt: flowId ? (storage.getFlowById(flowId)?.createdAt || now) : now,
      updatedAt: now,
    }
    storage.saveFlow(flow)
    wx.showToast({ title: '保存成功' })
    wx.navigateBack()
  },
})

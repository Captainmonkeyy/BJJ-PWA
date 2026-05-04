const storage = require('../../utils/storage')
const flowSeg = require('../../utils/flowSegments')
const { buildTree, flattenTree } = require('../../utils/flowTree')
const {
  START_POSITION_LABELS,
  TOP_ACTION_LABELS,
  BOTTOM_ACTION_LABELS,
  STEP_STATE_LABELS,
  POSITION_LABELS,
  ACTION_LABELS,
} = require('../../utils/constants')

function normalizeTechExplain(tech) {
  if (!tech || tech.notes == null) return ''
  return String(tech.notes).trim()
}

function formatFlowStart(flow) {
  if (!flow) return ''
  if (flow.startPosition === 'top' && flow.startAction) {
    return `${START_POSITION_LABELS.top} · ${TOP_ACTION_LABELS[flow.startAction] || flow.startAction}`
  }
  if (flow.startPosition === 'bottom' && flow.startAction) {
    return `${START_POSITION_LABELS.bottom} · ${BOTTOM_ACTION_LABELS[flow.startAction] || flow.startAction}`
  }
  return flow.startPosition || ''
}

Page({
  data: {
    flow: null,
    useSegments: false,
    displaySegments: [],
    flowStartText: '',
    treeRows: [],
    techMap: {},
    steps: [],
    decisions: [],
    notes: [],
    previewVisible: false,
    previewMissing: false,
    previewName: '',
    previewTagLine: '',
    previewMissingText: '',
    previewExplainNotes: '',
    popLeftPx: 0,
    popTopPx: 0,
    STEP_STATE_LABELS,
    POSITION_LABELS,
    ACTION_LABELS,
  },

  onLoad(options) {
    const id = options.id
    if (!id) return
    const flow = storage.getFlowById(id)
    if (!flow) return
    const techMap = {}
    storage.getAllTechniques().forEach(t => {
      techMap[t.id] = t
      techMap[String(t.id)] = t
    })

    if (flow.contentFormat === 2 && Array.isArray(flow.segments)) {
      const normalized = flowSeg.ensureSegmentUids(flow.segments || [])
      const displaySegments = normalized.map((s, i) => ({
        ...s,
        uid: s.uid || `seg-${i}`,
      }))
      this.setData({
        flow,
        useSegments: true,
        displaySegments,
        flowStartText: '',
        treeRows: [],
        steps: [],
        decisions: [],
        notes: [],
        techMap,
      })
      return
    }

    const notes = flow.notes || []
    const flowStartText = formatFlowStart(flow)
    let treeRows = []
    let steps = []
    let decisions = []
    if (Array.isArray(flow.nodes) && flow.nodes.length > 0 && flow.edges && flow.rootId) {
      const tree = buildTree(flow.nodes, flow.edges, flow.rootId)
      treeRows = flattenTree(tree, techMap)
    } else {
      steps = storage.getStepsByFlowId(id)
      decisions = storage.getDecisionsByFlowId(id)
    }
    this.setData({
      flow,
      useSegments: false,
      displaySegments: [],
      flowStartText,
      treeRows,
      steps,
      decisions,
      notes,
      techMap,
    })
  },

  onShareAppMessage() {
    const flow = this.data.flow
    const id = flow && flow.id
    if (!id) {
      return { title: 'Echo的柔术记录', path: '/pages/index/index' }
    }
    const name = ((flow && flow.name) || '流程').trim()
    const title = name.length > 28 ? `${name.slice(0, 28)}…` : `流程：${name}`
    return {
      title,
      path: `/pages/classDetail/classDetail?id=${id}`,
    }
  },

  onShareTimeline() {
    const flow = this.data.flow
    const id = flow && flow.id
    if (!id) {
      return { title: 'Echo的柔术记录' }
    }
    const name = ((flow && flow.name) || '流程').trim()
    const title = name.length > 28 ? `${name.slice(0, 28)}…` : `流程：${name}`
    return {
      title,
      query: `id=${id}`,
    }
  },

  onBack() {
    wx.navigateBack()
  },

  onEdit() {
    wx.showToast({ title: '新建页已不支持编辑流程，本条仅可查看', icon: 'none', duration: 2800 })
  },

  onTechLinkTap(e) {
    const uid = e.currentTarget.dataset.uid
    const seg = (this.data.displaySegments || []).find(
      s => s.type === 'tech' && (s.uid === uid || String(s.uid) === String(uid)),
    )
    const tid = seg && seg.techId != null && seg.techId !== '' ? seg.techId : e.currentTarget.dataset.tid
    const snapName = (seg && seg.name) || e.currentTarget.dataset.name || ''
    const snapTag = (seg && seg.tagLine) || e.currentTarget.dataset.tag || ''
    const t = storage.getTechniqueById(tid)
    const applyPreview = (popLeftPx, popTopPx) => {
      if (t) {
        this.setData({
          previewVisible: true,
          previewMissing: false,
          previewMissingText: '',
          previewName: t.name || '',
          previewTagLine: flowSeg.techTagLine(t),
          previewExplainNotes: normalizeTechExplain(t),
          popLeftPx,
          popTopPx,
        })
      } else {
        this.setData({
          previewVisible: true,
          previewMissing: true,
          previewMissingText: '该招式可能已被删除，以上为保存时的快照。',
          previewName: snapName || '招式',
          previewTagLine: snapTag || '',
          previewExplainNotes: '',
          popLeftPx,
          popTopPx,
        })
      }
    }
    const win = typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const winW = win.windowWidth || win.screenWidth
    const winH = win.windowHeight || win.screenHeight
    const q = wx.createSelectorQuery().in(this)
    q.select(`#pill-${uid}`).boundingClientRect()
    q.exec(res => {
      const rect = res && res[0]
      const margin = 8
      const popW = Math.min(winW * 0.88, 300)
      if (!rect) {
        applyPreview(margin, 120)
        return
      }
      let left = rect.left
      let top = rect.bottom + margin
      if (left + popW > winW - margin) left = Math.max(margin, winW - margin - popW)
      const estH = 320
      if (top + estH > winH - margin) top = Math.max(margin, rect.top - estH - margin)
      applyPreview(left, top)
    })
  },

  onClosePreviewMask() {
    this.setData({
      previewVisible: false,
      previewMissing: false,
      previewName: '',
      previewTagLine: '',
      previewMissingText: '',
      previewExplainNotes: '',
      popLeftPx: 0,
      popTopPx: 0,
    })
  },

  previewCardNoop() {},
})

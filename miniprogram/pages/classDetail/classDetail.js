const storage = require('../../utils/storage')
const { buildTree, flattenTree, getNodeLabel } = require('../../utils/flowTree')
const {
  START_POSITION_LABELS,
  TOP_ACTION_LABELS,
  BOTTOM_ACTION_LABELS,
  STEP_STATE_LABELS,
  POSITION_LABELS,
  ACTION_LABELS,
} = require('../../utils/constants')

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
    flowStartText: '',
    treeRows: [],
    techMap: {},
    steps: [],
    decisions: [],
    notes: [],
  },

  onLoad(options) {
    const id = options.id
    if (id) {
      const flow = storage.getFlowById(id)
      if (flow) {
        const notes = flow.notes || []
        const flowStartText = formatFlowStart(flow)
        const techMap = {}
        storage.getAllTechniques().forEach(t => { techMap[t.id] = t })
        let treeRows = []
        let steps = []
        let decisions = []
        if (flow.nodes && flow.edges && flow.rootId) {
          const tree = buildTree(flow.nodes, flow.edges, flow.rootId)
          treeRows = flattenTree(tree, techMap)
        } else {
          steps = storage.getStepsByFlowId(id)
          decisions = storage.getDecisionsByFlowId(id)
        }
        this.setData({
          flow,
          flowStartText,
          treeRows,
          steps,
          decisions,
          notes,
          techMap,
          STEP_STATE_LABELS,
          POSITION_LABELS,
          ACTION_LABELS,
        })
      }
    }
  },

  onBack() {
    wx.navigateBack()
  },

  onEdit() {
    const { flow } = this.data
    if (flow) {
      wx.navigateTo({ url: `/pages/flowEditor/flowEditor?id=${flow.id}` })
    }
  },
})

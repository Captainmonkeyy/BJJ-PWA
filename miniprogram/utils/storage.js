/**
 * 柔术训练记录 - 本地存储
 * keys: flows, steps, decisions, notes, techniques
 */

const FLOWS_KEY = 'flows'
const TECHNIQUES_KEY = 'techniques'
const STEPS_KEY = 'steps'
const DECISIONS_KEY = 'decisions'
const NOTES_KEY = 'notes'

// --- Flows ---
function getAllFlows() {
  const data = wx.getStorageSync(FLOWS_KEY)
  return Array.isArray(data) ? data : []
}

function getFlowById(id) {
  return getAllFlows().find(f => f.id === id) || null
}

function saveFlow(flow) {
  const flows = getAllFlows()
  const idx = flows.findIndex(f => f.id === flow.id)
  const now = Date.now()
  const toSave = {
    ...flow,
    updatedAt: now,
    createdAt: flow.createdAt || now,
  }
  if (idx >= 0) {
    flows[idx] = toSave
  } else {
    flows.push(toSave)
  }
  wx.setStorageSync(FLOWS_KEY, flows)
}

function deleteFlow(id) {
  const flows = getAllFlows().filter(f => f.id !== id)
  wx.setStorageSync(FLOWS_KEY, flows)
  deleteStepsByFlowId(id)
  deleteDecisionsByFlowId(id)
  deleteNotesByFlowId(id)
}

// --- Steps ---
function getStepsByFlowId(flowId) {
  const data = wx.getStorageSync(STEPS_KEY)
  const steps = Array.isArray(data) ? data : []
  return steps.filter(s => s.flowId === flowId).sort((a, b) => a.order - b.order)
}

function saveSteps(flowId, steps) {
  const all = wx.getStorageSync(STEPS_KEY) || []
  const others = all.filter(s => s.flowId !== flowId)
  const toSave = steps.map((s, i) => ({
    ...s,
    flowId,
    order: i + 1,
  }))
  wx.setStorageSync(STEPS_KEY, [...others, ...toSave])
}

function deleteStepsByFlowId(flowId) {
  const all = (wx.getStorageSync(STEPS_KEY) || []).filter(s => s.flowId !== flowId)
  wx.setStorageSync(STEPS_KEY, all)
}

// --- Decisions ---
function getDecisionsByFlowId(flowId) {
  const data = wx.getStorageSync(DECISIONS_KEY)
  const decisions = Array.isArray(data) ? data : []
  return decisions.filter(d => d.flowId === flowId)
}

function saveDecisions(flowId, decisions) {
  const all = wx.getStorageSync(DECISIONS_KEY) || []
  const others = all.filter(d => d.flowId !== flowId)
  const toSave = decisions.map(d => ({ ...d, flowId }))
  wx.setStorageSync(DECISIONS_KEY, [...others, ...toSave])
}

function deleteDecisionsByFlowId(flowId) {
  const all = (wx.getStorageSync(DECISIONS_KEY) || []).filter(d => d.flowId !== flowId)
  wx.setStorageSync(DECISIONS_KEY, all)
}

// --- Notes ---
function getNotesByFlowId(flowId) {
  const data = wx.getStorageSync(NOTES_KEY)
  const notes = Array.isArray(data) ? data : []
  return notes.filter(n => n.flowId === flowId)
}

function saveNotes(flowId, notes) {
  const all = wx.getStorageSync(NOTES_KEY) || []
  const others = all.filter(n => n.flowId !== flowId)
  const toSave = notes.map(n => ({ ...n, flowId }))
  wx.setStorageSync(NOTES_KEY, [...others, ...toSave])
}

function deleteNotesByFlowId(flowId) {
  const all = (wx.getStorageSync(NOTES_KEY) || []).filter(n => n.flowId !== flowId)
  wx.setStorageSync(NOTES_KEY, all)
}

// --- 招式 (Techniques) ---
function getAllTechniques() {
  const data = wx.getStorageSync(TECHNIQUES_KEY)
  return Array.isArray(data) ? data : []
}

function getTechniqueById(id) {
  return getAllTechniques().find(t => t.id === id) || null
}

function saveTechnique(tech) {
  const list = getAllTechniques()
  const idx = list.findIndex(t => t.id === tech.id)
  const now = Date.now()
  const toSave = {
    ...tech,
    updatedAt: now,
    createdAt: tech.createdAt || now,
  }
  if (idx >= 0) {
    list[idx] = toSave
  } else {
    list.push(toSave)
  }
  wx.setStorageSync(TECHNIQUES_KEY, list)
}

function deleteTechnique(id) {
  const list = getAllTechniques().filter(t => t.id !== id)
  wx.setStorageSync(TECHNIQUES_KEY, list)
}

module.exports = {
  getAllFlows,
  getFlowById,
  saveFlow,
  deleteFlow,
  getStepsByFlowId,
  saveSteps,
  getDecisionsByFlowId,
  saveDecisions,
  getNotesByFlowId,
  saveNotes,
  getAllTechniques,
  getTechniqueById,
  saveTechnique,
  deleteTechnique,
}

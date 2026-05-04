/**
 * 柔术训练记录 - 本地存储
 * keys: flows, steps, decisions, notes, techniques, insights, sessionRecords
 */

const FLOWS_KEY = 'flows'
const SESSION_RECORDS_KEY = 'sessionRecords'
const TECHNIQUES_KEY = 'techniques'
const INSIGHTS_KEY = 'insights'
const CUSTOM_TECH_TAGS_KEY = 'customTechTags'
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
  if (id == null || id === '') return null
  const sid = String(id)
  return getAllTechniques().find(t => String(t.id) === sid) || null
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

// --- 招式自定义标签（位置 / 动作）---
function getCustomTechTags() {
  const raw = wx.getStorageSync(CUSTOM_TECH_TAGS_KEY)
  if (!raw || typeof raw !== 'object') return { positions: [], actions: [] }
  return {
    positions: Array.isArray(raw.positions) ? raw.positions : [],
    actions: Array.isArray(raw.actions) ? raw.actions : [],
  }
}

function saveCustomTechTags(tags) {
  wx.setStorageSync(CUSTOM_TECH_TAGS_KEY, tags)
}

function addCustomTechPosition(label) {
  const trimmed = (label || '').trim()
  if (!trimmed) return false
  const t = getCustomTechTags()
  if (t.positions.indexOf(trimmed) >= 0) return true
  t.positions.push(trimmed)
  saveCustomTechTags(t)
  return true
}

function addCustomTechAction(label) {
  const trimmed = (label || '').trim()
  if (!trimmed) return false
  const t = getCustomTechTags()
  if (t.actions.indexOf(trimmed) >= 0) return true
  t.actions.push(trimmed)
  saveCustomTechTags(t)
  return true
}

// --- 实战表现 · 自定义「上课状态」标签 ---
const CUSTOM_SESSION_CLASS_STATES_KEY = 'customSessionClassStates'

function getCustomSessionClassStates() {
  const data = wx.getStorageSync(CUSTOM_SESSION_CLASS_STATES_KEY)
  return Array.isArray(data) ? data : []
}

function addCustomSessionClassState(label) {
  const trimmed = (label || '').trim()
  if (!trimmed) return false
  const list = getCustomSessionClassStates()
  if (list.indexOf(trimmed) >= 0) return true
  list.push(trimmed)
  wx.setStorageSync(CUSTOM_SESSION_CLASS_STATES_KEY, list)
  return true
}

// --- 实战表现 · 自定义「疼痛部位」标签 ---
const CUSTOM_SESSION_PAIN_TAGS_KEY = 'customSessionPainTags'

function getCustomSessionPainTags() {
  const data = wx.getStorageSync(CUSTOM_SESSION_PAIN_TAGS_KEY)
  return Array.isArray(data) ? data : []
}

function addCustomSessionPainTag(label) {
  const trimmed = (label || '').trim()
  if (!trimmed) return false
  const list = getCustomSessionPainTags()
  if (list.indexOf(trimmed) >= 0) return true
  list.push(trimmed)
  wx.setStorageSync(CUSTOM_SESSION_PAIN_TAGS_KEY, list)
  return true
}

// --- 训练心得（独立短文：标题、日期、正文）---
function getAllInsights() {
  const data = wx.getStorageSync(INSIGHTS_KEY)
  return Array.isArray(data) ? data : []
}

function getInsightById(id) {
  if (id == null || id === '') return null
  const sid = String(id)
  return getAllInsights().find(x => String(x.id) === sid) || null
}

function saveInsight(insight) {
  const list = getAllInsights()
  const idx = list.findIndex(x => x.id === insight.id)
  const now = Date.now()
  const toSave = {
    ...insight,
    updatedAt: now,
    createdAt: insight.createdAt || now,
  }
  if (idx >= 0) {
    list[idx] = toSave
  } else {
    list.push(toSave)
  }
  wx.setStorageSync(INSIGHTS_KEY, list)
}

function deleteInsight(id) {
  const list = getAllInsights().filter(x => x.id !== id)
  wx.setStorageSync(INSIGHTS_KEY, list)
}

// --- 实战表现（上课状态 / 疼痛标签 painTags[] / 疼痛文字 / 实战笔记）---
function getAllSessionRecords() {
  const data = wx.getStorageSync(SESSION_RECORDS_KEY)
  return Array.isArray(data) ? data : []
}

function getSessionRecordById(id) {
  if (id == null || id === '') return null
  const sid = String(id)
  return getAllSessionRecords().find(x => String(x.id) === sid) || null
}

function saveSessionRecord(rec) {
  const list = getAllSessionRecords()
  const idx = list.findIndex(x => x.id === rec.id)
  const now = Date.now()
  const toSave = {
    ...rec,
    updatedAt: now,
    createdAt: rec.createdAt || now,
  }
  if (idx >= 0) {
    list[idx] = toSave
  } else {
    list.push(toSave)
  }
  wx.setStorageSync(SESSION_RECORDS_KEY, list)
}

function deleteSessionRecord(id) {
  const list = getAllSessionRecords().filter(x => x.id !== id)
  wx.setStorageSync(SESSION_RECORDS_KEY, list)
}

module.exports = {
  getAllFlows,
  getFlowById,
  saveFlow,
  deleteFlow,
  deleteStepsByFlowId,
  deleteDecisionsByFlowId,
  deleteNotesByFlowId,
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
  getCustomTechTags,
  addCustomTechPosition,
  addCustomTechAction,
  getCustomSessionClassStates,
  addCustomSessionClassState,
  getCustomSessionPainTags,
  addCustomSessionPainTag,
  getAllInsights,
  getInsightById,
  saveInsight,
  deleteInsight,
  getAllSessionRecords,
  getSessionRecordById,
  saveSessionRecord,
  deleteSessionRecord,
}

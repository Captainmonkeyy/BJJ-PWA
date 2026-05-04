/**
 * 流程文本 + 招式引用（分段模型）
 */

const storage = require('./storage')
const util = require('./util')
const { buildTree, flattenTree } = require('./flowTree')
const {
  formatTechPosition,
  formatTechAction,
  STEP_STATE_LABELS,
  POSITION_LABELS,
  ACTION_LABELS,
} = require('./constants')

function techTagLine(tech) {
  if (!tech) return ''
  return [formatTechPosition(tech.position), formatTechAction(tech.action)].filter(Boolean).join(' · ')
}

function formatStepLine(step) {
  if (!step) return ''
  if (step.state) {
    const a = STEP_STATE_LABELS[step.state] || step.state
    const b = step.position ? POSITION_LABELS[step.position] || step.position : ''
    const c = step.action ? ACTION_LABELS[step.action] || step.action : ''
    return [a, b, c].filter(Boolean).join(' · ')
  }
  return ''
}

function mergeAdjacentTextSegments(segments) {
  const out = []
  for (const seg of segments) {
    const uid = seg.uid || util.generateId()
    if (seg.type === 'tech') {
      const techSeg = {
        uid,
        type: 'tech',
        techId: seg.techId,
        name: seg.name || '招式',
        tagLine: seg.tagLine || '',
      }
      if (seg.flowNotesExpanded) techSeg.flowNotesExpanded = true
      out.push(techSeg)
      continue
    }
    if (seg.type !== 'text') continue
    const text = seg.text != null ? String(seg.text) : ''
    if (out.length && out[out.length - 1].type === 'text') {
      out[out.length - 1].text += text
    } else {
      out.push({ uid, type: 'text', text })
    }
  }
  if (out.length === 0) {
    return [{ uid: util.generateId(), type: 'text', text: '' }]
  }
  return out
}

function createEmptyFlowSegments() {
  return [{ uid: util.generateId(), type: 'text', text: '' }]
}

function ensureSegmentUids(segments) {
  if (!Array.isArray(segments) || segments.length === 0) return createEmptyFlowSegments()
  return mergeAdjacentTextSegments(
    segments.map(s => Object.assign({}, s, { uid: s.uid || util.generateId() })),
  )
}

function migrateLegacyFlowToSegments(flow) {
  const techMap = {}
  storage.getAllTechniques().forEach(t => {
    techMap[t.id] = t
    techMap[String(t.id)] = t
  })
  const parts = []
  if (Array.isArray(flow.nodes) && flow.nodes.length > 0 && flow.edges && flow.rootId) {
    const tree = buildTree(flow.nodes, flow.edges, flow.rootId)
    const rows = flattenTree(tree, techMap)
    rows.forEach(r => {
      const node = r.node
      if (node && node.type === 'tech' && node.techId) {
        const t = techMap[node.techId] || techMap[String(node.techId)]
        parts.push({
          uid: util.generateId(),
          type: 'tech',
          techId: node.techId,
          name: t ? t.name : r.label || '招式',
          tagLine: t ? techTagLine(t) : '',
        })
        parts.push({ uid: util.generateId(), type: 'text', text: ' ' })
      } else if (r.label) {
        parts.push({ uid: util.generateId(), type: 'text', text: `${r.label} ` })
      }
    })
  } else {
    const steps = storage.getStepsByFlowId(flow.id)
    steps.forEach(s => {
      const line = formatStepLine(s)
      if (line) parts.push({ uid: util.generateId(), type: 'text', text: `${line}\n` })
    })
    const decisions = storage.getDecisionsByFlowId(flow.id)
    decisions.forEach(d => {
      if (d.trigger) parts.push({ uid: util.generateId(), type: 'text', text: `若 ${d.trigger}\n` })
    })
  }
  let notes = flow.notes && flow.notes.length ? flow.notes : storage.getNotesByFlowId(flow.id)
  ;(notes || []).forEach(n => {
    if (n.content && String(n.content).trim()) {
      parts.push({ uid: util.generateId(), type: 'text', text: `\n【关键点】${String(n.content).trim()}\n` })
    }
  })
  const merged = mergeAdjacentTextSegments(parts)
  if (merged.length && merged[merged.length - 1].type === 'tech') {
    merged.push({ uid: util.generateId(), type: 'text', text: '' })
  }
  return merged.length ? merged : createEmptyFlowSegments()
}

function segmentsToPreviewString(segments) {
  if (!Array.isArray(segments)) return ''
  return segments
    .map(s => (s.type === 'tech' ? `「${s.name || '招式'}」` : s.text || ''))
    .join('')
    .trim()
}

function stripUidsForCompare(segments) {
  return (segments || []).map(s => {
    if (s.type === 'tech') {
      return { type: 'tech', techId: s.techId, name: s.name, tagLine: s.tagLine }
    }
    return { type: 'text', text: s.text || '' }
  })
}

/** 流程内招式解说预览：超过则折叠，需「展开」 */
const FLOW_TECH_NOTES_PREVIEW_LEN = 44

function hydrateFlowTechSegForDisplay(seg, tech) {
  if (!seg || seg.type !== 'tech') return seg
  const exp = !!seg.flowNotesExpanded
  const flowNotes = tech && tech.notes ? String(tech.notes).trim() : ''
  const flowNotesLong = flowNotes.length > FLOW_TECH_NOTES_PREVIEW_LEN
  const flowNotesDisplay =
    !flowNotes ? '' : exp || !flowNotesLong ? flowNotes : `${flowNotes.slice(0, FLOW_TECH_NOTES_PREVIEW_LEN)}…`
  return {
    uid: seg.uid,
    type: 'tech',
    techId: seg.techId,
    name: seg.name || '招式',
    tagLine: seg.tagLine || '',
    flowNotesExpanded: exp,
    flowNotes,
    flowNotesLong,
    flowNotesDisplay,
  }
}

function hydrateFlowSegmentsTechNotes(segments) {
  if (!Array.isArray(segments)) return []
  return segments.map(s => {
    if (s.type !== 'tech') return s
    const t = storage.getTechniqueById(s.techId)
    return hydrateFlowTechSegForDisplay(s, t)
  })
}

module.exports = {
  techTagLine,
  mergeAdjacentTextSegments,
  createEmptyFlowSegments,
  ensureSegmentUids,
  migrateLegacyFlowToSegments,
  segmentsToPreviewString,
  stripUidsForCompare,
  FLOW_TECH_NOTES_PREVIEW_LEN,
  hydrateFlowTechSegForDisplay,
  hydrateFlowSegmentsTechNotes,
}

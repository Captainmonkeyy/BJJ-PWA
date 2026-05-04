/**
 * 完整本地数据 JSON 备份 / 恢复（换机、防丢失）
 * 不含实验性「流程」数据；导出文件无 flows/steps/decisions/notes，导入时会清空本机这四项存储。
 */
const util = require('./util')
const {
  formatSessionClassStateLabel,
  formatSessionPainTagLabel,
  formatTechPosition,
  formatTechAction,
} = require('./constants')

const APP_ID = 'bjj-training-log'
const SCHEMA_VERSION = 1

function ensureArray(v) {
  return Array.isArray(v) ? v : []
}

function ensureCustomTechTags(raw) {
  if (!raw || typeof raw !== 'object') return { positions: [], actions: [] }
  return {
    positions: Array.isArray(raw.positions) ? raw.positions : [],
    actions: Array.isArray(raw.actions) ? raw.actions : [],
  }
}

function collectDataPayload() {
  return {
    techniques: ensureArray(wx.getStorageSync('techniques')),
    insights: ensureArray(wx.getStorageSync('insights')),
    sessionRecords: ensureArray(wx.getStorageSync('sessionRecords')),
    customTechTags: ensureCustomTechTags(wx.getStorageSync('customTechTags')),
    customSessionClassStates: ensureArray(wx.getStorageSync('customSessionClassStates')),
    customSessionPainTags: ensureArray(wx.getStorageSync('customSessionPainTags')),
  }
}

function buildExportObject() {
  return {
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: Date.now(),
    data: collectDataPayload(),
  }
}

/**
 * 写入用户目录并返回路径，供 wx.shareFileMessage 使用
 */
function writeExportJsonFile() {
  const body = buildExportObject()
  const json = JSON.stringify(body, null, 2)
  const ymd = util.todayYMD().replace(/-/g, '')
  const fileName = `柔术记录备份_${ymd}.json`
  const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
  wx.getFileSystemManager().writeFileSync(filePath, json, 'utf8')
  return { filePath, fileName }
}

/**
 * @param {string} text
 * @returns {{ ok: true, normalized: object } | { ok: false, message: string }}
 */
function validateAndNormalizeImport(text) {
  if (text == null || String(text).trim() === '') {
    return { ok: false, message: '文件内容为空' }
  }
  let obj
  try {
    obj = JSON.parse(String(text))
  } catch (e) {
    return { ok: false, message: '无法解析为 JSON，请确认是未改动的备份文件' }
  }
  if (!obj || typeof obj !== 'object') {
    return { ok: false, message: '备份格式无效' }
  }
  if (obj.app != null && obj.app !== APP_ID) {
    return { ok: false, message: '不是「柔术记录本」生成的备份文件' }
  }
  if (typeof obj.schemaVersion === 'number' && obj.schemaVersion > SCHEMA_VERSION) {
    return { ok: false, message: '备份版本较新，请先升级小程序后再导入' }
  }
  const data = obj.data
  if (!data || typeof data !== 'object') {
    return { ok: false, message: '备份缺少 data 字段，文件可能已损坏' }
  }
  const normalized = {
    techniques: ensureArray(data.techniques),
    insights: ensureArray(data.insights),
    sessionRecords: ensureArray(data.sessionRecords),
    customTechTags: ensureCustomTechTags(data.customTechTags),
    customSessionClassStates: ensureArray(data.customSessionClassStates),
    customSessionPainTags: ensureArray(data.customSessionPainTags),
  }
  return {
    ok: true,
    normalized,
    exportedAt: typeof obj.exportedAt === 'number' && !Number.isNaN(obj.exportedAt) ? obj.exportedAt : null,
  }
}

function stableSerialize(v) {
  if (v === null || v === undefined) return 'null'
  const t = typeof v
  if (t !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return `[${v.map(stableSerialize).join(',')}]`
  const keys = Object.keys(v).sort()
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableSerialize(v[k])}`).join(',')}}`
}

function idStr(x) {
  if (x == null || x === '') return ''
  return String(x)
}

function toIdMap(arr) {
  const m = new Map()
  ensureArray(arr).forEach(item => {
    if (!item || typeof item !== 'object') return
    const id = idStr(item.id)
    if (id) m.set(id, item)
  })
  return m
}

function sessionPreviewLabel(s) {
  const ymd = util.effectiveRecordDate(s) || ''
  const st = s.classState ? formatSessionClassStateLabel(s.classState) : ''
  let tags = ''
  if (Array.isArray(s.painTags) && s.painTags.length) {
    tags = s.painTags.map(t => formatSessionPainTagLabel(t)).filter(Boolean).join('、')
  }
  const pr = (s.practiceNotes && String(s.practiceNotes).trim()) || ''
  const prShort = pr.length > 24 ? `${pr.slice(0, 24)}…` : pr
  const parts = [ymd, st, tags, prShort].filter(Boolean)
  return parts.length ? parts.join(' · ') : '（无摘要）'
}

function techPreviewLabel(t) {
  const name = (t.name && String(t.name).trim()) || '未命名招式'
  const pos = formatTechPosition(t.position)
  const act = formatTechAction(t.action)
  const extra = [pos, act].filter(Boolean).join(' · ')
  return extra ? `${name}（${extra}）` : name
}

function insightPreviewLabel(x) {
  const title = (x.title && String(x.title).trim()) || '未命名心得'
  const ymd = util.effectiveRecordDate(x)
  return ymd ? `${title}（${ymd}）` : title
}

const PREVIEW_LINE_CAP = 10

function capList(labels, cap) {
  if (labels.length <= cap) return { lines: labels, more: 0 }
  return { lines: labels.slice(0, cap), more: labels.length - cap }
}

function diffEntitySection(title, storageKey, localArr, incomingArr, getLabel) {
  const loc = toIdMap(localArr)
  const inc = toIdMap(incomingArr)
  const addedLabels = []
  const removedLabels = []
  const modifiedLabels = []
  const removedRecords = []

  inc.forEach((item, id) => {
    if (!loc.has(id)) addedLabels.push(getLabel(item, 'incoming'))
  })
  loc.forEach((item, id) => {
    if (!inc.has(id)) {
      const label = getLabel(item, 'local')
      removedLabels.push(label)
      removedRecords.push({ id, label, keep: false })
    }
  })
  loc.forEach((item, id) => {
    if (!inc.has(id)) return
    const a = inc.get(id)
    if (stableSerialize(item) !== stableSerialize(a)) {
      modifiedLabels.push(getLabel(a, 'incoming'))
    }
  })

  const unchanged = [...loc.keys()].filter(id => inc.has(id) && stableSerialize(loc.get(id)) === stableSerialize(inc.get(id))).length

  const localCount = ensureArray(localArr).length
  const incomingCount = ensureArray(incomingArr).length
  const hasChanges =
    addedLabels.length > 0 || removedLabels.length > 0 || modifiedLabels.length > 0 || localCount !== incomingCount

  return {
    key: storageKey,
    storageKey,
    kind: 'entity',
    title,
    unit: '条',
    localCount,
    incomingCount,
    summaryLine: `本机 ${localCount} 条 → 导入后 ${incomingCount} 条`,
    hasChanges,
    unchanged,
    added: capList(addedLabels, PREVIEW_LINE_CAP),
    removed: capList(removedLabels, PREVIEW_LINE_CAP),
    removedRecords,
    modified: capList(modifiedLabels, PREVIEW_LINE_CAP),
  }
}

function diffStringSetSection(title, storageKey, localArr, incomingArr) {
  const a = new Set(ensureArray(localArr).map(x => String(x)))
  const b = new Set(ensureArray(incomingArr).map(x => String(x)))
  const addedLabels = [...b].filter(x => !a.has(x))
  const removedLabels = [...a].filter(x => !b.has(x))
  const removedRecords = removedLabels.map(value => ({
    id: `str:${storageKey}:${value}`,
    value,
    label: value,
    keep: false,
  }))
  const hasChanges = addedLabels.length > 0 || removedLabels.length > 0
  const localCount = a.size
  const incomingCount = b.size
  return {
    key: storageKey,
    storageKey,
    kind: 'stringSet',
    title,
    unit: '项',
    localCount,
    incomingCount,
    summaryLine: `本机 ${localCount} 项 → 导入后 ${incomingCount} 项`,
    hasChanges,
    unchanged: Math.max(0, [...a].filter(x => b.has(x)).length),
    added: capList(addedLabels, PREVIEW_LINE_CAP),
    removed: capList(removedLabels, PREVIEW_LINE_CAP),
    removedRecords,
    modified: { lines: [], more: 0 },
  }
}

function diffCustomTechTagsSection(localT, incomingT) {
  const a = ensureCustomTechTags(localT)
  const b = ensureCustomTechTags(incomingT)
  const pos = diffStringSetSection('自定义·位置标签', 'customTechTagsPositions', a.positions, b.positions)
  pos.title = '自定义 · 招式位置标签'
  const act = diffStringSetSection('自定义·动作标签', 'customTechTagsActions', a.actions, b.actions)
  act.title = '自定义 · 招式动作标签'
  const hasChanges = pos.hasChanges || act.hasChanges
  return { pos, act, hasChanges }
}

function formatExportedAt(ts) {
  if (ts == null || typeof ts !== 'number' || Number.isNaN(ts)) return ''
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * 对比当前本地数据与待导入备份，生成预览（用于 UI 展示）
 */
function computeImportPreview(incomingNormalized) {
  const current = collectDataPayload()
  const incoming = incomingNormalized

  const sections = []

  sections.push(
    diffEntitySection('实战表现', 'sessionRecords', current.sessionRecords, incoming.sessionRecords, item =>
      sessionPreviewLabel(item),
    ),
  )
  sections.push(
    diffEntitySection('招式', 'techniques', current.techniques, incoming.techniques, item => techPreviewLabel(item)),
  )
  sections.push(
    diffEntitySection('心得', 'insights', current.insights, incoming.insights, item => insightPreviewLabel(item)),
  )

  const customStates = diffStringSetSection(
    '自定义 · 上课状态标签',
    'customSessionClassStates',
    current.customSessionClassStates,
    incoming.customSessionClassStates,
  )
  const customPain = diffStringSetSection(
    '自定义 · 疼痛部位标签',
    'customSessionPainTags',
    current.customSessionPainTags,
    incoming.customSessionPainTags,
  )

  const techTagDiff = diffCustomTechTagsSection(current.customTechTags, incoming.customTechTags)

  const customSections = [techTagDiff.pos, techTagDiff.act, customStates, customPain]

  const allMainChanged = sections.some(s => s.hasChanges)
  const allCustomChanged = customSections.some(s => s.hasChanges) || techTagDiff.hasChanges

  const identical =
    !allMainChanged &&
    !allCustomChanged &&
    stableSerialize(current) === stableSerialize(incoming)

  const allSections = sections.concat(customSections)

  return {
    identical,
    sections,
    customSections,
    allSections,
    techTagDiff,
  }
}

function applyImport(normalized) {
  wx.setStorageSync('flows', [])
  wx.setStorageSync('steps', [])
  wx.setStorageSync('decisions', [])
  wx.setStorageSync('notes', [])
  wx.setStorageSync('techniques', ensureArray(normalized.techniques))
  wx.setStorageSync('insights', ensureArray(normalized.insights))
  wx.setStorageSync('sessionRecords', ensureArray(normalized.sessionRecords))
  wx.setStorageSync('customTechTags', ensureCustomTechTags(normalized.customTechTags))
  wx.setStorageSync('customSessionClassStates', ensureArray(normalized.customSessionClassStates))
  wx.setStorageSync('customSessionPainTags', ensureArray(normalized.customSessionPainTags))
}

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function mergeByIds(targetArr, snapshotArr, keepIds) {
  if (!keepIds || !keepIds.length) return
  const idSet = new Set(keepIds.map(String))
  idSet.forEach(idStr => {
    if (targetArr.some(x => String(x.id) === idStr)) return
    const item = snapshotArr.find(x => String(x.id) === idStr)
    if (item) targetArr.push(cloneDeep(item))
  })
}

function mergeStringPreserve(targetArr, keepVals) {
  if (!keepVals || !keepVals.length) return
  const seen = new Set(targetArr.map(x => String(x)))
  keepVals.forEach(v => {
    const s = String(v)
    if (!seen.has(s)) {
      targetArr.push(v)
      seen.add(s)
    }
  })
}

/**
 * 从预览结果收集用户勾选要保留的「将删除」项
 */
function buildKeepSpecFromPreview(preview) {
  const spec = {
    sessionRecords: [],
    techniques: [],
    insights: [],
    customTechTagsPositions: [],
    customTechTagsActions: [],
    customSessionClassStates: [],
    customSessionPainTags: [],
  }
  if (!preview || !preview.allSections) return spec
  preview.allSections.forEach(sec => {
    if (!sec.removedRecords || !sec.removedRecords.length) return
    sec.removedRecords.forEach(rec => {
      if (!rec.keep) return
      switch (sec.storageKey) {
        case 'sessionRecords':
          spec.sessionRecords.push(String(rec.id))
          break
        case 'techniques':
          spec.techniques.push(String(rec.id))
          break
        case 'insights':
          spec.insights.push(String(rec.id))
          break
        case 'customTechTagsPositions':
          spec.customTechTagsPositions.push(rec.value)
          break
        case 'customTechTagsActions':
          spec.customTechTagsActions.push(rec.value)
          break
        case 'customSessionClassStates':
          spec.customSessionClassStates.push(rec.value)
          break
        case 'customSessionPainTags':
          spec.customSessionPainTags.push(rec.value)
          break
        default:
          break
      }
    })
  })
  return spec
}

/**
 * 先按备份写入，再把勾选保留的「仅本机有」记录合并回去
 */
function applyImportWithKeeps(normalized, keepSpec) {
  const snapshot = collectDataPayload()
  const k = keepSpec || {}
  const out = cloneDeep(normalized)

  out.customTechTags = ensureCustomTechTags(out.customTechTags)

  mergeByIds(out.sessionRecords, snapshot.sessionRecords, k.sessionRecords || [])
  mergeByIds(out.techniques, snapshot.techniques, k.techniques || [])
  mergeByIds(out.insights, snapshot.insights, k.insights || [])

  mergeStringPreserve(out.customTechTags.positions, k.customTechTagsPositions || [])
  mergeStringPreserve(out.customTechTags.actions, k.customTechTagsActions || [])
  mergeStringPreserve(out.customSessionClassStates, k.customSessionClassStates || [])
  mergeStringPreserve(out.customSessionPainTags, k.customSessionPainTags || [])

  applyImport(out)
}

module.exports = {
  writeExportJsonFile,
  validateAndNormalizeImport,
  computeImportPreview,
  formatExportedAt,
  applyImport,
  applyImportWithKeeps,
  buildKeepSpecFromPreview,
  SCHEMA_VERSION,
  APP_ID,
}

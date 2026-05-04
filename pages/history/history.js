const storage = require('../../utils/storage')
const util = require('../../utils/util')
const backupJson = require('../../utils/backupJson')
const exportTrainingTxt = require('../../utils/exportTrainingTxt')
const flowSegUtil = require('../../utils/flowSegments')
const { buildTree, flattenTree } = require('../../utils/flowTree')
const {
  TECH_POSITION_LABELS,
  mapPositionToBaseSix,
  formatTechPosition,
  formatTechAction,
  START_POSITION_LABELS,
  TOP_ACTION_LABELS,
  BOTTOM_ACTION_LABELS,
  STEP_STATE_LABELS,
  POSITION_LABELS,
  ACTION_LABELS,
  formatSessionClassStateLabel,
  formatSessionPainTagLabel,
} = require('../../utils/constants')

const WEEK_HEADERS = ['一', '二', '三', '四', '五', '六', '日']

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatFlowStartLine(flow) {
  if (!flow) return ''
  if (flow.startPosition === 'top' && flow.startAction) {
    return `${START_POSITION_LABELS.top} · ${TOP_ACTION_LABELS[flow.startAction] || flow.startAction}`
  }
  if (flow.startPosition === 'bottom' && flow.startAction) {
    return `${START_POSITION_LABELS.bottom} · ${BOTTOM_ACTION_LABELS[flow.startAction] || flow.startAction}`
  }
  return ''
}

function formatYmdChinese(ymd) {
  if (!ymd || ymd.length < 10) return ymd || ''
  const parts = ymd.split('-').map(Number)
  const y = parts[0]
  const m = parts[1]
  const d = parts[2]
  return `${y}年${m}月${d}日`
}

function positionLabelForSummary(t) {
  const base = mapPositionToBaseSix(t.position)
  if (base === 'other') {
    const raw = formatTechPosition(t.position)
    return raw ? (raw.length > 4 ? `${raw.slice(0, 4)}…` : raw) : '其他'
  }
  return TECH_POSITION_LABELS[base] || base
}

function buildMonthSummaryMap(year, month1to12) {
  const map = {}
  const flows = storage.getAllFlows()
  const techs = storage.getAllTechniques()
  const insights = storage.getAllInsights()
  const sessions = storage.getAllSessionRecords()
  const last = new Date(year, month1to12, 0).getDate()
  for (let d = 1; d <= last; d++) {
    const ymd = `${year}-${pad2(month1to12)}-${pad2(d)}`
    const dayFlows = flows.filter(f => util.effectiveRecordDate(f) === ymd)
    const dayTechs = techs.filter(t => util.effectiveRecordDate(t) === ymd)
    const dayInsights = insights.filter(x => util.effectiveRecordDate(x) === ymd)
    const daySessions = sessions.filter(s => util.effectiveRecordDate(s) === ymd)
    if (
      dayFlows.length === 0 &&
      dayTechs.length === 0 &&
      dayInsights.length === 0 &&
      daySessions.length === 0
    ) {
      continue
    }
    const total = dayFlows.length + dayTechs.length + dayInsights.length + daySessions.length
    const chips = [{ kind: 'stat', text: String(total) }]
    if (daySessions.length > 0) {
      chips.push({ kind: 'session', text: `实战×${daySessions.length}` })
    }
    if (dayTechs.length > 0) {
      chips.push({ kind: 'tech', text: `招式×${dayTechs.length}` })
    }
    if (dayInsights.length > 0) {
      chips.push({ kind: 'insight', text: `心得×${dayInsights.length}` })
    }
    if (dayFlows.length > 0) {
      chips.push({ kind: 'flow', text: `流程×${dayFlows.length}` })
    }
    const posSet = []
    const seen = new Set()
    dayTechs.forEach(t => {
      const lab = positionLabelForSummary(t)
      if (!seen.has(lab)) {
        seen.add(lab)
        posSet.push(lab)
      }
    })
    const maxPos = 2
    posSet.slice(0, maxPos).forEach(text => chips.push({ kind: 'pos', text }))
    if (posSet.length > maxPos) {
      chips.push({ kind: 'more', text: `+${posSet.length - maxPos}` })
    }
    map[ymd] = chips.slice(0, 5)
  }
  return map
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

function buildFlowReadonly(flow, techMap) {
  const ymd = util.effectiveRecordDate(flow)
  if (flow.contentFormat === 2 && Array.isArray(flow.segments)) {
    const bodyPreview = flowSegUtil.segmentsToPreviewString(flow.segments)
    return {
      name: flow.name || '未命名流程',
      typeLabel: '流程',
      recordLine: `训练日期：${formatYmdChinese(ymd)}`,
      startLine: '',
      bodyPreview,
      treeRows: [],
      stepLines: [],
      decisionLines: [],
      noteLines: [],
      hasTree: false,
      hasSteps: false,
      hasDecisions: false,
      hasNotes: false,
    }
  }
  let treeRows = []
  let stepLines = []
  let decisionLines = []
  let noteLines = []
  let notes = flow.notes && flow.notes.length ? flow.notes : storage.getNotesByFlowId(flow.id)
  noteLines = (notes || []).filter(n => n.content && String(n.content).trim()).map(n => String(n.content).trim())

  if (Array.isArray(flow.nodes) && flow.nodes.length > 0 && flow.edges && flow.rootId) {
    const tree = buildTree(flow.nodes, flow.edges, flow.rootId)
    treeRows = flattenTree(tree, techMap).map(r => ({
      id: r.id,
      depth: r.depth,
      branchPrefix: r.branchPrefix || '',
      branchText: r.edge && r.edge.branch ? `若 ${r.edge.branch}` : '',
      nodeType: r.node && r.node.type === 'tech' ? '招式' : '步骤',
      label: r.label || '',
    }))
  } else {
    const steps = storage.getStepsByFlowId(flow.id)
    stepLines = steps.map(s => formatStepLine(s)).filter(Boolean)
    decisionLines = storage.getDecisionsByFlowId(flow.id).map(d => (d.trigger ? `若 ${d.trigger}` : '')).filter(Boolean)
  }

  return {
    name: flow.name || '未命名流程',
    typeLabel: '流程',
    recordLine: `训练日期：${formatYmdChinese(ymd)}`,
    startLine: formatFlowStartLine(flow) ? `起始：${formatFlowStartLine(flow)}` : '',
    treeRows,
    stepLines,
    decisionLines,
    noteLines,
    hasTree: treeRows.length > 0,
    hasSteps: stepLines.length > 0,
    hasDecisions: decisionLines.length > 0,
    hasNotes: noteLines.length > 0,
  }
}

function buildTechReadonly(tech) {
  const ymd = util.effectiveRecordDate(tech)
  const pos = formatTechPosition(tech.position)
  const act = formatTechAction(tech.action)
  const tagLine = [pos, act].filter(Boolean).join(' · ')
  return {
    name: tech.name || '未命名招式',
    typeLabel: '招式',
    recordLine: `训练日期：${formatYmdChinese(ymd)}`,
    tagLine: tagLine ? `标签：${tagLine}` : '',
    notes: tech.notes && String(tech.notes).trim() ? String(tech.notes).trim() : '',
  }
}

function buildInsightReadonly(ins) {
  const ymd = util.effectiveRecordDate(ins)
  return {
    name: ins.title || '未命名心得',
    typeLabel: '心得',
    recordLine: `日期：${formatYmdChinese(ymd)}`,
    body: ins.body && String(ins.body).trim() ? String(ins.body).trim() : '',
  }
}

function buildSessionReadonly(s) {
  const ymd = util.effectiveRecordDate(s)
  const cs = s.classState ? formatSessionClassStateLabel(s.classState) : ''
  const pr = s.practiceNotes && String(s.practiceNotes).trim() ? String(s.practiceNotes).trim() : ''
  let name = '实战表现'
  if (pr) {
    name = pr.length > 24 ? `${pr.slice(0, 24)}…` : pr
  }
  const painTags = Array.isArray(s.painTags) ? s.painTags : []
  const painTagsLine = painTags.map(t => formatSessionPainTagLabel(t)).filter(Boolean).join('、')
  return {
    name,
    typeLabel: '实战',
    recordLine: `训练日期：${formatYmdChinese(ymd)}`,
    classStateLine: cs ? `上课状态：${cs}` : '',
    painTagsLine: painTagsLine ? `部位：${painTagsLine}` : '',
    pain: s.painDescription && String(s.painDescription).trim() ? String(s.painDescription).trim() : '',
    practice: pr,
  }
}

function buildMergedDayRecords(ymd) {
  const techMap = {}
  storage.getAllTechniques().forEach(t => {
    techMap[t.id] = t
  })
  const flows = storage.getAllFlows().filter(f => util.effectiveRecordDate(f) === ymd)
  const techs = storage.getAllTechniques().filter(t => util.effectiveRecordDate(t) === ymd)
  const insights = storage.getAllInsights().filter(x => util.effectiveRecordDate(x) === ymd)
  const sess = storage.getAllSessionRecords().filter(s => util.effectiveRecordDate(s) === ymd)
  const rows = []
  flows.forEach(f => {
    rows.push({
      kind: 'flow',
      sort: f.updatedAt || f.createdAt || 0,
      flow: buildFlowReadonly(f, techMap),
    })
  })
  techs.forEach(t => {
    rows.push({
      kind: 'tech',
      sort: t.updatedAt || t.createdAt || 0,
      tech: buildTechReadonly(t),
    })
  })
  insights.forEach(ins => {
    rows.push({
      kind: 'insight',
      sort: ins.updatedAt || ins.createdAt || 0,
      insight: buildInsightReadonly(ins),
    })
  })
  sess.forEach(s => {
    rows.push({
      kind: 'session',
      sort: s.updatedAt || s.createdAt || 0,
      session: buildSessionReadonly(s),
    })
  })
  rows.sort((a, b) => b.sort - a.sort)
  return rows
}

function buildCalendarWeeks(year, month1to12, selectedYmd, todayYmd, summaryMap) {
  const first = new Date(year, month1to12 - 1, 1)
  const firstWeekday = first.getDay()
  const mondayOffset = firstWeekday === 0 ? 6 : firstWeekday - 1
  const daysInMonth = new Date(year, month1to12, 0).getDate()
  const cells = []
  for (let i = 0; i < mondayOffset; i++) {
    cells.push({ type: 'pad' })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const ymd = `${year}-${pad2(month1to12)}-${pad2(d)}`
    const summaryChips = summaryMap[ymd] || []
    cells.push({
      type: 'day',
      day: d,
      ymd,
      isToday: ymd === todayYmd,
      hasRecord: summaryChips.length > 0,
      isSelected: selectedYmd && ymd === selectedYmd,
      summaryChips,
    })
  }
  while (cells.length % 7 !== 0) {
    cells.push({ type: 'pad' })
  }
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push({ days: cells.slice(i, i + 7) })
  }
  return weeks
}

function mondayWeekYmdRange(ref) {
  const d = new Date(ref)
  const day = d.getDay()
  const diffToMon = day === 0 ? -6 : 1 - day
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMon)
  const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6)
  return { start: util.ymdFromDate(mon), end: util.ymdFromDate(sun) }
}

function currentMonthYmdRange(ref) {
  const d = new Date(ref)
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const last = new Date(y, m, 0).getDate()
  return {
    start: `${y}-${pad2(m)}-01`,
    end: `${y}-${pad2(m)}-${pad2(last)}`,
  }
}

/** 自定义统计默认：当月起始日 ~ 今天 */
function monthStartToTodayYmdRange(ref) {
  const d = new Date(ref)
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  return {
    start: `${y}-${pad2(m)}-01`,
    end: util.ymdFromDate(d),
  }
}

function buildPositionTagRows(techs) {
  const buckets = {}
  techs.forEach(t => {
    const base = mapPositionToBaseSix(t.position)
    const key = base
    const name = (t.name && String(t.name).trim()) || '未命名'
    if (!buckets[key]) buckets[key] = []
    buckets[key].push(name)
  })
  const rows = []
  Object.keys(buckets).forEach(key => {
    const names = buckets[key]
    const label = key === 'other' ? '其他' : TECH_POSITION_LABELS[key] || key
    rows.push({
      key,
      label,
      count: names.length,
      names: names.slice().sort(),
      open: false,
    })
  })
  rows.sort((a, b) => b.count - a.count)
  return rows
}

function buildActionTagRows(techs) {
  const buckets = {}
  techs.forEach(t => {
    const raw = t.action != null ? String(t.action) : ''
    const key = raw || '__empty__'
    const name = (t.name && String(t.name).trim()) || '未命名'
    if (!buckets[key]) {
      const lab = formatTechAction(raw)
      buckets[key] = { names: [], label: lab || '未标注' }
    }
    buckets[key].names.push(name)
  })
  const rows = Object.keys(buckets).map(key => {
    const b = buckets[key]
    return {
      key,
      label: b.label,
      count: b.names.length,
      names: b.names.slice().sort(),
      open: false,
    }
  })
  rows.sort((a, b) => b.count - a.count)
  return rows
}

Page({
  data: {
    mainTab: 'history',
    WEEK_HEADERS,
    calendarYear: 2026,
    calendarMonth: 1,
    calendarWeeks: [],
    calendarTitle: '',
    selectedYmd: '',
    selectedDateTitle: '',
    dayRecords: [],
    dayRecordSummary: '',
    showDayPanel: false,
    statsTab: 'week',
    statsRangeLabel: '',
    summaryClassDays: 0,
    summaryTech: 0,
    summaryInsight: 0,
    summaryRecordDays: 0,
    customStartYmd: '',
    customEndYmd: '',
    positionTagRows: [],
    actionTagRows: [],
    showImportPreviewPanel: false,
    importPreview: null,
    importPreviewMeta: null,
  },

  onShareAppMessage() {
    return {
      title: 'Echo的柔术记录 · 训练历史',
      path: '/pages/history/history',
    }
  },

  onShareTimeline() {
    return {
      title: 'Echo的柔术记录 · 训练历史',
    }
  },

  shareGeneratedFile(filePath, fileName) {
    const openPreview = () => {
      wx.openDocument({
        filePath,
        showMenu: true,
        fail() {
          wx.showToast({ title: '无法打开预览，请用分享发送文件', icon: 'none' })
        },
      })
    }

    if (typeof wx.shareFileMessage === 'function') {
      wx.shareFileMessage({
        filePath,
        fileName,
        fail: () => {
          wx.showModal({
            title: '转发文件',
            content: '将打开文件预览，可在预览页右上角「···」转发到文件传输助手。',
            confirmText: '打开预览',
            cancelText: '取消',
            success: res => {
              if (res.confirm) openPreview()
            },
          })
        },
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '当前微信版本较低，将打开文件预览；可在预览页使用右上角菜单转发。',
        confirmText: '打开',
        showCancel: false,
        success: res => {
          if (res.confirm) openPreview()
        },
      })
    }
  },

  onExportTxtTap() {
    wx.showLoading({ title: '生成文档…', mask: true })
    let filePath = ''
    let fileName = ''
    try {
      const r = exportTrainingTxt.writeExportTxtFile()
      filePath = r.filePath
      fileName = r.fileName
    } catch (err) {
      wx.hideLoading()
      console.error(err)
      wx.showModal({
        title: '导出失败',
        content: (err && err.message) || '请稍后重试',
        showCancel: false,
      })
      return
    }
    wx.hideLoading()
    this.shareGeneratedFile(filePath, fileName)
  },

  onExportJsonTap() {
    wx.showLoading({ title: '生成备份…', mask: true })
    let filePath = ''
    let fileName = ''
    try {
      const r = backupJson.writeExportJsonFile()
      filePath = r.filePath
      fileName = r.fileName
    } catch (err) {
      wx.hideLoading()
      console.error(err)
      wx.showModal({
        title: '导出失败',
        content: (err && err.message) || '请稍后重试',
        showCancel: false,
      })
      return
    }
    wx.hideLoading()
    this.shareGeneratedFile(filePath, fileName)
  },

  onImportJsonTap() {
    if (typeof wx.chooseMessageFile !== 'function') {
      wx.showModal({
        title: '无法选择聊天文件',
        content: '当前环境或微信版本过低，请更新微信后重试。',
        showCancel: false,
      })
      return
    }
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json'],
      success: res => {
        const f = res.tempFiles && res.tempFiles[0]
        if (!f || !f.path) {
          wx.showToast({ title: '未获取到文件', icon: 'none' })
          return
        }
        wx.getFileSystemManager().readFile({
          filePath: f.path,
          encoding: 'utf8',
          success: readRes => {
            const parsed = backupJson.validateAndNormalizeImport(readRes.data)
            if (!parsed.ok) {
              wx.showModal({
                title: '无法导入',
                content: parsed.message,
                showCancel: false,
              })
              return
            }
            const preview = backupJson.computeImportPreview(parsed.normalized)
            const exportedAtText =
              parsed.exportedAt != null ? backupJson.formatExportedAt(parsed.exportedAt) : ''
            this._pendingImportNormalized = parsed.normalized
            this.setData({
              showImportPreviewPanel: true,
              importPreview: preview,
              importPreviewMeta: {
                fileName: (f.name && String(f.name).trim()) || '未命名.json',
                exportedAtText,
              },
            })
          },
          fail: () => {
            wx.showToast({ title: '读取文件失败', icon: 'none' })
          },
        })
      },
      fail: err => {
        if (err && err.errMsg && /cancel/i.test(err.errMsg)) return
        wx.showToast({ title: '未能选择文件', icon: 'none' })
      },
    })
  },

  onImportPreviewMask() {
    this.onCloseImportPreview()
  },

  importPreviewNoop() {},

  onCloseImportPreview() {
    this._pendingImportNormalized = null
    this.setData({
      showImportPreviewPanel: false,
      importPreview: null,
      importPreviewMeta: null,
    })
  },

  onToggleRemovedKeep(e) {
    const sk = e.currentTarget.dataset.storageKey
    const rid = e.currentTarget.dataset.recordId
    if (!sk || rid == null) return
    const preview = JSON.parse(JSON.stringify(this.data.importPreview))
    const sec = preview.allSections.find(s => s.storageKey === sk)
    if (!sec || !sec.removedRecords) return
    const rec = sec.removedRecords.find(r => String(r.id) === String(rid))
    if (!rec) return
    rec.keep = !rec.keep
    this.setData({ importPreview: preview })
  },

  onBatchRemovedKeep(e) {
    const sk = e.currentTarget.dataset.storageKey
    const mode = e.currentTarget.dataset.mode
    if (!sk || !mode) return
    const pick = mode === 'all'
    const preview = JSON.parse(JSON.stringify(this.data.importPreview))
    const sec = preview.allSections.find(s => s.storageKey === sk)
    if (!sec || !sec.removedRecords) return
    sec.removedRecords.forEach(r => {
      r.keep = pick
    })
    this.setData({ importPreview: preview })
  },

  onConfirmImportAfterPreview() {
    const normalized = this._pendingImportNormalized
    if (!normalized) {
      wx.showToast({ title: '预览已失效，请重新选择文件', icon: 'none' })
      this.onCloseImportPreview()
      return
    }
    const keepSpec = backupJson.buildKeepSpecFromPreview(this.data.importPreview)
    try {
      backupJson.applyImportWithKeeps(normalized, keepSpec)
    } catch (e) {
      console.error(e)
      wx.showModal({
        title: '恢复失败',
        content: (e && e.message) || '请重试',
        showCancel: false,
      })
      return
    }
    this._pendingImportNormalized = null
    this.setData({
      showImportPreviewPanel: false,
      importPreview: null,
      importPreviewMeta: null,
    })
    wx.showToast({ title: '已恢复', icon: 'success' })
    this.refreshCalendar()
    this.refreshStats()
  },

  onShow() {
    const now = new Date()
    if (!this._calendarInited) {
      this._calendarInited = true
      this.setData({
        calendarYear: now.getFullYear(),
        calendarMonth: now.getMonth() + 1,
      })
    }
    this.refreshCalendar()
    this.refreshStats()
  },

  refreshCalendar() {
    const { calendarYear, calendarMonth, selectedYmd } = this.data
    const summaryMap = buildMonthSummaryMap(calendarYear, calendarMonth)
    const todayYmd = util.todayYMD()
    const weeks = buildCalendarWeeks(calendarYear, calendarMonth, selectedYmd, todayYmd, summaryMap)
    const calendarTitle = `${calendarYear}年${calendarMonth}月`
    this.setData({ calendarWeeks: weeks, calendarTitle })
  },

  onMainTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ mainTab: tab })
    if (tab === 'history') this.refreshCalendar()
    else this.refreshStats()
  },

  onPrevMonth() {
    let { calendarYear, calendarMonth } = this.data
    calendarMonth -= 1
    if (calendarMonth < 1) {
      calendarMonth = 12
      calendarYear -= 1
    }
    this.setData(
      {
        calendarYear,
        calendarMonth,
        selectedYmd: '',
        showDayPanel: false,
      },
      () => this.refreshCalendar(),
    )
  },

  onNextMonth() {
    let { calendarYear, calendarMonth } = this.data
    calendarMonth += 1
    if (calendarMonth > 12) {
      calendarMonth = 1
      calendarYear += 1
    }
    this.setData(
      {
        calendarYear,
        calendarMonth,
        selectedYmd: '',
        showDayPanel: false,
      },
      () => this.refreshCalendar(),
    )
  },

  onDayTap(e) {
    const ymd = e.currentTarget.dataset.ymd
    if (!ymd) return
    const dayRecords = buildMergedDayRecords(ymd)
    const nFlow = dayRecords.filter(r => r.kind === 'flow').length
    const nTech = dayRecords.filter(r => r.kind === 'tech').length
    const nInsight = dayRecords.filter(r => r.kind === 'insight').length
    const nSession = dayRecords.filter(r => r.kind === 'session').length
    const dayRecordSummary =
      dayRecords.length === 0
        ? '当日无记录'
        : `共 ${dayRecords.length} 条（实战 ${nSession} · 招式 ${nTech} · 心得 ${nInsight}${
            nFlow ? ` · 流程 ${nFlow}` : ''
          }）`
    this.setData(
      {
        selectedYmd: ymd,
        selectedDateTitle: formatYmdChinese(ymd),
        dayRecords,
        dayRecordSummary,
        showDayPanel: true,
      },
      () => this.refreshCalendar(),
    )
  },

  onCloseDayPanel() {
    this.setData({ showDayPanel: false, selectedYmd: '' }, () => this.refreshCalendar())
  },

  onDayPanelMask() {
    this.onCloseDayPanel()
  },

  panelNoop() {},

  onStatsTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === 'custom') {
      const now = new Date()
      const r = monthStartToTodayYmdRange(now)
      const patch = { statsTab: tab }
      if (!(this.data.customStartYmd && this.data.customEndYmd)) {
        patch.customStartYmd = r.start
        patch.customEndYmd = r.end
      }
      this.setData(patch, () => this.refreshStats())
      return
    }
    this.setData({ statsTab: tab }, () => this.refreshStats())
  },

  onCustomStartChange(e) {
    const v = e.detail.value
    let end = this.data.customEndYmd
    if (end && v > end) end = v
    this.setData({ customStartYmd: v, customEndYmd: end }, () => this.refreshStats())
  },

  onCustomEndChange(e) {
    const v = e.detail.value
    let start = this.data.customStartYmd
    if (start && v < start) start = v
    this.setData({ customStartYmd: start, customEndYmd: v }, () => this.refreshStats())
  },

  onTagRowToggle(e) {
    const kind = e.currentTarget.dataset.kind
    const idx = Number(e.currentTarget.dataset.idx)
    if (kind === 'pos') {
      const positionTagRows = this.data.positionTagRows.map((r, i) => {
        if (i !== idx) return r
        return Object.assign({}, r, { open: !r.open })
      })
      this.setData({ positionTagRows })
    } else {
      const actionTagRows = this.data.actionTagRows.map((r, i) => {
        if (i !== idx) return r
        return Object.assign({}, r, { open: !r.open })
      })
      this.setData({ actionTagRows })
    }
  },

  refreshStats() {
    const { statsTab, customStartYmd, customEndYmd } = this.data
    const now = new Date()
    let start
    let end
    let statsRangeLabel

    if (statsTab === 'week') {
      const r = mondayWeekYmdRange(now)
      start = r.start
      end = r.end
      statsRangeLabel = `本周（${start.slice(5)} ~ ${end.slice(5)}）`
    } else if (statsTab === 'month') {
      const r = currentMonthYmdRange(now)
      start = r.start
      end = r.end
      statsRangeLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`
    } else if (statsTab === 'year') {
      const y = now.getFullYear()
      start = `${y}-01-01`
      end = `${y}-12-31`
      statsRangeLabel = `${y}年`
    } else {
      let s = (customStartYmd || '').trim()
      let e = (customEndYmd || '').trim()
      if (!s || !e) {
        const r = monthStartToTodayYmdRange(now)
        s = r.start
        e = r.end
      }
      if (s > e) {
        const t = s
        s = e
        e = t
      }
      start = s
      end = e
      statsRangeLabel = `${start.slice(5)} ~ ${end.slice(5)}`
    }

    const inRange = y => y && y >= start && y <= end

    const flows = storage.getAllFlows().filter(f => inRange(util.effectiveRecordDate(f)))
    const techs = storage.getAllTechniques().filter(t => inRange(util.effectiveRecordDate(t)))
    const insights = storage.getAllInsights().filter(x => inRange(util.effectiveRecordDate(x)))
    const sessions = storage.getAllSessionRecords().filter(s => inRange(util.effectiveRecordDate(s)))

    const recordDaySet = new Set()
    flows.forEach(f => recordDaySet.add(util.effectiveRecordDate(f)))
    techs.forEach(t => recordDaySet.add(util.effectiveRecordDate(t)))
    insights.forEach(x => recordDaySet.add(util.effectiveRecordDate(x)))
    sessions.forEach(s => recordDaySet.add(util.effectiveRecordDate(s)))

    const classDaySet = new Set()
    sessions.forEach(s => classDaySet.add(util.effectiveRecordDate(s)))

    const positionTagRows = buildPositionTagRows(techs)
    const actionTagRows = buildActionTagRows(techs)

    this.setData({
      statsRangeLabel,
      summaryClassDays: classDaySet.size,
      summaryTech: techs.length,
      summaryInsight: insights.length,
      summaryRecordDays: recordDaySet.size,
      positionTagRows,
      actionTagRows,
    })
  },
})

const storage = require('../../utils/storage')
const util = require('../../utils/util')
const flowSegUtil = require('../../utils/flowSegments')
const {
  TECH_POSITION_OPTIONS,
  TECH_POSITION_LABELS,
  POSITION_LABELS,
  ACTION_LABELS,
  ACTION_OPTIONS,
  formatTechPosition,
  formatTechAction,
  START_POSITION_LABELS,
  TOP_ACTION_LABELS,
  BOTTOM_ACTION_LABELS,
  formatSessionClassStateLabel,
  formatSessionPainTagLabel,
} = require('../../utils/constants')

/** 训练日期 YYYY-MM-DD → 2026年4月19日 */
function formatSessionYmdDisplay(ymd) {
  if (!ymd || String(ymd).length < 10) return ''
  const parts = String(ymd).split('-')
  const y = parts[0]
  const m = Number(parts[1])
  const d = Number(parts[2])
  if (!y || Number.isNaN(m) || Number.isNaN(d)) return ''
  return `${y}年${m}月${d}日`
}

function formatSessionPainTagsLine(s) {
  if (!s.painTags || !Array.isArray(s.painTags) || s.painTags.length === 0) return ''
  return s.painTags.map(t => formatSessionPainTagLabel(t)).filter(Boolean).join('、')
}

function formatSessionListItem(s) {
  const ymd = util.effectiveRecordDate(s)
  const st = s.classState ? formatSessionClassStateLabel(s.classState) : ''
  const painTagsLine = formatSessionPainTagsLine(s)
  const pain = (s.painDescription && String(s.painDescription).trim()) || ''
  const pr = (s.practiceNotes && String(s.practiceNotes).trim()) || ''
  const subParts = []
  if (st) subParts.push(st)
  if (painTagsLine) subParts.push(painTagsLine)
  if (pain) subParts.push(pain.length > 28 ? `${pain.slice(0, 28)}…` : pain)
  const subText = subParts.length ? subParts.join(' · ') : ''
  const dateDisp = formatSessionYmdDisplay(ymd)
  const name = dateDisp ? `实战 ${dateDisp}` : '实战记录'
  const searchBlob = `${ymd} ${st} ${painTagsLine} ${pain} ${pr}`.toLowerCase()
  const sessionPreview = pr ? (pr.length > 80 ? `${pr.slice(0, 80)}…` : pr) : ''
  return {
    uid: `session_${s.id}`,
    recordType: 'session',
    id: s.id,
    name,
    subText,
    sessionDateDisplay: formatSessionYmdDisplay(ymd),
    sessionSearchLower: searchBlob,
    sessionPreview,
    recordYmd: ymd,
    updatedAt: s.updatedAt || s.createdAt || 0,
    position: '',
    action: '',
  }
}

function pad2(n) {
  return String(n).padStart(2, '0')
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

function monthStartToTodayYmdRange(ref) {
  const d = new Date(ref)
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  return {
    start: `${y}-${pad2(m)}-01`,
    end: util.ymdFromDate(d),
  }
}

function formatFlowStart(flow) {
  if (!flow) return '未设置'
  if (flow.contentFormat === 2 && Array.isArray(flow.segments)) {
    const raw = flowSegUtil.segmentsToPreviewString(flow.segments).replace(/\s+/g, ' ').trim()
    if (!raw) return '文本流程'
    return raw.length > 32 ? `${raw.slice(0, 32)}…` : raw
  }
  if (flow.startPosition === 'top' && flow.startAction) {
    return `${START_POSITION_LABELS.top} · ${TOP_ACTION_LABELS[flow.startAction] || flow.startAction}`
  }
  if (flow.startPosition === 'bottom' && flow.startAction) {
    return `${START_POSITION_LABELS.bottom} · ${BOTTOM_ACTION_LABELS[flow.startAction] || flow.startAction}`
  }
  return flow.startPosition || '未设置'
}

Page({
  data: {
    recentItemsRaw: [],
    filteredRecent: [],
    showFilterPanel: false,
    recordKindFilter: 'all',
    filterPosition: '',
    filterAction: '',
    positionFilterTags: [],
    actionFilterTags: [],
    searchText: '',
    filterActive: false,
    draftKind: 'all',
    draftPosition: '',
    draftAction: '',
    timeRangeTab: 'all',
    customStartYmd: '',
    customEndYmd: '',
  },

  _skipNextItemTap: false,

  onShow() {
    if (this.data.recordKindFilter === 'flow') {
      this.setData({ recordKindFilter: 'all', filterPosition: '', filterAction: '' }, () =>
        this.refreshRecentList(),
      )
      return
    }
    this.refreshRecentList()
  },

  onShareAppMessage() {
    return {
      title: 'Echo的柔术记录',
      path: '/pages/index/index',
    }
  },

  onShareTimeline() {
    return {
      title: 'Echo的柔术记录',
    }
  },

  refreshRecentList() {
    const flows = storage.getAllFlows().map(f => ({
      ...f,
      startText: formatFlowStart(f),
    }))
    const techniques = storage.getAllTechniques()
    const custom = storage.getCustomTechTags()

    const positionFilterTags = [
      { key: '__all__', label: '全部位置' },
      ...TECH_POSITION_OPTIONS.map(key => ({ key, label: TECH_POSITION_LABELS[key] || key })),
      ...custom.positions.map(p => ({ key: p, label: p })),
    ]
    const actionFilterTags = [
      { key: '__all__', label: '全部动作' },
      ...ACTION_OPTIONS.map(key => ({ key, label: ACTION_LABELS[key] || key })),
      ...custom.actions.map(a => ({ key: a, label: a })),
    ]

    const flowItems = flows.map(f => ({
      uid: `flow_${f.id}`,
      recordType: 'flow',
      id: f.id,
      name: f.name,
      subText: f.startText || '未设置',
      recordYmd: util.effectiveRecordDate(f),
      updatedAt: f.updatedAt || f.createdAt || 0,
      position: '',
      action: '',
    }))
    const techItems = techniques.map(t => {
      const techNotes = (t.notes && String(t.notes).trim()) || ''
      return {
        uid: `tech_${t.id}`,
        recordType: 'tech',
        id: t.id,
        name: t.name,
        subText: [formatTechPosition(t.position), formatTechAction(t.action)].filter(Boolean).join(' · '),
        techNotes,
        techNotesLower: techNotes.toLowerCase(),
        updatedAt: t.updatedAt || t.createdAt || 0,
        position: t.position || '',
        action: t.action || '',
        posLabel: formatTechPosition(t.position),
        actLabel: formatTechAction(t.action),
        recordYmd: util.effectiveRecordDate(t),
      }
    })

    const sessions = storage.getAllSessionRecords()
    const sessionItems = sessions.map(formatSessionListItem)

    const insights = storage.getAllInsights()
    const insightItems = insights.map(ins => {
      const ymd = util.effectiveRecordDate(ins)
      const body = (ins.body && String(ins.body).trim()) || ''
      const bodyPrev = body.length > 80 ? `${body.slice(0, 80)}…` : body
      return {
        uid: `insight_${ins.id}`,
        recordType: 'insight',
        id: ins.id,
        name: ins.title || '未命名心得',
        subText: ymd ? `日期：${ymd}` : '',
        insightPreview: bodyPrev,
        insightBodyLower: body.toLowerCase(),
        updatedAt: ins.updatedAt || ins.createdAt || 0,
        position: '',
        action: '',
        recordYmd: util.effectiveRecordDate(ins),
      }
    })

    const recentItemsRaw = [...flowItems, ...sessionItems, ...techItems, ...insightItems].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    )

    this.setData(
      {
        flows,
        techniques,
        recentItemsRaw,
        positionFilterTags,
        actionFilterTags,
      },
      () => this.applyRecentFilters(),
    )
  },

  applyRecentFilters() {
    const {
      recentItemsRaw,
      recordKindFilter,
      filterPosition,
      filterAction,
      searchText,
    } = this.data

    let list = recentItemsRaw.slice()

    if (recordKindFilter === 'flow') {
      list = list.filter(i => i.recordType === 'flow')
    } else if (recordKindFilter === 'session') {
      list = list.filter(i => i.recordType === 'session')
    } else if (recordKindFilter === 'tech') {
      list = list.filter(i => i.recordType === 'tech')
    } else if (recordKindFilter === 'insight') {
      list = list.filter(i => i.recordType === 'insight')
    }

    if (recordKindFilter === 'tech') {
      if (filterPosition) {
        list = list.filter(i => i.recordType !== 'tech' || i.position === filterPosition)
      }
      if (filterAction) {
        list = list.filter(i => i.recordType !== 'tech' || i.action === filterAction)
      }
    }

    const { timeRangeTab, customStartYmd, customEndYmd } = this.data
    if (timeRangeTab !== 'all') {
      const now = new Date()
      let start
      let end
      if (timeRangeTab === 'week') {
        const r = mondayWeekYmdRange(now)
        start = r.start
        end = r.end
      } else if (timeRangeTab === 'month') {
        const r = currentMonthYmdRange(now)
        start = r.start
        end = r.end
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
      }
      list = list.filter(i => {
        const y = i.recordYmd || ''
        return y && y >= start && y <= end
      })
    }

    const q = (searchText || '').trim().toLowerCase()
    if (q) {
      list = list.filter(i => {
        const name = (i.name || '').toLowerCase()
        if (name.includes(q)) return true
        if (i.recordType === 'flow') return (i.subText || '').toLowerCase().includes(q)
        if (i.recordType === 'session') {
          return (i.name || '').toLowerCase().includes(q) || (i.sessionSearchLower || '').includes(q)
        }
        if (i.recordType === 'insight') {
          return (i.subText || '').toLowerCase().includes(q) || (i.insightBodyLower || '').includes(q)
        }
        const pos = (i.posLabel || '').toLowerCase()
        const act = (i.actLabel || '').toLowerCase()
        const note = (i.techNotesLower || '').toLowerCase()
        return pos.includes(q) || act.includes(q) || note.includes(q)
      })
    }

    const filterActive =
      recordKindFilter !== 'all' ||
      (recordKindFilter === 'tech' && (Boolean(filterPosition) || Boolean(filterAction))) ||
      timeRangeTab !== 'all'

    this.setData({ filteredRecent: list, filterActive })
  },

  onTodayTrainingTap() {
    getApp().globalData.resetAddForm = true
    wx.switchTab({ url: '/pages/add/add' })
  },

  onItemTap(e) {
    if (this._skipNextItemTap) {
      this._skipNextItemTap = false
      return
    }
    const id = e.currentTarget.dataset.id
    const type = e.currentTarget.dataset.type
    if (type === 'flow') {
      wx.navigateTo({ url: `/pages/classDetail/classDetail?id=${id}` })
    } else if (type === 'session') {
      wx.navigateTo({ url: `/pages/sessionDetail/sessionDetail?id=${id}` })
    } else if (type === 'insight') {
      wx.navigateTo({ url: `/pages/insightDetail/insightDetail?id=${id}` })
    } else {
      wx.navigateTo({ url: `/pages/techDetail/techDetail?id=${id}` })
    }
  },

  onItemLongPress(e) {
    this._skipNextItemTap = true
    const id = e.currentTarget.dataset.id
    const type = e.currentTarget.dataset.type
    const rawName = e.currentTarget.dataset.name
    const name = (rawName != null && String(rawName).trim()) ? String(rawName).trim() : '未命名'
    const displayName = name.length > 36 ? `${name.slice(0, 36)}…` : name
    const kind =
      type === 'flow' ? '流程' : type === 'session' ? '实战表现' : type === 'insight' ? '心得' : '招式'
    wx.showModal({
      title: '删除记录',
      content: `确定删除${kind}「${displayName}」吗？删除后无法恢复。`,
      confirmText: '删除',
      confirmColor: '#b91c1c',
      success: res => {
        if (!res.confirm) return
        if (type === 'flow') {
          storage.deleteFlow(id)
        } else if (type === 'session') {
          storage.deleteSessionRecord(id)
        } else if (type === 'insight') {
          storage.deleteInsight(id)
        } else {
          storage.deleteTechnique(id)
        }
        wx.showToast({ title: '已删除', icon: 'success' })
        this.refreshRecentList()
      },
    })
  },

  onOpenFilter() {
    const { recordKindFilter, filterPosition, filterAction } = this.data
    let kind = recordKindFilter
    if (kind === 'flow') {
      kind = 'all'
    }
    const techOnly = kind === 'tech'
    this.setData({
      showFilterPanel: true,
      draftKind: kind,
      draftPosition: techOnly ? filterPosition : '',
      draftAction: techOnly ? filterAction : '',
    })
  },

  onCloseFilter() {
    this.setData({ showFilterPanel: false })
  },

  onFilterMaskTap() {
    this.setData({ showFilterPanel: false })
  },

  filterNoop() {},

  onDraftKindTap(e) {
    const val = e.currentTarget.dataset.val || 'all'
    if (val === 'tech') {
      this.setData({ draftKind: 'tech' })
    } else {
      this.setData({ draftKind: val, draftPosition: '', draftAction: '' })
    }
  },

  onDraftPositionTap(e) {
    const raw = e.currentTarget.dataset.key
    this.setData({ draftPosition: raw === '__all__' ? '' : raw })
  },

  onDraftActionTap(e) {
    const raw = e.currentTarget.dataset.key
    this.setData({ draftAction: raw === '__all__' ? '' : raw })
  },

  onApplyFilter() {
    const { draftKind, draftPosition, draftAction } = this.data
    const tech = draftKind === 'tech'
    this.setData(
      {
        recordKindFilter: draftKind,
        filterPosition: tech ? draftPosition : '',
        filterAction: tech ? draftAction : '',
        showFilterPanel: false,
      },
      () => this.applyRecentFilters(),
    )
  },

  onResetFilter() {
    this.setData(
      {
        recordKindFilter: 'all',
        filterPosition: '',
        filterAction: '',
        draftKind: 'all',
        draftPosition: '',
        draftAction: '',
        showFilterPanel: false,
        timeRangeTab: 'all',
        customStartYmd: '',
        customEndYmd: '',
      },
      () => this.applyRecentFilters(),
    )
  },

  onSearchInput(e) {
    this.setData({ searchText: e.detail.value }, () => this.applyRecentFilters())
  },

  onTimeRangeTab(e) {
    const tab = e.currentTarget.dataset.tab || 'all'
    if (tab === 'custom') {
      const now = new Date()
      const r = monthStartToTodayYmdRange(now)
      const patch = { timeRangeTab: tab }
      if (!(this.data.customStartYmd && this.data.customEndYmd)) {
        patch.customStartYmd = r.start
        patch.customEndYmd = r.end
      }
      this.setData(patch, () => this.applyRecentFilters())
      return
    }
    this.setData({ timeRangeTab: tab }, () => this.applyRecentFilters())
  },

  onIndexCustomStartChange(e) {
    const v = e.detail.value
    let end = this.data.customEndYmd
    if (end && v > end) end = v
    this.setData({ customStartYmd: v, customEndYmd: end }, () => this.applyRecentFilters())
  },

  onIndexCustomEndChange(e) {
    const v = e.detail.value
    let start = this.data.customStartYmd
    if (start && v < start) start = v
    this.setData({ customStartYmd: start, customEndYmd: v }, () => this.applyRecentFilters())
  },

})

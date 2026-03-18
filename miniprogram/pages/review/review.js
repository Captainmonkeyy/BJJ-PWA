const storage = require('../../utils/storage')
const util = require('../../utils/util')
const {
  POSITION_LABELS,
  ACTION_LABELS,
  POSITION_OPTIONS,
  ACTION_OPTIONS,
} = require('../../utils/constants')

function flattenTechniques(classes) {
  const result = []
  for (const cls of classes) {
    for (const t of cls.techniques) {
      result.push({ ...t, classDate: cls.date, classId: cls.id })
    }
  }
  return result
}

Page({
  data: {
    techniques: [],
    grouped: [],
    timeFilter: 'month',
    positionFilter: '',
    actionFilter: '',
    timeOptions: [
      { value: 'week', label: '过去一周' },
      { value: 'month', label: '过去一个月' },
      { value: '3months', label: '过去三个月' },
      { value: 'all', label: '全部' },
    ],
    POSITION_OPTIONS,
    ACTION_OPTIONS,
    POSITION_LABELS,
    ACTION_LABELS,
  },

  onShow() {
    this.filterTechniques()
  },

  filterTechniques() {
    const classes = storage.getAll()
    let techs = flattenTechniques(classes)

    const now = new Date()
    const cutoff =
      this.data.timeFilter === 'week'
        ? util.subDays(now, 7)
        : this.data.timeFilter === 'month'
        ? util.subDays(now, 30)
        : this.data.timeFilter === '3months'
        ? util.subDays(now, 90)
        : null

    if (cutoff) {
      const cutoffTime = cutoff.getTime()
      techs = techs.filter(t => new Date(t.classDate).getTime() >= cutoffTime)
    }
    if (this.data.positionFilter) {
      techs = techs.filter(t => t.tags.position === this.data.positionFilter)
    }
    if (this.data.actionFilter) {
      techs = techs.filter(t => t.tags.action === this.data.actionFilter)
    }

    techs.sort((a, b) => new Date(b.classDate).getTime() - new Date(a.classDate).getTime())

    const techniques = techs.map(t => ({
      ...t,
      dateText: util.formatDateShort(t.classDate),
    }))

    const grouped = this.buildGrouped(techniques)
    this.setData({ techniques, grouped })
  },

  buildGrouped(techniques) {
    const { actionFilter, positionFilter, POSITION_LABELS, ACTION_LABELS, POSITION_OPTIONS, ACTION_OPTIONS } = this.data
    if (techniques.length === 0) return []

    if (actionFilter) {
      const byPosition = {}
      techniques.forEach(t => {
        const key = t.tags.position || '_other'
        if (!byPosition[key]) byPosition[key] = { label: POSITION_LABELS[t.tags.position] || '其他', items: [] }
        byPosition[key].items.push(t)
      })
      const order = [...POSITION_OPTIONS, '_other']
      return order.filter(k => byPosition[k]).map(key => ({ type: 'position', key, label: byPosition[key].label, items: byPosition[key].items }))
    }
    if (positionFilter) {
      const byAction = {}
      techniques.forEach(t => {
        const key = t.tags.action || '_other'
        if (!byAction[key]) byAction[key] = { label: ACTION_LABELS[t.tags.action] || '其他', items: [] }
        byAction[key].items.push(t)
      })
      const order = [...ACTION_OPTIONS, '_other']
      return order.filter(k => byAction[k]).map(key => ({ type: 'action', key, label: byAction[key].label, items: byAction[key].items }))
    }
    return [{ type: 'flat', key: 'flat', items: techniques }]
  },

  onTimeFilter(e) {
    this.setData({ timeFilter: e.currentTarget.dataset.val }, () => this.filterTechniques())
  },

  onPositionFilter(e) {
    this.setData({ positionFilter: e.currentTarget.dataset.val || '' }, () => this.filterTechniques())
  },

  onActionFilter(e) {
    this.setData({ actionFilter: e.currentTarget.dataset.val || '' }, () => this.filterTechniques())
  },

  onQuickAction(e) {
    const val = e.currentTarget.dataset.val
    this.setData({ actionFilter: val, positionFilter: '' }, () => this.filterTechniques())
  },

  onQuickPosition(e) {
    const val = e.currentTarget.dataset.val
    this.setData({ positionFilter: val, actionFilter: '' }, () => this.filterTechniques())
  },

  onTechTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/classDetail/classDetail?id=${id}` })
  },
})

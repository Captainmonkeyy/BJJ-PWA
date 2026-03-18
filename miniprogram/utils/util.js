function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const m = d.getMonth() + 1
  const day = d.getDate()
  const w = WEEK_DAYS[d.getDay()]
  return `${m}月${day}日 ${w}`
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function subDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}

function isAfter(d1, d2) {
  return new Date(d1).getTime() > new Date(d2).getTime()
}

module.exports = { generateId, formatDate, formatDateShort, subDays, isAfter }

/**
 * 训练数据导出为 UTF-8 文本（顺序：实战表现 → 招式 → 心得；字段与「新建」页一致）
 */
const storage = require('./storage')
const util = require('./util')
const {
  formatTechPosition,
  formatTechAction,
  formatSessionClassStateLabel,
  formatSessionPainTagLabel,
} = require('./constants')

const CELL_MAX = 32000

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatTs(ts) {
  if (ts == null || ts === '') return ''
  const d = new Date(Number(ts))
  if (Number.isNaN(d.getTime())) return String(ts)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function trunc(s) {
  const t = s == null ? '' : String(s)
  if (t.length <= CELL_MAX) return t
  return `${t.slice(0, CELL_MAX - 1)}…`
}

function sessionPainTagsLine(s) {
  if (!s.painTags || !Array.isArray(s.painTags) || s.painTags.length === 0) return ''
  return s.painTags.map(t => formatSessionPainTagLabel(t)).filter(Boolean).join('、')
}

function teachLinksText(tech) {
  const links = util.getTeachVideoLinksFromTech(tech)
  if (!links.length) return ''
  return links
    .map(l => {
      const u = (l.url || '').trim()
      const t = (l.title || '').trim()
      return t ? `${t}  ${u}` : u
    })
    .filter(Boolean)
    .join('\n')
}

function sortByUpdatedDesc(list) {
  return list.slice().sort((a, b) => {
    const ta = a.updatedAt || a.createdAt || 0
    const tb = b.updatedAt || b.createdAt || 0
    return tb - ta
  })
}

const SEP_MAJOR = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
const SEP_MINOR = '────────────────────────'

function buildExportText() {
  const sessions = sortByUpdatedDesc(storage.getAllSessionRecords())
  const techs = sortByUpdatedDesc(storage.getAllTechniques())
  const insights = sortByUpdatedDesc(storage.getAllInsights())

  const blocks = []
  blocks.push('柔术记录本 · 训练数据')
  blocks.push(`生成时间：${formatTs(Date.now())}`)
  blocks.push('')

  // 一、实战表现
  blocks.push(SEP_MAJOR)
  blocks.push('一、实战表现')
  blocks.push(SEP_MAJOR)
  blocks.push('')
  if (sessions.length === 0) {
    blocks.push('（暂无记录）')
    blocks.push('')
  } else {
    sessions.forEach((s, i) => {
      if (i > 0) {
        blocks.push(SEP_MINOR)
        blocks.push('')
      }
      blocks.push(`训练日期：${util.effectiveRecordDate(s)}`)
      blocks.push(`上课状态：${s.classState ? formatSessionClassStateLabel(s.classState) : '（未填）'}`)
      blocks.push(`疼痛部位：${sessionPainTagsLine(s) || '（未填）'}`)
      blocks.push(`疼痛文字补充：${trunc((s.painDescription && String(s.painDescription).trim()) || '（未填）')}`)
      blocks.push('实战表现：')
      blocks.push(trunc((s.practiceNotes && String(s.practiceNotes).trim()) || '（未填）'))
      blocks.push(`更新时间：${formatTs(s.updatedAt || s.createdAt)}`)
      blocks.push('')
    })
  }

  // 二、招式
  blocks.push(SEP_MAJOR)
  blocks.push('二、招式')
  blocks.push(SEP_MAJOR)
  blocks.push('')
  if (techs.length === 0) {
    blocks.push('（暂无记录）')
    blocks.push('')
  } else {
    techs.forEach((t, i) => {
      if (i > 0) {
        blocks.push(SEP_MINOR)
        blocks.push('')
      }
      blocks.push(`训练日期：${util.effectiveRecordDate(t)}`)
      blocks.push(`招式名称：${t.name || '（未命名）'}`)
      blocks.push(`位置：${formatTechPosition(t.position) || '（未填）'}`)
      blocks.push(`动作类型：${formatTechAction(t.action) || '（未填）'}`)
      blocks.push('招式解说：')
      blocks.push(trunc((t.notes && String(t.notes).trim()) || '（未填）'))
      const links = teachLinksText(t)
      blocks.push('教学视频链接：')
      blocks.push(links ? trunc(links) : '（未填）')
      blocks.push(`更新时间：${formatTs(t.updatedAt || t.createdAt)}`)
      blocks.push('')
    })
  }

  // 三、心得
  blocks.push(SEP_MAJOR)
  blocks.push('三、心得')
  blocks.push(SEP_MAJOR)
  blocks.push('')
  if (insights.length === 0) {
    blocks.push('（暂无记录）')
    blocks.push('')
  } else {
    insights.forEach((x, i) => {
      if (i > 0) {
        blocks.push(SEP_MINOR)
        blocks.push('')
      }
      blocks.push(`日期：${util.effectiveRecordDate(x)}`)
      blocks.push(`标题：${x.title || '（未命名）'}`)
      blocks.push('正文：')
      blocks.push(trunc((x.body && String(x.body).trim()) || '（未填）'))
      blocks.push(`更新时间：${formatTs(x.updatedAt || x.createdAt)}`)
      blocks.push('')
    })
  }

  return blocks.join('\n')
}

function writeExportTxtFile() {
  const body = buildExportText()
  const ymd = util.todayYMD().replace(/-/g, '')
  const fileName = `柔术训练数据_${ymd}.txt`
  const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
  wx.getFileSystemManager().writeFileSync(filePath, `\uFEFF${body}`, 'utf8')
  return { filePath, fileName }
}

module.exports = {
  writeExportTxtFile,
}

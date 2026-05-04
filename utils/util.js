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

function pad2(n) {
  return String(n).padStart(2, '0')
}

/** 本地日历日 YYYY-MM-DD */
function ymdFromDate(d) {
  const x = new Date(d)
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`
}

function todayYMD() {
  return ymdFromDate(new Date())
}

function ymdFromTimestamp(ts) {
  return ymdFromDate(new Date(ts))
}

/**
 * 保存时解析训练日期：表单有值用表单；编辑沿用已有 recordDate 或原更新时间对应日；新建默认今天。
 */
function resolveRecordDateOnSave(formRecordDate, existingEntity) {
  const s = (formRecordDate || '').trim()
  if (s) return s
  if (existingEntity) {
    if (existingEntity.recordDate && String(existingEntity.recordDate).trim()) {
      return String(existingEntity.recordDate).trim()
    }
    return ymdFromTimestamp(existingEntity.updatedAt || existingEntity.createdAt || Date.now())
  }
  return todayYMD()
}

/** 展示/统计用：优先 recordDate，否则用更新时间对应日期 */
function effectiveRecordDate(entity) {
  if (!entity) return ''
  if (entity.recordDate && String(entity.recordDate).trim()) return String(entity.recordDate).trim()
  return ymdFromTimestamp(entity.updatedAt || entity.createdAt || Date.now())
}

/** 去掉零宽字符等，避免粘贴链接被误判 */
function sanitizeUrlInput(input) {
  return String(input || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\uFF1A/g, ':')
    .trim()
}

/**
 * 教学视频等外链：补全 https、校验是否为 http(s) 网页地址。
 */
function normalizeHttpUrl(input) {
  const s = sanitizeUrlInput(input)
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  if (/^\/\//.test(s)) return 'https:' + s
  if (/^[a-z0-9][a-z0-9+.-]*:\/\//i.test(s)) return s
  const rest = s.replace(/^\/+/, '')
  if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(rest) || /^www\./i.test(rest)) {
    return 'https://' + rest
  }
  return s
}

/** 不依赖 URL 构造函数的宽松校验（兼容部分无 URL API 的小程序运行环境） */
function looksLikeValidHttpUrl(n) {
  if (!n || /\s/.test(n)) return false
  return /^https?:\/\/\S+$/i.test(n)
}

function isValidWebUrl(input) {
  const n = normalizeHttpUrl(input)
  if (!looksLikeValidHttpUrl(n)) return false
  if (typeof URL !== 'function') return true
  try {
    const u = new URL(n)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch (e) {
    return looksLikeValidHttpUrl(n)
  }
}

/** 从 http(s) 串中取出 host（无 URL API 时用正则） */
function hostFromHttpUrlString(n) {
  const m = /^https?:\/\/([^/?#]+)/i.exec(n)
  if (!m) return ''
  return m[1].replace(/^www\./i, '')
}

/**
 * 解析常见平台分享粘贴：标题文案 https://b23.tv/xxx
 * 将链接填入 url，链接前整段文字作为显示标题（若整段仅为「【xxx】」则去掉括号取 xxx）。
 */
function parsePastedVideoShareLine(raw) {
  const s = sanitizeUrlInput(raw)
  if (!s) return { url: '', title: '' }

  const urlRe = /https?:\/\/[^\s【】\u3000]+/gi
  const m = urlRe.exec(s)
  let url = ''
  let title = ''

  if (m) {
    let candidate = m[0]
    candidate = candidate.replace(/[，。,.;；:：）)】\]]+$/g, '')
    url = normalizeHttpUrl(candidate)
    if (url && !looksLikeValidHttpUrl(url)) {
      url = ''
    }
    if (url) {
      const before = s.slice(0, m.index).trim()
      if (before) {
        const wrapped = before.match(/^【([^】]+)】$/)
        title = wrapped ? wrapped[1].trim() : before
      }
    }
  } else {
    const rest = s.replace(/^[^\w.:/]+/, '').trim()
    if (rest) url = normalizeHttpUrl(rest)
    if (url && !looksLikeValidHttpUrl(url)) {
      url = ''
    }
  }

  return { url: url || '', title }
}

/** 编辑表单：从招式实体得到链接行（含 _id 供 wx:for） */
function getTeachVideoLinksFromTech(tech) {
  const row = () => ({ _id: generateId(), url: '', title: '' })
  if (!tech) return [row()]
  if (Array.isArray(tech.teachVideoLinks) && tech.teachVideoLinks.length) {
    return tech.teachVideoLinks.map(l => ({
      _id: l._id || generateId(),
      url: l.url || '',
      title: l.title != null ? String(l.title) : '',
    }))
  }
  if (tech.teachVideoUrl) {
    return [{ _id: generateId(), url: tech.teachVideoUrl, title: tech.teachVideoTitle || '' }]
  }
  return [row()]
}

/**
 * 保存前校验并生成 teachVideoLinks；首条同步到 teachVideoUrl/teachVideoTitle 以兼容旧逻辑。
 */
function normalizeTeachVideoLinksForSave(links) {
  const out = []
  for (const row of links || []) {
    const u = (row.url || '').trim()
    const t = (row.title || '').trim()
    if (t && !u) {
      return { ok: false, msg: '已填写显示名称时请同时填写对应链接' }
    }
    if (!u) continue
    const norm = normalizeHttpUrl(u)
    if (!isValidWebUrl(norm)) {
      return { ok: false, msg: '请输入有效的网页链接（http/https）' }
    }
    out.push({ url: norm, title: t })
  }
  return {
    ok: true,
    teachVideoLinks: out,
    teachVideoUrl: out[0] ? out[0].url : '',
    teachVideoTitle: out[0] ? out[0].title : '',
  }
}

/** 详情页：多链接展示行 */
function getTeachVideoRowsForDetail(tech) {
  const rows = []
  if (!tech) return rows
  if (Array.isArray(tech.teachVideoLinks) && tech.teachVideoLinks.length) {
    tech.teachVideoLinks.forEach(l => {
      if (!l || !l.url) return
      const u = normalizeHttpUrl(l.url)
      if (!u || !isValidWebUrl(u)) return
      rows.push({
        url: u,
        displayLabel: webUrlDisplayLabel(l.url, l.title),
      })
    })
    return rows
  }
  if (tech.teachVideoUrl) {
    const u = normalizeHttpUrl(tech.teachVideoUrl)
    if (u && isValidWebUrl(u)) {
      rows.push({
        url: u,
        displayLabel: webUrlDisplayLabel(tech.teachVideoUrl, tech.teachVideoTitle),
      })
    }
  }
  return rows
}

/** 展示用：优先自定义名称，否则取域名 */
function webUrlDisplayLabel(url, customTitle) {
  const t = (customTitle || '').trim()
  if (t) return t
  const n = normalizeHttpUrl(url)
  if (!n) return '打开链接'
  if (typeof URL === 'function') {
    try {
      const u = new URL(n)
      const host = u.hostname.replace(/^www\./i, '')
      return host || '打开链接'
    } catch (e) {
      /* fall through */
    }
  }
  const host = hostFromHttpUrlString(n)
  return host || '打开链接'
}

module.exports = {
  generateId,
  formatDate,
  formatDateShort,
  subDays,
  isAfter,
  todayYMD,
  ymdFromDate,
  ymdFromTimestamp,
  resolveRecordDateOnSave,
  effectiveRecordDate,
  normalizeHttpUrl,
  isValidWebUrl,
  webUrlDisplayLabel,
  parsePastedVideoShareLine,
  getTeachVideoLinksFromTech,
  normalizeTeachVideoLinksForSave,
  getTeachVideoRowsForDetail,
}
